import fs from 'fs';
import path from 'path';
import { AppNotification, NotificationType } from '../models/notification';

const NOTIFICATIONS_FILE = path.join(__dirname, '../../data/notifications.json');

class NotificationDatabase {
  private notifications: Map<string, AppNotification> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    const dir = path.dirname(NOTIFICATIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      try {
        const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
        const list: AppNotification[] = JSON.parse(raw);
        list.forEach(n => this.notifications.set(n.id, n));
        return;
      } catch (err) {
        console.error('Error reading notifications file:', err);
      }
    }

    this.notifications.clear();
    this.save();
  }

  public save() {
    try {
      const dir = path.dirname(NOTIFICATIONS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.notifications.values());
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing notifications file:', err);
    }
  }

  public createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    orderId?: string;
    orderNumber?: string;
    projectId?: string;
    projectNumber?: string;
    referenceId?: string;
    referenceType?: 'ORDER' | 'PROJECT' | 'TASK' | 'USER' | 'PAYMENT' | 'DEPLOYMENT';
  }): AppNotification {
    const now = new Date().toISOString();
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      projectId: params.projectId,
      projectNumber: params.projectNumber,
      referenceId: params.referenceId || params.orderId || params.projectId,
      referenceType: params.referenceType || (params.projectId ? 'PROJECT' : params.orderId ? 'ORDER' : undefined),
      read: false,
      createdAt: now,
      updatedAt: now
    };

    this.notifications.set(notif.id, notif);
    this.save();
    return notif;
  }

  public getById(id: string): AppNotification | null {
    return this.notifications.get(id) || null;
  }

  public getForUser(userId: string): AppNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markAsRead(id: string, userId: string): AppNotification | null {
    const notif = this.notifications.get(id);
    if (!notif || notif.userId !== userId) return null;
    notif.read = true;
    this.notifications.set(id, notif);
    this.save();
    return notif;
  }

  public markAllAsRead(userId: string): number {
    let count = 0;
    for (const notif of this.notifications.values()) {
      if (notif.userId === userId && !notif.read) {
        notif.read = true;
        count++;
      }
    }
    if (count > 0) this.save();
    return count;
  }

  public getUnreadCount(userId: string): number {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.read).length;
  }
}

export const notificationDb = new NotificationDatabase();
