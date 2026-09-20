import { CustomWebsitePackage } from '../types';
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

export const servicePackageService = {
  async getAll(): Promise<{ packages: CustomWebsitePackage[]; total: number }> {
    return safeApiRequest<{ packages: CustomWebsitePackage[]; total: number }>('/api/service-packages', {
      headers: authHeaders()
    });
  },

  async getActive(): Promise<{ packages: CustomWebsitePackage[]; total: number }> {
    return safeApiRequest<{ packages: CustomWebsitePackage[]; total: number }>('/api/service-packages/active');
  },

  async getById(id: string): Promise<{ package: CustomWebsitePackage }> {
    return safeApiRequest<{ package: CustomWebsitePackage }>(`/api/service-packages/${id}`, {
      headers: authHeaders()
    });
  },

  async create(input: Partial<CustomWebsitePackage>): Promise<{ package: CustomWebsitePackage }> {
    return safeApiRequest<{ package: CustomWebsitePackage }>('/api/service-packages', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async update(id: string, input: Partial<CustomWebsitePackage>): Promise<{ package: CustomWebsitePackage }> {
    return safeApiRequest<{ package: CustomWebsitePackage }>(`/api/service-packages/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
  },

  async setStatus(id: string, isActive: boolean): Promise<{ package: CustomWebsitePackage }> {
    return safeApiRequest<{ package: CustomWebsitePackage }>(`/api/service-packages/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isActive })
    });
  },

  async deletePackage(id: string): Promise<{ message: string }> {
    return safeApiRequest<{ message: string }>(`/api/service-packages/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
  }
};
