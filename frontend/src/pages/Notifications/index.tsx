import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  RefreshCw,
  Mail,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppNotification, EmailLog } from '../../types';
import { notificationService } from '../../services/notificationService';
import { Button } from '../../components/Button';

export const NotificationsPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'outbox'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const isStaff = role === 'Admin' || role === 'Manager';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const notifData = await notificationService.getNotifications();
      setNotifications(notifData.notifications);
      setUnreadCount(notifData.unreadCount);

      if (isStaff) {
        try {
          const emailData = await notificationService.getEmailLogs();
          setEmailLogs(emailData.emails);
        } catch (e) {
          console.error('Failed to load email outbox audit logs:', e);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      if (link) {
        navigate(link);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryEmail = async (emailId: string) => {
    try {
      setActionLoading(true);
      const res = await notificationService.retryEmail(emailId);
      if (res.success) {
        setEmailLogs(prev =>
          prev.map(e => (e.id === emailId ? res.email : e))
        );
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'PAYMENT_SUCCESSFUL':
      case 'FINAL_DELIVERY':
      case 'CUSTOMER_APPROVAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PAYMENT_FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'PROJECT_CREATED':
      case 'PROJECT_ASSIGNED':
      case 'TASK_ASSIGNED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'ORDER_CREATED':
      case 'NEW_ORDER':
      case 'ACCOUNT_CREATED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Real-time persistent notifications and delivery audit tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'unread'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {isStaff && (
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'outbox'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email Outbox Audit ({emailLogs.length})
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading notifications...</p>
        </div>
      ) : activeTab === 'outbox' ? (
        /* Email Outbox Audit Tab */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Transactional Email Delivery Logs</h2>
              <p className="text-xs text-slate-500">Persistent disk-backed audit records of server-sent emails</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
              Resend / Persistent Outbox
            </span>
          </div>

          {emailLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Mail className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No email records found</p>
              <p className="text-xs text-slate-400 mt-1">Transactional emails dispatched by backend events will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {emailLogs.map(log => (
                <div key={log.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                        log.status === 'SENT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.status === 'SIMULATED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{log.eventType}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">To: {log.to}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900">{log.subject}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{log.text}</p>

                    {log.error && (
                      <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg font-mono">
                        Error: {log.error}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end gap-2 shrink-0">
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimestamp(log.createdAt)}
                    </div>

                    {log.status === 'FAILED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryEmail(log.id)}
                        disabled={actionLoading}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        Retry Delivery
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Notifications List */
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border-dashed border-2 border-slate-200 p-12 text-center">
              <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                When you place orders, receive project updates, or complete payments, persistent notifications will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map(n => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl transition-all border ${
                  !n.read
                    ? 'bg-white border-brand-200/80 shadow-sm ring-1 ring-brand-100'
                    : 'bg-white/80 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Unread indicator */}
                  <div className="pt-1">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        !n.read ? 'bg-brand-600 animate-pulse' : 'bg-slate-200'
                      }`}
                      title={!n.read ? 'Unread notification' : 'Read notification'}
                    />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(n.type)}`}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      {n.orderNumber && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Order: {n.orderNumber}
                        </span>
                      )}
                      {n.projectNumber && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Project: {n.projectNumber}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {n.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimestamp(n.createdAt)}
                      </span>

                      {n.link && (
                        <button
                          onClick={() => handleMarkAsRead(n.id, n.link)}
                          className="font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
                        >
                          View details <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
