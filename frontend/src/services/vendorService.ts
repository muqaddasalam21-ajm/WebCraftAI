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
    return safeApiRequest('/api/vendors', { headers: authHeaders() });
  },

  async getVendorProducts(vendorId: string) {
    return safeApiRequest(`/api/vendors/${vendorId}/products`, { headers: authHeaders() });
  }
};
