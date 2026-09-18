import { CheckoutSummary, Payment, PaymentMethod, CustomWebsiteOrder } from '../types';
import { getAuthToken } from '../utils/token';

const API_URL = '/api/checkout';

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
  async getSummary(params: {
    orderId?: string;
    itemType?: 'custom_website' | 'template' | 'product';
    itemId?: string;
    quantity?: number;
  }): Promise<{ summary: CheckoutSummary; isPaid: boolean }> {
    const res = await fetch(`${API_URL}/summary`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch checkout summary.');
    return result;
  },

  async initiateCheckout(params: {
    orderId?: string;
    itemType?: 'custom_website' | 'template' | 'product';
    itemId?: string;
    quantity?: number;
    paymentMethod: PaymentMethod;
  }): Promise<{ message: string; payment: Payment; order: CustomWebsiteOrder }> {
    const res = await fetch(`${API_URL}/initiate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to initialize payment.');
    return result;
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
    const res = await fetch(`${API_URL}/confirm`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Payment confirmation failed.');
    return result;
  },

  async getPayment(paymentId: string): Promise<{ payment: Payment; order: CustomWebsiteOrder }> {
    const res = await fetch(`${API_URL}/payment/${paymentId}`, {
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch payment details.');
    return result;
  }
};
