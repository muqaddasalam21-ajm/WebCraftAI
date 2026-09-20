import { Template, TemplateStats } from '../types';
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

    const qs = q.toString();
    try {
      const data = await safeApiRequest<any>(`/api/templates${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
      return {
        success: true,
        templates: data.templates || [],
        total: data.total || 0,
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        ...data
      };
    } catch (err: any) {
      return {
        success: false,
        templates: [],
        total: 0,
        page: 1,
        totalPages: 1,
        error: err.message
      };
    }
  },

  async getMyTemplates() {
    try {
      const data = await safeApiRequest<any>('/api/templates/my-templates', { headers: authHeaders() });
      return {
        success: true,
        templates: data.templates || [],
        total: data.total || 0,
        ...data
      };
    } catch (err: any) {
      return {
        success: false,
        templates: [],
        total: 0,
        error: err.message
      };
    }
  },

  async getPurchasedTemplates() {
    try {
      const data = await safeApiRequest<any>('/api/templates/purchased', { headers: authHeaders() });
      return {
        success: true,
        orders: data.orders || data.purchased || [],
        ...data
      };
    } catch (err: any) {
      return {
        success: false,
        orders: [],
        error: err.message
      };
    }
  },

  async getStats(): Promise<{ success: boolean; stats: TemplateStats; error?: string }> {
    try {
      const data = await safeApiRequest<any>('/api/templates/stats', { headers: authHeaders() });
      return {
        success: true,
        stats: data.stats || {
          totalTemplates: 0,
          publishedTemplates: 0,
          draftTemplates: 0,
          archivedTemplates: 0,
          totalTemplateOrders: 0,
          totalTemplateSales: 0
        }
      };
    } catch (err: any) {
      return {
        success: false,
        stats: {
          totalTemplates: 0,
          publishedTemplates: 0,
          draftTemplates: 0,
          archivedTemplates: 0,
          totalTemplateOrders: 0,
          totalTemplateSales: 0
        },
        error: err.message
      };
    }
  },

  async getTemplateById(id: string): Promise<{ success: boolean; template?: Template; error?: string }> {
    try {
      const data = await safeApiRequest<any>(`/api/templates/${id}`, { headers: authHeaders() });
      return {
        success: true,
        template: data.template
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      };
    }
  },

  async createTemplate(data: Partial<Template>) {
    try {
      const result = await safeApiRequest<any>('/api/templates', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data)
      });
      return {
        success: true,
        template: result.template,
        message: result.message
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        message: err.message
      };
    }
  },

  async updateTemplate(id: string, data: Partial<Template>) {
    try {
      const result = await safeApiRequest<any>(`/api/templates/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data)
      });
      return {
        success: true,
        template: result.template,
        message: result.message
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        message: err.message
      };
    }
  },

  async updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    try {
      const result = await safeApiRequest<any>(`/api/templates/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });
      return {
        success: true,
        template: result.template
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      };
    }
  },

  async deleteTemplate(id: string) {
    try {
      await safeApiRequest(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      };
    }
  },

  async purchaseTemplate(templateId: string) {
    try {
      const result = await safeApiRequest<any>('/api/orders/template', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ templateId })
      });
      return {
        success: true,
        order: result.order,
        message: result.message
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        message: err.message
      };
    }
  }
};
