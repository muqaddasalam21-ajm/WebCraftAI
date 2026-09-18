import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AuditLog, AuditAction } from '../models/audit';

const AUDIT_FILE = path.join(__dirname, '../../data/audit-logs.json');

function ensureFileExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
  }
}

class AuditDatabase {
  private logs: AuditLog[] = [];

  constructor() {
    this.load();
  }

  private load() {
    ensureFileExists(AUDIT_FILE);
    try {
      const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
      this.logs = JSON.parse(raw);
    } catch (e) {
      console.error('Error reading audit-logs.json:', e);
      this.logs = [];
    }
  }

  public save() {
    try {
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.logs, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving audit-logs.json:', e);
    }
  }

  public log(params: {
    action: AuditAction;
    userId: string;
    userName: string;
    userRole: string;
    targetId?: string;
    targetType?: string;
    details: string;
    metadata?: Record<string, any>;
  }): AuditLog {
    const entry: AuditLog = {
      id: `adt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      action: params.action,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      targetId: params.targetId,
      targetType: params.targetType,
      details: params.details,
      metadata: params.metadata,
      createdAt: new Date().toISOString()
    };

    this.logs.unshift(entry);
    // Keep last 1000 events
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }
    this.save();
    return entry;
  }

  public query(filter?: {
    userId?: string;
    action?: string;
    targetId?: string;
    limit?: number;
  }): AuditLog[] {
    let list = this.logs;
    if (filter?.userId) {
      list = list.filter(l => l.userId === filter.userId);
    }
    if (filter?.action && filter.action !== 'All') {
      list = list.filter(l => l.action === filter.action);
    }
    if (filter?.targetId) {
      list = list.filter(l => l.targetId === filter.targetId);
    }
    const limit = filter?.limit || 50;
    return list.slice(0, limit);
  }
}

export const auditDb = new AuditDatabase();
