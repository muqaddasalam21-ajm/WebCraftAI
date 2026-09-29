/**
 * Phase 17 — Payment Provider Abstraction Types
 * Defines the contract for all external payment providers (Easypaisa, JazzCash, Card Gateway).
 */

import { CustomWebsiteOrder } from '../../models/customWebsiteOrder';
import { Payment, PaymentStatus, ProviderStatusType } from '../../models/payment';

export interface ProviderInitiateResult {
  providerPaymentId: string;
  checkoutUrl?: string;
  checkoutMethod: 'REDIRECT' | 'FORM_POST' | 'POPUP' | 'DIRECT';
  formFields?: Record<string, string>;
  status: 'PENDING' | 'CONFIGURATION_REQUIRED' | 'FAILED';
  instructions?: string;
  errorMessage?: string;
}

export interface ProviderVerifyResult {
  success: boolean;
  status: PaymentStatus;
  providerPaymentId: string;
  orderId?: string;
  transactionReference?: string;
  amount: number;
  currency: string;
  failureReason?: string;
  gatewayResponseCode?: string;
  gatewayResponseMessage?: string;
  rawResponse?: any;
}

export interface ProviderRefundResult {
  success: boolean;
  status: 'REFUNDED' | 'FAILED' | 'MANUAL_REQUIRED';
  refundId?: string;
  refundedAmount?: number;
  errorMessage?: string;
}

export interface ProviderRequirement {
  variable: string;
  description: string;
  required: boolean;
  configured: boolean;
}

export interface PaymentProvider {
  readonly name: string; // 'easypaisa' | 'jazzcash' | 'card'
  readonly displayName: string;
  readonly badge: string;
  readonly isConfigured: boolean;
  readonly environment: 'sandbox' | 'production';

  initiatePayment(order: CustomWebsiteOrder, payment: Payment): Promise<ProviderInitiateResult>;
  verifyCallback(payload: Record<string, any>, signatureOrHeaders?: any): Promise<ProviderVerifyResult>;
  verifyWebhook?(payload: Record<string, any>, signature?: string): Promise<ProviderVerifyResult>;
  queryTransactionStatus?(providerPaymentId: string): Promise<ProviderVerifyResult>;
  refundPayment?(payment: Payment, amount?: number): Promise<ProviderRefundResult>;
  getConfigurationRequirements(): ProviderRequirement[];
}
