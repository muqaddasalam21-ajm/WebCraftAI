import { authService, normalizeRole } from './authService';
import { User, UserRole, UserStatus } from '../types';
import { safeApiRequest } from '../utils/apiConfig';

export const profileService = {
  async getProfile(): Promise<User> {
    const token = authService.getToken();
    const data = await safeApiRequest('/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const u = data.user;
    return {
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
    };
  },

  async updateProfile(updates: {
    fullName: string;
    phone?: string;
    bio?: string;
    company?: string;
  }): Promise<User> {
    const token = authService.getToken();
    const data = await safeApiRequest('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    return data.user;
  },

  async changePassword(passwords: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<void> {
    const token = authService.getToken();
    await safeApiRequest('/api/profile/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(passwords)
    });
  }
};
