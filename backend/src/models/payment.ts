/**
 * Payment Model Interface
 * Represents real transaction records and statuses.
 */

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export type PaymentMethod = 'card' | 'bank_transfer' | 'digital_wallet';

export type PaymentProviderType = 'webcraft_pay' | 'stripe' | 'paypal';

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  provider: PaymentProviderType;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: {
    brand?: string;
    last4?: string;
    walletType?: string;
  };
  failureReason?: string;
  idempotencyKey?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSummary {
  orderId?: string;
  orderNumber?: string;
  itemType: 'custom_website' | 'template' | 'product';
  itemId: string;
  itemName: string;
  itemDescription?: string;
  subtotal: number;
  tax: number;
  fees: number;
  total: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
}
