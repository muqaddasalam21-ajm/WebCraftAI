export type UserRole = 'Admin' | 'User' | 'Vendor' | 'Manager' | 'admin' | 'user' | 'vendor' | 'manager';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Vendor' | 'Manager';
  status: 'active' | 'inactive';
  profile?: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    company?: string;
  };
  createdAt?: string;
}

export interface AuthResponse {
  message?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    createdAt: string;
  };
  token: string;
}

const TOKEN_KEY = 'webcraft_auth_token';
const USER_KEY = 'webcraft_auth_user';

export const normalizeRole = (role: string): 'Admin' | 'User' | 'Vendor' | 'Manager' => {
  const lower = role.toLowerCase();
  if (lower === 'admin') return 'Admin';
  if (lower === 'vendor') return 'Vendor';
  if (lower === 'manager') return 'Manager';
  return 'User';
};

import { getAuthToken } from '../utils/token';
import { safeApiRequest } from '../utils/apiConfig';

export const authService = {
  getToken(): string | null {
    return getAuthToken();
  },

  getCurrentUser(): AuthenticatedUser | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        role: normalizeRole(parsed.role)
      };
    } catch {
      return null;
    }
  },

  setSession(user: any, token: string): AuthenticatedUser {
    const safeUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
      status: user.status || 'active',
      createdAt: user.createdAt
    };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    localStorage.setItem('webcraft_auth', JSON.stringify({ token, user: safeUser }));
    localStorage.setItem('token', token);
    return safeUser;
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('webcraft_auth');
    localStorage.removeItem('token');
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getCurrentUser());
  },

  async login(email: string, password: string): Promise<AuthenticatedUser> {
    const data = await safeApiRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    });

    if (!data.user || !data.token) {
      throw new Error('Invalid authentication response from server.');
    }

    return this.setSession(data.user, data.token);
  },

  async signup(name: string, email: string, password: string, confirmPassword?: string): Promise<AuthenticatedUser> {
    const data = await safeApiRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, confirmPassword })
    });

    if (!data.user || !data.token) {
      throw new Error('Registration succeeded, but session could not be established.');
    }

    return this.setSession(data.user, data.token);
  },

  async getMe(): Promise<AuthenticatedUser | null> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return null;
    }

    try {
      const data = await safeApiRequest('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const user = data.user;
      if (!user) {
        return this.getCurrentUser();
      }

      const safeUser: AuthenticatedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        status: user.status || 'active',
        createdAt: user.createdAt
      };
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
      return safeUser;
    } catch {
      return this.getCurrentUser();
    }
  },

  async signOut(): Promise<void> {
    const token = this.getToken();
    try {
      if (token) {
        await safeApiRequest('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      this.clearSession();
    }
  }
};
