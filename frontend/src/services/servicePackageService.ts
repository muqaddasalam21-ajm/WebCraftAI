import { CustomWebsitePackage } from '../types';
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

export const servicePackageService = {
  async getAll(): Promise<{ packages: CustomWebsitePackage[]; total: number }> {
    const res = await fetch(`${API_URL}/service-packages`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load packages');
    return data;
  },

  async getActive(): Promise<{ packages: CustomWebsitePackage[]; total: number }> {
    const res = await fetch(`${API_URL}/service-packages/active`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load packages');
    return data;
  },

  async getById(id: string): Promise<{ package: CustomWebsitePackage }> {
    const res = await fetch(`${API_URL}/service-packages/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Package not found');
    return data;
  },

  async create(input: Partial<CustomWebsitePackage>): Promise<{ package: CustomWebsitePackage }> {
    const res = await fetch(`${API_URL}/service-packages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create package');
    return data;
  },

  async update(id: string, input: Partial<CustomWebsitePackage>): Promise<{ package: CustomWebsitePackage }> {
    const res = await fetch(`${API_URL}/service-packages/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update package');
    return data;
  },

  async setStatus(id: string, isActive: boolean): Promise<{ package: CustomWebsitePackage }> {
    const res = await fetch(`${API_URL}/service-packages/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isActive })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update status');
    return data;
  },

  async deletePackage(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/service-packages/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete package');
    return data;
  }
};
