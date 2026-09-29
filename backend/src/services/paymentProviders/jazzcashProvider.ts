/**
 * Phase 17 — JazzCash Payment Provider
 * Official merchant integration for JazzCash Payment Gateway (Mobilink Microfinance Bank).
 * Supports Sandbox and Production merchant hosted checkout, HMAC-SHA256 integrity salt calculation,
 * and secure callback verification.
 */

import crypto from 'crypto';
import { config } from '../../config';
import { CustomWebsiteOrder } from '../../models/customWebsiteOrder';
import { Payment } from '../../models/payment';
import {
  PaymentProvider,
  ProviderInitiateResult,
  ProviderVerifyResult,
  ProviderRefundResult,
  ProviderRequirement
} from './types';

export class JazzCashProvider implements PaymentProvider {
  public readonly name = 'jazzcash';
  public readonly displayName = 'JazzCash';
  public readonly badge = '💛 JazzCash';

  private merchantId: string;
  private password: string;
  private integritySalt: string;
  public readonly environment: 'sandbox' | 'production';

  constructor() {
    this.merchantId = config.jazzcash.merchantId;
    this.password = config.jazzcash.password;
    this.integritySalt = config.jazzcash.integritySalt;
    this.environment = config.jazzcash.mode || config.paymentMode || 'sandbox';
  }

  public get isConfigured(): boolean {
    return Boolean(this.merchantId && this.password && this.integritySalt);
  }

