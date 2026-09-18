import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, SafeUser, UserRole, UserStatus, UserProfile } from '../models/user';

const DB_FILE = path.join(__dirname, '../../data/users.json');

class PersistentUserDatabase {
  private users: Map<string, User> = new Map();

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: User[] = JSON.parse(raw);
        parsed.forEach(u => this.users.set(u.email.toLowerCase(), u));
        console.log(`📦 Loaded ${this.users.size} users from persistent storage.`);
        return;
      } catch (err) {
        console.error('Error reading user database, re-seeding default records:', err);
      }
    }

    this.seedDefaultUsers();
  }

  private saveToDisk() {
    try {
      const dataDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const list = Array.from(this.users.values());
      fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving user database to disk:', err);
    }
  }

  private seedDefaultUsers() {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('Password123!', salt);

    const initialUsers: User[] = [
      {
        id: 'usr_admin_01',
        name: 'Alexander Wright',
        email: 'admin@webcraft.ai',
        passwordHash: demoPasswordHash,
        role: 'admin',
        status: 'active',
        profile: {
          fullName: 'Alexander Wright',
          phone: '+1 (555) 234-5678',
          bio: 'Lead Administrator & Platform Architect at WebCraftAI',
          company: 'WebCraft Global Corp'
        },
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'usr_vendor_01',
        name: 'Elena Rostova',
        email: 'vendor@webcraft.ai',
        passwordHash: demoPasswordHash,
        role: 'vendor',
        status: 'active',
        profile: {
          fullName: 'Elena Rostova',
          phone: '+1 (555) 456-7890',
          bio: 'Curator of modern minimalist website templates & digital goods',
          company: 'Nordic Studio Designs'
        },
        createdAt: '2026-02-10T10:30:00.000Z',
        updatedAt: '2026-02-10T10:30:00.000Z',
      },
      {
        id: 'usr_manager_01',
        name: 'Marcus Vance',
        email: 'manager@webcraft.ai',
        passwordHash: demoPasswordHash,
        role: 'manager',
        status: 'active',
        profile: {
          fullName: 'Marcus Vance',
          phone: '+1 (555) 789-0123',
          bio: 'Operations & Order Fulfillment Supervisor',
          company: 'WebCraft Operations'
        },
        createdAt: '2026-02-20T14:15:00.000Z',
        updatedAt: '2026-02-20T14:15:00.000Z',
      },
      {
        id: 'usr_customer_01',
        name: 'Sarah Jenkins',
        email: 'user@webcraft.ai',
        passwordHash: demoPasswordHash,
        role: 'user',
        status: 'active',
        profile: {
          fullName: 'Sarah Jenkins',
          phone: '+1 (555) 890-1234',
          bio: 'E-commerce boutique founder & AI website builder enthusiast',
          company: 'Lumière Beauty Store'
        },
        createdAt: '2026-03-01T09:45:00.000Z',
        updatedAt: '2026-03-01T09:45:00.000Z',
      }
    ];

    this.users.clear();
    initialUsers.forEach(u => this.users.set(u.email.toLowerCase(), u));
    this.saveToDisk();
  }

  public findByEmail(email: string): User | undefined {
    return this.users.get(email.trim().toLowerCase());
  }

  public findById(id: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  public getAll(): SafeUser[] {
    return Array.from(this.users.values()).map(u => this.toSafeUser(u));
  }

  public getStats() {
    const list = Array.from(this.users.values());
    const totalUsers = list.length;
    const activeUsers = list.filter(u => u.status === 'active').length;
    const inactiveUsers = list.filter(u => u.status === 'inactive').length;
    const admins = list.filter(u => u.role === 'admin' && u.status === 'active').length;
    const vendors = list.filter(u => u.role === 'vendor').length;
    const managers = list.filter(u => u.role === 'manager').length;
    const customers = list.filter(u => u.role === 'user').length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      admins,
      vendors,
      managers,
      customers
    };
  }

  public queryUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let list = Array.from(this.users.values());

    // Search filter (name, email)
    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (params.role && params.role !== 'All' && params.role !== 'all') {
      const targetRole = params.role.toLowerCase();
      list = list.filter(u => u.role === targetRole);
    }

    // Status filter
    if (params.status && params.status !== 'All' && params.status !== 'all') {
      const targetStatus = params.status.toLowerCase();
      list = list.filter(u => u.status === targetStatus);
    }

    // Sorting
    const sortOrder = params.sortOrder === 'desc' ? -1 : 1;
    if (params.sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name) * sortOrder);
    } else if (params.sortBy === 'oldest') {
      list.sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } else {
      // Default: newest first
      list.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * sortOrder);
    }

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      users: paginated.map(u => this.toSafeUser(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public create(userData: {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    phone?: string;
  }): SafeUser {
    const emailKey = userData.email.trim().toLowerCase();
    if (this.users.has(emailKey)) {
      throw new Error('An account with this email already exists.');
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: userData.name.trim(),
      email: emailKey,
      passwordHash: userData.passwordHash,
      role: userData.role || 'user',
      status: 'active',
      profile: {
        fullName: userData.name.trim(),
        phone: userData.phone || ''
      },
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(emailKey, newUser);
    this.saveToDisk();
    return this.toSafeUser(newUser);
  }

  public update(id: string, updates: {
    name?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    profile?: Partial<UserProfile>;
    passwordHash?: string;
  }): SafeUser {
    const user = this.findById(id);
    if (!user) {
      throw new Error('User not found.');
    }

    const oldEmailKey = user.email.toLowerCase();

    // Check if new email conflicts with another account
    if (updates.email && updates.email.trim().toLowerCase() !== oldEmailKey) {
      const newEmailKey = updates.email.trim().toLowerCase();
      if (this.users.has(newEmailKey)) {
        throw new Error('An account with this email already exists.');
      }
      this.users.delete(oldEmailKey);
      user.email = newEmailKey;
    }

    if (updates.name !== undefined) {
      user.name = updates.name.trim();
      if (user.profile) user.profile.fullName = updates.name.trim();
    }

    if (updates.role !== undefined) {
      // Self-protection check: ensure at least one active Admin remains
      if (user.role === 'admin' && updates.role !== 'admin') {
        const remainingAdmins = Array.from(this.users.values()).filter(
          u => u.id !== user.id && u.role === 'admin' && u.status === 'active'
        );
        if (remainingAdmins.length === 0) {
          throw new Error('Cannot change role: At least one active Administrator must remain on the platform.');
        }
      }
      user.role = updates.role;
    }

    if (updates.status !== undefined) {
      // Self-protection check: cannot deactivate the sole admin
      if (user.role === 'admin' && updates.status === 'inactive') {
        const remainingAdmins = Array.from(this.users.values()).filter(
          u => u.id !== user.id && u.role === 'admin' && u.status === 'active'
        );
        if (remainingAdmins.length === 0) {
          throw new Error('Cannot deactivate user: At least one active Administrator must remain on the platform.');
        }
      }
      user.status = updates.status;
    }

    if (updates.profile !== undefined) {
      user.profile = {
        ...user.profile,
        ...updates.profile
      };
      if (updates.profile.fullName) {
        user.name = updates.profile.fullName.trim();
      }
    }

    if (updates.passwordHash !== undefined) {
      user.passwordHash = updates.passwordHash;
    }

    user.updatedAt = new Date().toISOString();
    this.users.set(user.email.toLowerCase(), user);
    this.saveToDisk();

    return this.toSafeUser(user);
  }

  public delete(id: string): void {
    const user = this.findById(id);
    if (!user) {
      throw new Error('User not found.');
    }

    // Protection check: Cannot delete the last active admin
    if (user.role === 'admin') {
      const remainingAdmins = Array.from(this.users.values()).filter(
        u => u.id !== user.id && u.role === 'admin' && u.status === 'active'
      );
      if (remainingAdmins.length === 0) {
        throw new Error('Cannot delete account: At least one active Administrator must remain on the platform.');
      }
    }

    this.users.delete(user.email.toLowerCase());
    this.saveToDisk();
  }

  public toSafeUser(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}

export const userDb = new PersistentUserDatabase();
