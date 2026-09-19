import { Template, TemplateStats } from '../types';
import { getAuthToken } from '../utils/token';
import { buildApiUrl } from '../utils/apiConfig';

const API_URL = buildApiUrl('/api');

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

export const templateService = {
  async getTemplates(params?: {
    search?: string;
    category?: string;
    status?: string;
    vendorId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
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

    const res = await fetch(`${API_URL}/templates?${q.toString()}`, { headers: authHeaders() });
    const data = await res.json();
    return {
      success: res.ok,
      templates: data.templates || [],
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
      ...data
    };
  },

  async getMyTemplates() {
    const res = await fetch(`${API_URL}/templates/my-templates`, { headers: authHeaders() });
    const data = await res.json();
    return {
      success: res.ok,
      templates: data.templates || [],
      total: data.total || 0,
      ...data
    };
  },

  async getPurchasedTemplates() {
    const res = await fetch(`${API_URL}/templates/purchased`, { headers: authHeaders() });
    const data = await res.json();
    return {
      success: res.ok,
      orders: data.orders || data.purchased || [],
      ...data
    };
  },

  async getStats(): Promise<{ success: boolean; stats: TemplateStats }> {
    const res = await fetch(`${API_URL}/templates/stats`, { headers: authHeaders() });
    const data = await res.json();
    return {
      success: res.ok,
      stats: data.stats || {
        totalTemplates: 0,
        publishedTemplates: 0,
        draftTemplates: 0,
        archivedTemplates: 0,
        totalTemplateOrders: 0,
        totalTemplateSales: 0
      }
    };
  },

  async getTemplateById(id: string): Promise<{ success: boolean; template?: Template; error?: string }> {
    const res = await fetch(`${API_URL}/templates/${id}`, { headers: authHeaders() });
    const data = await res.json();
    return {
      success: res.ok,
      template: data.template,
      error: data.error
    };
  },

  async createTemplate(data: Partial<Template>) {
    const res = await fetch(`${API_URL}/templates`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    return {
      success: res.ok,
      template: result.template,
      error: result.error,
      message: result.message
    };
  },

  async updateTemplate(id: string, data: Partial<Template>) {
    const res = await fetch(`${API_URL}/templates/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    return {
      success: res.ok,
      template: result.template,
      error: result.error,
      message: result.message
    };
  },

  async updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    const res = await fetch(`${API_URL}/templates/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const result = await res.json();
    return {
      success: res.ok,
      template: result.template,
      error: result.error
    };
  },

  async deleteTemplate(id: string) {
    const res = await fetch(`${API_URL}/templates/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const result = await res.json();
    return {
      success: res.ok,
      error: result.error
    };
  },

  async purchaseTemplate(templateId: string) {
    const res = await fetch(`${API_URL}/orders/template`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ templateId })
    });
    const result = await res.json();
    return {
      success: res.ok,
      order: result.order,
      error: result.error,
      message: result.message
    };
  }
};