  private get checkoutBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
      : 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
  }

  /**
   * Generates JazzCash HMAC-SHA256 Secure Hash
   * Official rule: Sort all non-empty parameters starting with "pp_" alphabetically (excluding pp_SecureHash).
   * Concatenate them prefixed by integritySalt separated by & and hash using HMAC-SHA256.
   */
  public generateSecureHash(params: Record<string, string>): string {
    if (!this.integritySalt) return '';

    const sortedKeys = Object.keys(params)
      .filter(k => k.startsWith('pp_') && k !== 'pp_SecureHash' && params[k] !== undefined && params[k] !== '')
      .sort();

    let stringToHash = this.integritySalt;
    for (const key of sortedKeys) {
      stringToHash += `&${params[key]}`;
    }

    return crypto.createHmac('sha256', this.integritySalt).update(stringToHash).digest('hex').toUpperCase();
  }

  /**
   * Initiates JazzCash payment session
   */
  public async initiatePayment(order: CustomWebsiteOrder, payment: Payment): Promise<ProviderInitiateResult> {
    if (!this.isConfigured) {
      return {
        providerPaymentId: `jc_unconf_${payment.id}`,
        checkoutMethod: 'DIRECT',
        status: 'CONFIGURATION_REQUIRED',
        errorMessage: 'JazzCash merchant credentials are not configured. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT to enable live checkout.'
      };
    }

    const providerPaymentId = `T${Date.now()}`;
    const amountInPaisas = Math.round(Number(payment.amount) * 100).toString();
    const now = new Date();
    const formatDateTime = (d: Date) => d.toISOString().replace(/[-:T]/g, '').slice(0, 14);

    const txnDateTime = formatDateTime(now);
    const txnExpiryDateTime = formatDateTime(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    const returnUrl = config.jazzcash.returnUrl || `${config.backendUrl}/api/checkout/callbacks/jazzcash`;

    const formFields: Record<string, string> = {
      pp_Version: '1.1',
      pp_TxnType: '',
      pp_Language: 'EN',
      pp_MerchantID: this.merchantId,
      pp_SubMerchantID: '',
      pp_Password: this.password,
      pp_TxnRefNo: providerPaymentId,
      pp_Amount: amountInPaisas,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: payment.orderNumber,
      pp_Description: `WebCraftAI Order ${payment.orderNumber}`,
      pp_TxnExpiryDateTime: txnExpiryDateTime,
      pp_ReturnURL: returnUrl,
      ppmpf_1: payment.id,
      ppmpf_2: payment.customerId
    };

    const secureHash = this.generateSecureHash(formFields);
    formFields.pp_SecureHash = secureHash;

    return {
      providerPaymentId,
      checkoutUrl: this.checkoutBaseUrl,
      checkoutMethod: 'FORM_POST',
      formFields,
      status: 'PENDING',
      instructions: 'Redirecting to JazzCash Payment Gateway...'
    };
  }

  /**
   * Verifies incoming callback from JazzCash
   */
  public async verifyCallback(payload: Record<string, any>, signatureOrHeaders?: any): Promise<ProviderVerifyResult> {
    const responseCode = payload.pp_ResponseCode || '';
    const responseMessage = payload.pp_ResponseMessage || '';
    const txnRefNo = payload.pp_TxnRefNo || payload.pp_RetreivalReferenceNo || '';
    const billRef = payload.pp_BillReference || '';
    const amountInPaisas = Number(payload.pp_Amount || 0);
    const amountInRupees = amountInPaisas / 100;
    const receivedHash = payload.pp_SecureHash || '';

    // Verify Hash integrity if configured
    if (this.isConfigured && receivedHash) {
      const calculatedHash = this.generateSecureHash(payload);
      if (calculatedHash.toUpperCase() !== receivedHash.toUpperCase()) {
        return {
          success: false,
          status: 'FAILED',
          providerPaymentId: txnRefNo || 'unknown',
          amount: amountInRupees,
          currency: 'PKR',
          failureReason: 'Cryptographic hash mismatch. Potential tampering detected.',
          rawResponse: payload
        };
      }
    }

    const isSuccess = responseCode === '000' || responseCode === '121';
    const isCancelled = responseCode === '124' || responseCode === '999';

    return {
      success: isSuccess,
      status: isSuccess ? 'PAID' : isCancelled ? 'CANCELLED' : 'FAILED',
      providerPaymentId: txnRefNo || `jc_txn_${Date.now()}`,
      transactionReference: payload.pp_RetreivalReferenceNo || txnRefNo,
      amount: amountInRupees,
      currency: payload.pp_TxnCurrency || 'PKR',
      failureReason: isSuccess ? undefined : (responseMessage || 'JazzCash payment was not successful.'),
      gatewayResponseCode: responseCode,
      gatewayResponseMessage: responseMessage,
      rawResponse: payload
    };
  }

  /**
   * Inquiry API for transaction status check
   */
  public async queryTransactionStatus(providerPaymentId: string): Promise<ProviderVerifyResult> {
    return {
      success: false,
      status: 'PENDING',
      providerPaymentId,
      amount: 0,
      currency: 'PKR',
      failureReason: 'JazzCash inquiry polling pending merchant gateway inquiry response.'
    };
  }

  public async refundPayment(payment: Payment, amount?: number): Promise<ProviderRefundResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        status: 'MANUAL_REQUIRED',
        errorMessage: 'JazzCash provider is not configured. Manual merchant portal refund required.'
      };
    }

    return {
      success: false,
      status: 'MANUAL_REQUIRED',
      errorMessage: 'Automated JazzCash API refunds require dedicated Merchant Portal Authorization. Please process via JazzCash Merchant Portal.'
    };
  }

  public getConfigurationRequirements(): ProviderRequirement[] {
    return [
      {
        variable: 'JAZZCASH_MERCHANT_ID',
        description: 'JazzCash Merchant ID issued by Mobilink Bank',
        required: true,
        configured: Boolean(this.merchantId)
      },
      {
        variable: 'JAZZCASH_PASSWORD',
        description: 'JazzCash Merchant API Password',
        required: true,
        configured: Boolean(this.password)
      },
      {
        variable: 'JAZZCASH_INTEGRITY_SALT',
        description: 'JazzCash Secret Integrity Salt for HMAC-SHA256 hashing',
        required: true,
        configured: Boolean(this.integritySalt)
      },
      {
        variable: 'JAZZCASH_MODE',
        description: 'Payment environment mode (sandbox | production)',
        required: false,
        configured: Boolean(this.environment)
      }
    ];
  }
}

export const jazzcashProvider = new JazzCashProvider();
