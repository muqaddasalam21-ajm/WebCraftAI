import { AiWebsiteInput, WebsiteSpecification, WebsiteVersionSnapshot } from '../types';
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

export const aiWebsiteService = {
  async generateWebsite(input: AiWebsiteInput): Promise<{ message: string; website: WebsiteSpecification }> {
    return safeApiRequest<{ message: string; website: WebsiteSpecification }>('/api/ai-builder/generate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async regenerateWebsite(id: string, inputUpdates?: Partial<AiWebsiteInput> & { changeNote?: string }): Promise<{ message: string; website: WebsiteSpecification }> {
    return safeApiRequest<{ message: string; website: WebsiteSpecification }>(`/api/ai-builder/${id}/regenerate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(inputUpdates || {})
    });
  },

  async getWebsites(params?: { search?: string; businessType?: string }): Promise<{ websites: WebsiteSpecification[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.businessType && params.businessType !== 'All') q.set('businessType', params.businessType);

    const qs = q.toString();
    return safeApiRequest<{ websites: WebsiteSpecification[]; total: number }>(`/api/ai-builder${qs ? `?${qs}` : ''}`, {
      headers: authHeaders()
    });
  },

  async getWebsiteById(id: string): Promise<{ website: WebsiteSpecification }> {
    return safeApiRequest<{ website: WebsiteSpecification }>(`/api/ai-builder/${id}`, {
      headers: authHeaders()
    });
  },

  async getWebsiteVersions(id: string): Promise<{ versions: WebsiteVersionSnapshot[] }> {
    return safeApiRequest<{ versions: WebsiteVersionSnapshot[] }>(`/api/ai-builder/${id}/versions`, {
      headers: authHeaders()
    });
  },

  async restoreWebsiteVersion(id: string, version: number): Promise<{ message: string; website: WebsiteSpecification }> {
    return safeApiRequest<{ message: string; website: WebsiteSpecification }>(`/api/ai-builder/${id}/restore/${version}`, {
      method: 'POST',
      headers: authHeaders()
    });
  },

  async updateWebsite(id: string, updates: Partial<WebsiteSpecification>, changeNote?: string): Promise<{ message: string; website: WebsiteSpecification }> {
    return safeApiRequest<{ message: string; website: WebsiteSpecification }>(`/api/ai-builder/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ ...updates, changeNote })
    });
  },

  async deleteWebsite(id: string): Promise<{ message: string }> {
    return safeApiRequest<{ message: string }>(`/api/ai-builder/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
  }
};
