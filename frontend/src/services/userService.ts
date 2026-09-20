import { authService, normalizeRole } from './authService';
import { User, UserRole, UserStatus } from '../types';
import { safeApiRequest } from '../utils/apiConfig';

export interface QueryUsersParams {
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const userService = {
  async getUsers(params?: QueryUsersParams): Promise<PaginatedUsersResponse> {
    const token = authService.getToken();
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role && params.role !== 'All') query.set('role', params.role);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    const endpoint = `/api/users${qs ? `?${qs}` : ''}`;
    const data = await safeApiRequest(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return {
      ...data,
      users: data.users.map((u: any): User => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: normalizeRole(u.role) as UserRole,
        status: (u.status.charAt(0).toUpperCase() + u.status.slice(1)) as UserStatus,
        profile: u.profile,
        createdAt: u.createdAt,
        joinedDate: new Date(u.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }))
    };
  },

  async updateUser(id: string, updates: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    phone?: string;
    bio?: string;
    company?: string;
  }): Promise<User> {
    const token = authService.getToken();
    const data = await safeApiRequest(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    return data.user;
  },

  async deleteUser(id: string): Promise<void> {
    const token = authService.getToken();
    await safeApiRequest(`/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  async getStats() {
    const token = authService.getToken();
    try {
      const data = await safeApiRequest('/api/users/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data?.stats || null;
    } catch {
      return null;
    }
  },

  async getUserDetails(id: string): Promise<{
    user: any;
    activity: {
      orders: any[];
      projects: any[];
      notifications: any[];
      auditLogs: any[];
    };
  }> {
    const token = authService.getToken();
    return safeApiRequest(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
