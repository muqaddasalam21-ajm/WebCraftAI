import { AiWebsiteInput, WebsiteSpecification, WebsiteVersionSnapshot } from '../types';
import { getAuthToken } from '../utils/token';

const API_URL = '/api/ai-builder';

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
    const res = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to generate website specification.');
    return result;
  },

  async regenerateWebsite(id: string, inputUpdates?: Partial<AiWebsiteInput> & { changeNote?: string }): Promise<{ message: string; website: WebsiteSpecification }> {
    const res = await fetch(`${API_URL}/${id}/regenerate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(inputUpdates || {})
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to regenerate website specification.');
    return result;
  },

  async getWebsites(params?: { search?: string; businessType?: string }): Promise<{ websites: WebsiteSpecification[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.businessType && params.businessType !== 'All') q.set('businessType', params.businessType);

    const res = await fetch(`${API_URL}?${q.toString()}`, {
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to load website projects.');
    return result;
  },

  async getWebsiteById(id: string): Promise<{ website: WebsiteSpecification }> {
    const res = await fetch(`${API_URL}/${id}`, {
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch website project.');
    return result;
  },

  async getWebsiteVersions(id: string): Promise<{ versions: WebsiteVersionSnapshot[] }> {
    const res = await fetch(`${API_URL}/${id}/versions`, {
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch website revision history.');
    return result;
  },

  async restoreWebsiteVersion(id: string, version: number): Promise<{ message: string; website: WebsiteSpecification }> {
    const res = await fetch(`${API_URL}/${id}/restore/${version}`, {
      method: 'POST',
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to restore website revision.');
    return result;
  },

  async updateWebsite(id: string, updates: Partial<WebsiteSpecification>, changeNote?: string): Promise<{ message: string; website: WebsiteSpecification }> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ ...updates, changeNote })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update website specification.');
    return result;
  },

  async deleteWebsite(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete website project.');
    return result;
  }
};
