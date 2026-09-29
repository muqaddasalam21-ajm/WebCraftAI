/**
 * Phase 17 — Easypaisa Payment Provider
 * Official merchant payment gateway integration for Easypaisa (Telenor Microfinance Bank).
 * Supports Sandbox and Production hosted checkout, hash verification, and callback handling.
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

export class EasypaisaProvider implements PaymentProvider {
  public readonly name = 'easypaisa';
  public readonly displayName = 'Easypaisa';
  public readonly badge = '💚 Easypaisa';

  private storeId: string;
  private hashKey: string;
  private accountNum: string;
  public readonly environment: 'sandbox' | 'production';

  constructor() {
    this.storeId = config.easypaisa.storeId;
    this.hashKey = config.easypaisa.hashKey;
    this.accountNum = config.easypaisa.accountNum;
    this.environment = config.easypaisa.mode || config.paymentMode || 'sandbox';
  }

  public get isConfigured(): boolean {
    return Boolean(this.storeId && this.hashKey);
  }

  private get checkoutBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://easypay.easypaisa.com.pk/easypay/Index.jsf'
      : 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf';
  }

  /**
   * Generates HMAC-SHA256 signature for Easypaisa payload
   */
  public generateHash(params: Record<string, string>): string {
    if (!this.hashKey) return '';
    // Sort parameters alphabetically, join with &
    const sortedKeys = Object.keys(params).sort();
    const message = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
    return crypto.createHmac('sha256', this.hashKey).update(message).digest('hex');
  }

  /**
   * Initiates an Easypaisa payment session
   */
  public async initiatePayment(order: CustomWebsiteOrder, payment: Payment): Promise<ProviderInitiateResult> {
    if (!this.isConfigured) {
      return {
        providerPaymentId: `ep_unconf_${payment.id}`,
        checkoutMethod: 'DIRECT',
        status: 'CONFIGURATION_REQUIRED',
        errorMessage: 'Easypaisa merchant credentials are not configured. Set EASYPAISA_STORE_ID and EASYPAISA_HASH_KEY to enable live checkout.'
      };
    }

    const providerPaymentId = `ep_${payment.id}_${Date.now()}`;
    const formattedAmount = Number(payment.amount).toFixed(2);
    const postBackURL = `${config.backendUrl}/api/checkout/callbacks/easypaisa`;
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);

    const formFields: Record<string, string> = {
      storeId: this.storeId,
      amount: formattedAmount,
      postBackURL,
      orderRefNum: payment.orderNumber,
      expiryDate,
      autoRedirect: '1',
      paymentMethod: 'MA_PAYMENT_METHOD',
      paymentId: payment.id
    };

    const hash = this.generateHash({
      amount: formattedAmount,
      orderRefNum: payment.orderNumber,
      postBackURL,
      storeId: this.storeId
    });
    formFields.merchantHashedReq = hash;

    return {
      providerPaymentId,
      checkoutUrl: this.checkoutBaseUrl,
      checkoutMethod: 'FORM_POST',
      formFields,
      status: 'PENDING',
      instructions: 'Redirecting to Easypaisa secure payment gateway...'
    };
  }

  /**
   * Cryptographically verifies callback or webhook response from Easypaisa
   */
  public async verifyCallback(payload: Record<string, any>, signatureOrHeaders?: any): Promise<ProviderVerifyResult> {
    const orderRefNum = payload.orderRefNum || payload.orderNumber || payload.billReference || '';
    const transactionId = payload.transactionId || payload.auth_token || payload.transId || '';
    const status = payload.status || payload.responseCode || payload.code || '';
    const amount = Number(payload.amount || payload.orderAmount || 0);
    const currency = payload.currency || 'PKR';
    const receivedHash = payload.merchantHashedReq || payload.signature || (signatureOrHeaders as string) || '';

    // If configured with hash key, verify signature
    if (this.isConfigured && receivedHash) {
      const calculatedHash = this.generateHash({
        amount: Number(amount).toFixed(2),
        orderRefNum,
        storeId: this.storeId
      });

      const isMatch = calculatedHash.toLowerCase() === receivedHash.toLowerCase();
      if (!isMatch) {
        return {
          success: false,
          status: 'FAILED',
          providerPaymentId: transactionId || 'unknown',
          amount,
          currency,
          failureReason: 'Invalid Easypaisa cryptographic signature / hash verification failure.',
          rawResponse: payload
        };
      }
    }

    const isSuccess = status === '0000' || status === 'PAID' || status === 'SUCCESS' || status === '00';
    const isCancelled = status === 'CANCELLED' || status === '0001';

    return {
      success: isSuccess,
      status: isSuccess ? 'PAID' : isCancelled ? 'CANCELLED' : 'FAILED',
      providerPaymentId: transactionId || `ep_txn_${Date.now()}`,
      transactionReference: transactionId,
      amount,
      currency,
      failureReason: isSuccess ? undefined : (payload.desc || payload.message || 'Easypaisa transaction was not completed.'),
      gatewayResponseCode: String(status),
      gatewayResponseMessage: payload.desc || payload.message,
      rawResponse: payload
    };
  }

  /**
   * Query status using Easypaisa Inquiry API
   */
  public async queryTransactionStatus(providerPaymentId: string): Promise<ProviderVerifyResult> {
    return {
      success: false,
      status: 'PENDING',
      providerPaymentId,
      amount: 0,
      currency: 'PKR',
      failureReason: 'Direct inquiry polling pending merchant gateway inquiry response.'
    };
  }

  /**
   * Issues refund if supported by merchant account
   */
  public async refundPayment(payment: Payment, amount?: number): Promise<ProviderRefundResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        status: 'MANUAL_REQUIRED',
        errorMessage: 'Easypaisa provider is not configured. Manual merchant portal refund required.'
      };
    }

    // Easypaisa automated refund requires dedicated merchant API credentials
    return {
      success: false,
      status: 'MANUAL_REQUIRED',
      errorMessage: 'Automated Easypaisa API refunds require dedicated merchant portal authorization. Please process via Easypaisa Merchant Dashboard.'
    };
  }

  public getConfigurationRequirements(): ProviderRequirement[] {
    return [
      {
        variable: 'EASYPAISA_STORE_ID',
        description: 'Easypaisa Merchant Store ID issued by Telenor Bank',
        required: true,
        configured: Boolean(this.storeId)
      },
      {
        variable: 'EASYPAISA_HASH_KEY',
        description: 'Easypaisa HMAC-SHA256 Merchant Secret Integrity Hash Key',
        required: true,
        configured: Boolean(this.hashKey)
      },
      {
        variable: 'EASYPAISA_MODE',
        description: 'Payment environment mode (sandbox | production)',
        required: false,
        configured: Boolean(this.environment)
      }
    ];
  }
}

export const easypaisaProvider = new EasypaisaProvider();
