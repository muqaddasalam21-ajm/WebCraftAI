import { getAuthToken } from '../utils/token';
import { safeApiRequest } from '../utils/apiConfig';

function getToken(): string | null {
  return getAuthToken();
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const vendorService = {
  async getVendors() {
    return safeApiRequest<{ total: number; vendors: any[] }>('/api/vendors', { headers: authHeaders() });
  },

  async getVendorById(vendorId: string) {
    return safeApiRequest<{ success: boolean; vendor?: any; error?: string }>(`/api/vendors/${vendorId}`, {
      headers: authHeaders()
    });
  },

  async getVendorProducts(vendorId: string) {
    return safeApiRequest(`/api/vendors/${vendorId}/products`, { headers: authHeaders() });
  }
};
