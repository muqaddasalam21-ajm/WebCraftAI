import { CustomWebsiteOrder, OrderPackageOption, CustomWebsiteOrderStatus } from '../types';
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

export const customWebsiteOrderService = {
  async getPackages(): Promise<{ packages: OrderPackageOption[] }> {
    return safeApiRequest<{ packages: OrderPackageOption[] }>('/api/orders/packages');
  },

  async createCustomWebsiteOrder(data: {
    businessInfo: CustomWebsiteOrder['businessInfo'];
    requirements: CustomWebsiteOrder['requirements'];
    designPreferences: CustomWebsiteOrder['designPreferences'];
    packageId: string;
  }): Promise<{ message: string; order: CustomWebsiteOrder }> {
    return safeApiRequest<{ message: string; order: CustomWebsiteOrder }>('/api/orders/custom-website', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
  },

  async getMyOrders(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: CustomWebsiteOrder[]; total: number; page: number; totalPages: number }> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status && params.status !== 'All') q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));

    const qs = q.toString();
    return safeApiRequest<{ orders: CustomWebsiteOrder[]; total: number; page: number; totalPages: number }>(
      `/api/orders/my-orders${qs ? `?${qs}` : ''}`,
      { headers: authHeaders() }
    );
  },

  async getAllOrders(params?: {
    search?: string;
    status?: string;
    assignedOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ orders: CustomWebsiteOrder[]; total: number; page: number; totalPages: number }> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status && params.status !== 'All') q.set('status', params.status);
    if (params?.assignedOnly) q.set('assignedOnly', 'true');
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));

    const qs = q.toString();
    return safeApiRequest<{ orders: CustomWebsiteOrder[]; total: number; page: number; totalPages: number }>(
      `/api/orders${qs ? `?${qs}` : ''}`,
      { headers: authHeaders() }
    );
  },

  async getOrderById(id: string): Promise<{ order: CustomWebsiteOrder }> {
    return safeApiRequest<{ order: CustomWebsiteOrder }>(`/api/orders/${id}`, {
      headers: authHeaders()
    });
  },

  async updateOrderStatus(
    id: string,
    status: CustomWebsiteOrderStatus,
    notes?: string,
    previewUrl?: string,
    deliveredUrl?: string
  ): Promise<{ message: string; order: CustomWebsiteOrder }> {
    return safeApiRequest<{ message: string; order: CustomWebsiteOrder }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, notes, previewUrl, deliveredUrl })
    });
  },

  async assignStaff(id: string, staffId: string): Promise<{ message: string; order: CustomWebsiteOrder }> {
    return safeApiRequest<{ message: string; order: CustomWebsiteOrder }>(`/api/orders/${id}/assign`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ staffId })
    });
  },

  async uploadAsset(file: File): Promise<{ url: string; fileName: string }> {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('File exceeds 5MB size limit'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const result = await safeApiRequest<{ url: string; fileName: string }>('/api/orders/upload-asset', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              fileName: file.name,
              dataBase64: base64,
              mimeType: file.type
            })
          });
          resolve({ url: result.url, fileName: result.fileName });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  async getReports(): Promise<{
    totalRevenue: number;
    paidOrdersCount: number;
    totalOrdersCount: number;
    averageOrderValue: number;
    unpaidOrdersCount: number;
    monthlyBreakdown: Array<{
      month: string;
      revenue: number;
      orders: number;
      customWebsites: number;
      templates: number;
    }>;
  }> {
    return safeApiRequest('/api/orders/reports', {
      headers: authHeaders()
    });
  }
};
