import { authService, normalizeRole } from './authService';
import { User, UserRole, UserStatus } from '../types';

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

    const res = await fetch(`/api/users?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch users');
    }

    const data = await res.json();
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
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user');
    return data.user;
  },

  async deleteUser(id: string): Promise<void> {
    const token = authService.getToken();
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
  },

  async getStats() {
    const token = authService.getToken();
    const res = await fetch('/api/users/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats;
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
    const res = await fetch(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch user details');
    }
    return res.json();
  }
};
