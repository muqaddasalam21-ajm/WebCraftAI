import { CustomWebsiteOrder, OrderPackageOption, CustomWebsiteOrderStatus } from '../types';
import { getAuthToken } from '../utils/token';

const API_URL = '/api';

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
    const res = await fetch(`${API_URL}/orders/packages`);
    if (!res.ok) throw new Error('Failed to load website packages');
    return res.json();
  },

  async createCustomWebsiteOrder(data: {
    businessInfo: CustomWebsiteOrder['businessInfo'];
    requirements: CustomWebsiteOrder['requirements'];
    designPreferences: CustomWebsiteOrder['designPreferences'];
    packageId: string;
  }): Promise<{ message: string; order: CustomWebsiteOrder }> {
    const res = await fetch(`${API_URL}/orders/custom-website`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit website order');
    return result;
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

    const res = await fetch(`${API_URL}/orders/my-orders?${q.toString()}`, {
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch your orders');
    return result;
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

    const res = await fetch(`${API_URL}/orders?${q.toString()}`, {
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch orders');
    return result;
  },

  async getOrderById(id: string): Promise<{ order: CustomWebsiteOrder }> {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch order details');
    return result;
  },

  async updateOrderStatus(
    id: string,
    status: CustomWebsiteOrderStatus,
    notes?: string,
    previewUrl?: string,
    deliveredUrl?: string
  ): Promise<{ message: string; order: CustomWebsiteOrder }> {
    const res = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, notes, previewUrl, deliveredUrl })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update order status');
    return result;
  },

  async assignStaff(id: string, staffId: string): Promise<{ message: string; order: CustomWebsiteOrder }> {
    const res = await fetch(`${API_URL}/orders/${id}/assign`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ staffId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to assign staff');
    return result;
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
          const res = await fetch(`${API_URL}/orders/upload-asset`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              fileName: file.name,
              dataBase64: base64,
              mimeType: file.type
            })
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Upload failed');
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
    const res = await fetch(`${API_URL}/orders/reports`, {
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch analytics report');
    return result;
  }
};
