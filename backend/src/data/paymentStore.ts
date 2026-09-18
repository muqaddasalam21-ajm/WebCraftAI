import fs from 'fs';
import path from 'path';
import { Payment, PaymentStatus } from '../models/payment';
import { auditDb } from './auditStore';

const PAYMENTS_FILE = path.join(__dirname, '../../data/payments.json');

function ensureFileExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
  }
}

class PaymentDatabase {
  private payments: Map<string, Payment> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    ensureFileExists(PAYMENTS_FILE);
    try {
      const raw = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
      const list: Payment[] = JSON.parse(raw);
      this.payments.clear();
      list.forEach(p => this.payments.set(p.id, p));
    } catch (err) {
      console.error('Error reading payments.json:', err);
      this.payments.clear();
    }
  }

  private save() {
    try {
      const list = Array.from(this.payments.values());
      fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving payments.json:', err);
    }
  }

  public create(payment: Payment): Payment {
    // Check for duplicate providerPaymentId to maintain idempotency
    const existing = this.getByProviderPaymentId(payment.providerPaymentId);
    if (existing) {
      return existing;
    }

    this.payments.set(payment.id, payment);
    this.save();

    auditDb.log({
      action: 'PAYMENT_INITIATED' as any,
      userId: payment.customerId,
      userName: payment.customerName,
      userRole: 'customer',
      targetId: payment.id,
      targetType: 'PAYMENT',
      details: `Payment initiated for order ${payment.orderNumber} ($${payment.amount} ${payment.currency}) via ${payment.provider}.`,
      metadata: { paymentId: payment.id, orderId: payment.orderId, provider: payment.provider }
    });

    return payment;
  }

  public getById(id: string): Payment | null {
    return this.payments.get(id) || null;
  }

  public getByOrderId(orderId: string): Payment[] {
    return Array.from(this.payments.values())
      .filter(p => p.orderId === orderId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getByCustomerId(customerId: string): Payment[] {
    return Array.from(this.payments.values())
      .filter(p => p.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getByProviderPaymentId(providerPaymentId: string): Payment | null {
    return Array.from(this.payments.values()).find(p => p.providerPaymentId === providerPaymentId) || null;
  }

  public updateStatus(
    id: string,
    status: PaymentStatus,
    details?: { failureReason?: string; receiptUrl?: string; last4?: string; brand?: string }
  ): Payment {
    const payment = this.payments.get(id);
    if (!payment) {
      throw new Error(`Payment ${id} not found.`);
    }

    payment.status = status;
    payment.updatedAt = new Date().toISOString();

    if (details?.failureReason) payment.failureReason = details.failureReason;
    if (details?.receiptUrl) payment.receiptUrl = details.receiptUrl;
    if (details?.last4 || details?.brand) {
      payment.paymentMethodDetails = {
        ...payment.paymentMethodDetails,
        ...(details.last4 ? { last4: details.last4 } : {}),
        ...(details.brand ? { brand: details.brand } : {})
      };
    }

    this.payments.set(id, payment);
    this.save();

    auditDb.log({
      action: (status === 'PAID' ? 'PAYMENT_SUCCESS' : status === 'FAILED' ? 'PAYMENT_FAILED' : 'PAYMENT_STATUS_UPDATE') as any,
      userId: payment.customerId,
      userName: payment.customerName,
      userRole: 'customer',
      targetId: payment.id,
      targetType: 'PAYMENT',
      details: `Payment ${payment.id} status updated to ${status} for order ${payment.orderNumber}.`,
      metadata: { paymentId: payment.id, orderId: payment.orderId, status }
    });

    return payment;
  }

  public getAll(): Payment[] {
    return Array.from(this.payments.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const paymentDb = new PaymentDatabase();
