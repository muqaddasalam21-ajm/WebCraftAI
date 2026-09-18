import { getAuthToken } from '../utils/token';

const API_URL = 'http://localhost:5000/api';

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
    const res = await fetch(`${API_URL}/vendors`, { headers: authHeaders() });
    return res.json();
  },

  async getVendorProducts(vendorId: string) {
    const res = await fetch(`${API_URL}/vendors/${vendorId}/products`, { headers: authHeaders() });
    return res.json();
  }
};
