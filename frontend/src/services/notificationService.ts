import { AppNotification } from '../types';
import { getAuthToken } from '../utils/token';

const API_URL = '/api';

function getToken(): string | null {
  return getAuthToken();
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const notificationService = {
  async getNotifications(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    const res = await fetch(`${API_URL}/notifications`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markAsRead(id: string): Promise<{ success: boolean; notification: AppNotification }> {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async markAllAsRead(): Promise<{ success: boolean; updatedCount: number }> {
    const res = await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  async getNotificationById(id: string): Promise<{ notification: AppNotification }> {
    const res = await fetch(`${API_URL}/notifications/${id}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to retrieve notification details');
    return res.json();
  },

  async getEmailLogs(params?: { status?: string; eventType?: string }): Promise<{ emails: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.eventType && params.eventType !== 'All') query.set('eventType', params.eventType);

    const res = await fetch(`${API_URL}/notifications/outbox?${query.toString()}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch email logs');
    return res.json();
  },

  async retryEmail(id: string): Promise<{ success: boolean; email: any }> {
    const res = await fetch(`${API_URL}/notifications/outbox/${id}/retry`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to retry email delivery');
    return res.json();
  }
};
