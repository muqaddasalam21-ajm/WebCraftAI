import { CheckoutSummary, Payment, PaymentMethod, PaymentProviderType, CustomWebsiteOrder, PaymentConfigResponse, ProviderInitiateResult } from '../types';
import { getAuthToken } from '../utils/token';
import { safeApiRequest } from '../utils/apiConfig';

function getToken(): string | null {
  return getAuthToken();
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

export const checkoutService = {
  async getConfig(): Promise<PaymentConfigResponse> {
    return safeApiRequest<PaymentConfigResponse>('/api/checkout/config', {
      headers: authHeaders()
    });
  },

  async getSummary(params: {
    orderId?: string;
    itemType?: 'custom_website' | 'template' | 'product';
    itemId?: string;
    quantity?: number;
  }): Promise<{ summary: CheckoutSummary; isPaid: boolean }> {
    return safeApiRequest<{ summary: CheckoutSummary; isPaid: boolean }>('/api/checkout/summary', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params)
    });
  },

  async initiateCheckout(params: {
    orderId?: string;
    itemType?: 'custom_website' | 'template' | 'product';
    itemId?: string;
    quantity?: number;
    paymentMethod?: PaymentMethod;
    provider?: PaymentProviderType;
    customerPhone?: string;
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    message: string;
    payment: Payment;
    order: CustomWebsiteOrder;
    initiateResult?: ProviderInitiateResult;
  }> {
    return safeApiRequest<any>('/api/checkout/initiate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params)
    });
  },

  async confirmPayment(params: {
    paymentId: string;
    paymentMethod: PaymentMethod;
    cardDetails?: {
      cardNumber: string;
      expMonth: string;
      expYear: string;
      cvc: string;
      nameOnCard: string;
    };
    paymentToken?: string;
  }): Promise<{ message: string; payment: Payment; order: CustomWebsiteOrder }> {
    return safeApiRequest<{ message: string; payment: Payment; order: CustomWebsiteOrder }>('/api/checkout/confirm', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params)
    });
  },

  async getPayment(paymentId: string): Promise<{ payment: Payment; order: CustomWebsiteOrder }> {
    return safeApiRequest<{ payment: Payment; order: CustomWebsiteOrder }>(`/api/checkout/payment/${paymentId}`, {
      headers: authHeaders()
    });
  }
};

