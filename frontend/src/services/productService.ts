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

export const productService = {
  async getProducts(params?: {
    search?: string;
    category?: string;
    status?: string;
    vendorId?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
    viewAll?: boolean;
  }) {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category && params.category !== 'All') q.set('category', params.category);
    if (params?.status && params.status !== 'All') q.set('status', params.status);
    if (params?.vendorId && params.vendorId !== 'All') q.set('vendorId', params.vendorId);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.viewAll) q.set('viewAll', 'true');

    const qs = q.toString();
    return safeApiRequest(`/api/products${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
  },

  async getStats() {
    return safeApiRequest('/api/products/stats', { headers: authHeaders() });
  },

  async getProductById(id: string) {
    return safeApiRequest(`/api/products/${id}`, { headers: authHeaders() });
  },

  async createProduct(data: Record<string, unknown>) {
    return safeApiRequest('/api/products', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
  },

  async updateProduct(id: string, data: Record<string, unknown>) {
    return safeApiRequest(`/api/products/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
  },

  async deleteProduct(id: string) {
    return safeApiRequest(`/api/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
  },

  async importCsv(csvData: string) {
    return safeApiRequest('/api/products/import-csv', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ csvData })
    });
  }
};
