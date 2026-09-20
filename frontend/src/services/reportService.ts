/**
 * Phase 15 — Real Business Reports & Analytics Client Service
 */

import { getAuthToken } from '../utils/token';
import { safeApiRequest, buildApiUrl } from '../utils/apiConfig';

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
    return safeApiRequest(`/api/reports/overview${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
  },

  async getSales(params?: DateQuery & { orderType?: string; status?: string; packageId?: string; templateId?: string }) {
    return safeApiRequest(`/api/reports/sales${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
  },

  async getRevenue(params?: DateQuery) {
    return safeApiRequest(`/api/reports/revenue${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
  },

  async getProjects(params?: DateQuery & { status?: string; priority?: string; assignedTo?: string }) {
    return safeApiRequest(`/api/reports/projects${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
  },

  async getDeployments(params?: DateQuery) {
    return safeApiRequest(`/api/reports/deployments${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
  },

  async getCustomers(params?: DateQuery) {
    return safeApiRequest(`/api/reports/customers${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
  },

  async getVendors(params?: DateQuery) {
    return safeApiRequest(`/api/reports/vendors${buildQuery(params as Record<string, string>)}`, {
      headers: authHeaders()
    });
  },

  async downloadExport(type: 'sales' | 'revenue' | 'projects' | 'deployments', params?: DateQuery) {
    const query = buildQuery({ type, ...(params as Record<string, string>) });
    const targetUrl = buildApiUrl(`/api/reports/export${query}`);
    const token = getToken();
    const res = await fetch(targetUrl, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
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
