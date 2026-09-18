export type UserRole = 'admin' | 'user' | 'vendor' | 'manager';

export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  company?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthTokens {
  token: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}
