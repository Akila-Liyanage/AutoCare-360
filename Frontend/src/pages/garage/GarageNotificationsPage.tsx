import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  dismissNotification,
  type BackendNotification,
} from '../../services/notificationService';
import '../../styles/garage-dashboard.css';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'verification' | 'invoice' | 'service' | 'alert';
}

const mapNotificationType = (type?: string): 'verification' | 'invoice' | 'service' | 'alert' => {
  const t = (type || '').toLowerCase();
  if (t.includes('verification') || t.includes('kyc') || t.includes('auth')) return 'verification';
  if (t.includes('invoice') || t.includes('quotation') || t.includes('payment') || t.includes('cost')) return 'invoice';
  if (t.includes('alert') || t.includes('warning') || t.includes('urgent')) return 'alert';
  return 'service';
};

const formatNotificationTime = (createdAt?: string): string => {
  if (!createdAt) return 'Recently';
  try {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return 'Recently';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch {
    return 'Recently';
  }
};

const mapBackendToItem = (doc: BackendNotification): NotificationItem => ({
  id: doc._id,
  title: doc.title,
  message: doc.message,
  time: formatNotificationTime(doc.createdAt),
  read: doc.status === 'read',
  type: mapNotificationType(doc.type),
});

export const GarageNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getNotifications();
      setNotifications(docs.map(mapBackendToItem));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to retrieve notifications. Please check your connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getNotifications()
      .then((docs) => {
        if (isMounted) {
          setNotifications(docs.map(mapBackendToItem));
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to retrieve notifications. Please check your connection.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      if (currentRead) {
        await markNotificationUnread(id);
      } else {
        await markNotificationRead(id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !currentRead } : n))
      );
    } catch (err: unknown) {
      console.error('Failed to update notification status:', err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: unknown) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      setIsUpdating(true);
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: unknown) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <GarageLayout activeItem="Notifications" breadcrumbCurrent="Notifications">
      {/* Title Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: '22px',
              lineHeight: '28px',
              color: '#0A1128',
              margin: '0 0 4px 0',
            }}
          >
            Notifications
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '13.5px',
              lineHeight: '18px',
              color: '#64748B',
              margin: 0,
            }}
          >
            Real-time updates, customer confirmations and platform activity alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={loading || isUpdating || notifications.filter((n) => !n.read).length === 0}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: notifications.some((n) => !n.read) ? '#334155' : '#94A3B8',
            cursor: notifications.some((n) => !n.read) && !loading && !isUpdating ? 'pointer' : 'default',
            opacity: notifications.some((n) => !n.read) ? 1 : 0.6,
          }}
        >
          {isUpdating ? 'Marking...' : 'Mark all as read'}
        </button>
      </div>

      {/* Notifications List */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #DCE5EF',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', fontSize: '13.5px' }}>
            Loading notifications...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '8px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchNotifications}
              style={{
                background: 'transparent',
                border: '1px solid #DC2626',
                borderRadius: '4px',
                color: '#DC2626',
                fontSize: '12px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: '#64748B',
            }}
          >
            <Bell size={36} style={{ color: '#CBD5E1', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0' }}>
              No notifications yet
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              You're all caught up! Updates regarding service records, customer confirmations, and quotes will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px',
                borderRadius: '8px',
                background: notif.read ? '#FAFAFA' : '#F0F7FF',
                border: notif.read ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: notif.read ? '#F1F5F9' : '#0056A2',
                  color: notif.read ? '#64748B' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {notif.type === 'service' ? (
                  <CheckCircle2 size={18} />
                ) : notif.type === 'verification' ? (
                  <ShieldCheck size={18} />
                ) : notif.type === 'alert' ? (
                  <AlertTriangle size={18} />
                ) : (
                  <Bell size={18} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                    gap: '10px',
                  }}
                >
                  <h3 style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: '#0A1128' }}>
                    {notif.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>{notif.time}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleRead(notif.id, notif.read)}
                      title={notif.read ? 'Mark as unread' : 'Mark as read'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        color: '#0056A2',
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      {notif.read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismiss(notif.id)}
                      title="Dismiss notification"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: '18px' }}>
                  {notif.message}
                </p>
              </div>
            </div>
          ))
        )}
      </section>
    </GarageLayout>
  );
};

export default GarageNotificationsPage;
