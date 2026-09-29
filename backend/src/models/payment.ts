/**
 * Payment Model Interface
 * Represents real transaction records and statuses.
 */

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export type PaymentMethod = 'easypaisa' | 'jazzcash' | 'card' | 'bank_transfer' | 'digital_wallet';

export type PaymentProviderType = 'easypaisa' | 'jazzcash' | 'card' | 'webcraft_pay' | 'stripe' | 'paypal';

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
    accountTitle?: string;
  };
  failureReason?: string;
  idempotencyKey?: string;
  receiptUrl?: string;
  gatewayTxnRef?: string;
  gatewayResponseCode?: string;
  gatewayResponseMessage?: string;
  gatewayRedirectUrl?: string;
  verifiedAt?: string;
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

export type ProviderStatusType = 'CONFIGURED' | 'MISSING' | 'INVALID' | 'NOT_SUPPORTED' | 'CONFIGURATION_REQUIRED';

export interface ProviderConfigItem {
  configured: boolean;
  status: ProviderStatusType;
  environment: 'sandbox' | 'production';
  displayName: string;
  badge: string;
  description: string;
}

export interface PaymentConfigResponse {
  providers: {
    easypaisa: ProviderConfigItem;
    jazzcash: ProviderConfigItem;
    card: ProviderConfigItem;
  };
}
