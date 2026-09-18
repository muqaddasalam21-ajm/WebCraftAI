/**
 * Phase 15 — Real Business Reports & Analytics Client Service
 */

import { getAuthToken } from '../utils/token';

const API_URL = '/api/reports';

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

export interface DateQuery {
  preset?: string;
  startDate?: string;
  endDate?: string;
}

function buildQuery(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const filtered: [string, string][] = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== '')
    .map(([k, v]) => [k, v!]);
  if (filtered.length === 0) return '';
  return '?' + new URLSearchParams(filtered).toString();
}

export const reportService = {
  async getOverview(params?: DateQuery) {
    const res = await fetch(`${API_URL}/overview${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load overview report.');
    return data;
  },

  async getSales(params?: DateQuery & { orderType?: string; status?: string; packageId?: string; templateId?: string }) {
    const res = await fetch(`${API_URL}/sales${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load sales report.');
    return data;
  },

  async getRevenue(params?: DateQuery) {
    const res = await fetch(`${API_URL}/revenue${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load revenue report.');
    return data;
  },

  async getProjects(params?: DateQuery & { status?: string; priority?: string; assignedTo?: string }) {
    const res = await fetch(`${API_URL}/projects${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load projects report.');
    return data;
  },

  async getDeployments(params?: DateQuery) {
    const res = await fetch(`${API_URL}/deployments${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load deployments report.');
    return data;
  },

  async getCustomers(params?: DateQuery) {
    const res = await fetch(`${API_URL}/customers${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load customer analytics.');
    return data;
  },

  async getVendors(params?: DateQuery) {
    const res = await fetch(`${API_URL}/vendors${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load vendor analytics.');
    return data;
  },

  async downloadExport(type: 'sales' | 'revenue' | 'projects' | 'deployments', params?: DateQuery) {
    const query = buildQuery({ type, ...(params as Record<string, string>) });
    const res = await fetch(`${API_URL}/export${query}`, {
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      }
    });

    if (!res.ok) {
      let msg = 'Failed to export report.';
      try {
        const errJson = await res.json();
        msg = errJson.error || msg;
      } catch {
        // use default message
      }
      throw new Error(msg);
    }

    const blob = await res.blob();
    const contentDisp = res.headers.get('content-disposition');
    let filename = `${type}_report.csv`;
    if (contentDisp && contentDisp.includes('filename=')) {
      const match = contentDisp.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};
