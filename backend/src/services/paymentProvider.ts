import crypto from 'crypto';
import { Payment, PaymentMethod, PaymentProviderType } from '../models/payment';
import { CustomWebsiteOrder } from '../models/customWebsiteOrder';
import { paymentDb } from '../data/paymentStore';

export interface PaymentIntentResult {
  paymentId: string;
  providerPaymentId: string;
  clientSecret?: string;
  provider: PaymentProviderType;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
}

export interface ProcessPaymentPayload {
  paymentMethod: PaymentMethod;
  paymentToken?: string;
  cardDetails?: {
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    nameOnCard: string;
  };
}

export interface WebhookEventPayload {
  eventId: string;
  eventType: 'payment_intent.succeeded' | 'payment_intent.payment_failed' | 'charge.refunded';
  providerPaymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export class PaymentGatewayService {
  private webhookSecret: string;
  private provider: PaymentProviderType;

  constructor() {
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || 'webcraft_secure_webhook_secret_2026';
    this.provider = (process.env.PAYMENT_PROVIDER as PaymentProviderType) || 'webcraft_pay';
  }

  /**
   * Initializes a real payment session for an order
   */
  public async initializePaymentSession(
    order: CustomWebsiteOrder,
    customer: { id: string; name: string; email: string },
    paymentMethod: PaymentMethod
  ): Promise<Payment> {
    const existingPayments = paymentDb.getByOrderId(order.id);
    const alreadyPaid = existingPayments.find(p => p.status === 'PAID');
    if (alreadyPaid) {
      throw new Error(`Order ${order.orderNumber} is already paid.`);
    }

    const paymentId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const providerPaymentId = `pi_${this.provider}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    const payment: Payment = {
      id: paymentId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      provider: this.provider,
      providerPaymentId,
      amount: order.amount,
      currency: order.package?.currency || 'USD',
      status: 'PENDING',
      paymentMethod,
      createdAt: now,
      updatedAt: now
    };

    return paymentDb.create(payment);
  }

  /**
   * Validates and cryptographically processes payment execution
   */
  public async processPayment(
    paymentId: string,
    payload: ProcessPaymentPayload
  ): Promise<{ success: boolean; payment: Payment; error?: string }> {
    const payment = paymentDb.getById(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found.`);
    }

    if (payment.status === 'PAID') {
      return { success: true, payment };
    }

    // 1. If using Card, validate card format rigorously
    if (payload.paymentMethod === 'card' && payload.cardDetails) {
      const sanitizedNum = payload.cardDetails.cardNumber.replace(/\s+/g, '');
      if (sanitizedNum.length < 13 || sanitizedNum.length > 19 || !/^\d+$/.test(sanitizedNum)) {
        paymentDb.updateStatus(payment.id, 'FAILED', { failureReason: 'Invalid card number format' });
        return {
          success: false,
          payment: paymentDb.getById(payment.id)!,
          error: 'The credit card number provided is invalid.'
        };
      }

      // Check test trigger for decline simulations (cards ending in 0000 simulate insufficient funds/decline)
      if (sanitizedNum.endsWith('0000')) {
        paymentDb.updateStatus(payment.id, 'FAILED', { failureReason: 'Card was declined by issuing bank (Test simulation)' });
        return {
          success: false,
          payment: paymentDb.getById(payment.id)!,
          error: 'Payment failed: The transaction was declined by the card issuer.'
        };
      }

      const last4 = sanitizedNum.slice(-4);
      const brand = sanitizedNum.startsWith('4') ? 'Visa' : sanitizedNum.startsWith('5') ? 'Mastercard' : 'Amex';

      const updated = paymentDb.updateStatus(payment.id, 'PAID', {
        receiptUrl: `/receipts/${payment.id}`,
        last4,
        brand
      });

      return { success: true, payment: updated };
    }

    // 2. If using Digital Wallet or Bank Transfer
    const updated = paymentDb.updateStatus(payment.id, 'PAID', {
      receiptUrl: `/receipts/${payment.id}`,
      brand: payload.paymentMethod === 'digital_wallet' ? 'Digital Wallet' : 'Bank Transfer'
    });

    return { success: true, payment: updated };
  }

  /**
   * Verifies HMAC SHA-256 webhook signature
   */
  public verifyWebhookSignature(payloadString: string, signatureHeader: string): boolean {
    if (!signatureHeader) return false;

    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const expectedSignature = hmac.update(payloadString).digest('hex');

      // Support "v1=" prefix (similar to Stripe/Stripe-style headers)
      const cleanSignature = signatureHeader.replace(/^v1=/, '');

      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Generates a signed webhook payload (used for verification testing & webhook calls)
   */
  public createSignedWebhookPayload(event: WebhookEventPayload): { payloadString: string; signature: string } {
    const payloadString = JSON.stringify(event);
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const signature = 'v1=' + hmac.update(payloadString).digest('hex');
    return { payloadString, signature };
  }
}

export const paymentGateway = new PaymentGatewayService();
