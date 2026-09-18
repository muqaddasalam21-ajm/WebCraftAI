import fs from 'fs';
import path from 'path';
import { EmailLog, EmailStatus } from '../models/email';

const EMAILS_FILE = path.join(__dirname, '../../data/emails.json');

class EmailDatabase {
  private emails: Map<string, EmailLog> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const dir = path.dirname(EMAILS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(EMAILS_FILE)) {
        const raw = fs.readFileSync(EMAILS_FILE, 'utf-8');
        const list: EmailLog[] = JSON.parse(raw);
        this.emails.clear();
        list.forEach(e => this.emails.set(e.id, e));
        return;
      }
    } catch (err) {
      console.error('Error reading emails.json store:', err);
    }
    this.emails.clear();
    this.save();
  }

  public save(): void {
    try {
      const dir = path.dirname(EMAILS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.emails.values());
      fs.writeFileSync(EMAILS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing emails.json store:', err);
    }
  }

  public create(email: EmailLog): EmailLog {
    this.emails.set(email.id, email);
    this.save();
    return email;
  }

  public getById(id: string): EmailLog | null {
    return this.emails.get(id) || null;
  }

  public getByEventId(eventId: string): EmailLog | null {
    return Array.from(this.emails.values()).find(e => e.eventId === eventId) || null;
  }

  public getByEventIdAndRecipient(eventId: string, to: string): EmailLog | null {
    const normalizedTo = to.trim().toLowerCase();
    return Array.from(this.emails.values()).find(
      e => e.eventId === eventId && e.to.trim().toLowerCase() === normalizedTo
    ) || null;
  }

  public updateStatus(
    id: string,
    status: EmailStatus,
    updates?: { providerMessageId?: string; error?: string }
  ): EmailLog | null {
    const email = this.emails.get(id);
    if (!email) return null;

    email.status = status;
    email.updatedAt = new Date().toISOString();
    if (updates?.providerMessageId) email.providerMessageId = updates.providerMessageId;
    if (updates?.error !== undefined) email.error = updates.error;
    if (status === 'FAILED') email.retryCount = (email.retryCount || 0) + 1;

    this.emails.set(id, email);
    this.save();
    return email;
  }

  public getAll(filter?: { status?: string; eventType?: string }): EmailLog[] {
    let list = Array.from(this.emails.values());
    if (filter?.status && filter.status !== 'All') {
      list = list.filter(e => e.status === filter.status);
    }
    if (filter?.eventType && filter.eventType !== 'All') {
      list = list.filter(e => e.eventType === filter.eventType);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const emailDb = new EmailDatabase();
