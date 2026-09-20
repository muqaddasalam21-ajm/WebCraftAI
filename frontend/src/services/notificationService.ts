import { AppNotification } from '../types';
import { getAuthToken } from '../utils/token';
import { safeApiRequest } from '../utils/apiConfig';

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
    return safeApiRequest<{ notifications: AppNotification[]; unreadCount: number }>('/api/notifications', {
      headers: authHeaders()
    });
  },

  async markAsRead(id: string): Promise<{ success: boolean; notification: AppNotification }> {
    return safeApiRequest<{ success: boolean; notification: AppNotification }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: authHeaders()
    });
  },

  async markAllAsRead(): Promise<{ success: boolean; updatedCount: number }> {
    return safeApiRequest<{ success: boolean; updatedCount: number }>('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: authHeaders()
    });
  },

  async getNotificationById(id: string): Promise<{ notification: AppNotification }> {
    return safeApiRequest<{ notification: AppNotification }>(`/api/notifications/${id}`, {
      headers: authHeaders()
    });
  },

  async getEmailLogs(params?: { status?: string; eventType?: string }): Promise<{ emails: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.eventType && params.eventType !== 'All') query.set('eventType', params.eventType);

    const qs = query.toString();
    return safeApiRequest<{ emails: any[]; total: number }>(`/api/notifications/outbox${qs ? `?${qs}` : ''}`, {
      headers: authHeaders()
    });
  },

  async retryEmail(id: string): Promise<{ success: boolean; email: any }> {
    return safeApiRequest<{ success: boolean; email: any }>(`/api/notifications/outbox/${id}/retry`, {
      method: 'POST',
      headers: authHeaders()
    });
  }
};
