import { useState, useEffect } from 'react';

export interface GarageNotificationItem {
  id: string;
  category: 'SERVICE_REMINDER' | 'CUSTOMER_NOTICE' | 'INVOICE_QUOTATION' | 'AUDIT_SYSTEM';
  title: string;
  message: string;
  vehicleRef?: string;
  vehicleId?: string;
  customerName?: string;
  timestamp: string;
  isRead: boolean;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  actionRoute?: string;
}

const DEFAULT_GARAGE_NOTIFICATIONS: GarageNotificationItem[] = [
  {
    id: 'notif-1',
    category: 'SERVICE_REMINDER',
    title: 'Routine 40,000 km Service Due',
    message: 'Vehicle WP CAS-9988 telemetry shows 42,100 km. Automated periodic reminder sent to owner.',
    vehicleRef: 'WP CAS-9988',
    vehicleId: 'veh-2',
    customerName: 'Anura Fernando',
    timestamp: '10 minutes ago',
    isRead: false,
    priority: 'HIGH',
    actionRoute: '/garage/maintenance/new?vehicleId=veh-2',
  },
  {
    id: 'notif-2',
    category: 'INVOICE_QUOTATION',
    title: 'Quotation QT-2026-8492 Viewed by Client',
    message: 'Nimal Perera opened and reviewed formal estimate (LKR 43,300) for Toyota Prius WP ABC-1234.',
    vehicleRef: 'WP ABC-1234',
    vehicleId: 'veh-1',
    customerName: 'Nimal Perera',
    timestamp: '1 hour ago',
    isRead: false,
    priority: 'NORMAL',
    actionRoute: '/garage/vehicles/veh-1',
  },
  {
    id: 'notif-3',
    category: 'CUSTOMER_NOTICE',
    title: 'Owner Digital Countersignature Received',
    message: 'Kasun Bandara verified and countersigned service invoice INV-2026-8492.',
    vehicleRef: 'WP CAD-1212',
    vehicleId: 'veh-3',
    customerName: 'Kasun Bandara',
    timestamp: '3 hours ago',
    isRead: false,
    priority: 'NORMAL',
    actionRoute: '/garage/service-records',
  },
  {
    id: 'notif-4',
    category: 'AUDIT_SYSTEM',
    title: 'Station Inspection Terminal Key Validated',
    message: 'Station terminal key 0x9f4a...81c2 validated under BR-03 accreditation.',
    timestamp: 'Yesterday at 17:30',
    isRead: true,
    priority: 'LOW',
    actionRoute: '/garage/audit',
  },
  {
    id: 'notif-5',
    category: 'SERVICE_REMINDER',
    title: 'Brake Fluid Flush Inspection Overdue',
    message: 'Telemetry disparity flagged on WP CAS-9988. Brake pad sensor resistance near wear limit.',
    vehicleRef: 'WP CAS-9988',
    vehicleId: 'veh-2',
    customerName: 'Anura Fernando',
    timestamp: '2 days ago',
    isRead: true,
    priority: 'HIGH',
    actionRoute: '/garage/maintenance/new?vehicleId=veh-2',
  },
  {
    id: 'notif-6',
    category: 'INVOICE_QUOTATION',
    title: 'Invoice INV-2026-8109 Settlement Confirmed',
    message: 'Payment of LKR 28,500 settled for Honda Vezel WP CAS-9988 periodic service.',
    vehicleRef: 'WP CAS-9988',
    vehicleId: 'veh-2',
    customerName: 'Anura Fernando',
    timestamp: '3 days ago',
    isRead: true,
    priority: 'NORMAL',
    actionRoute: '/garage/service-records',
  },
];

const STORAGE_KEY = 'autocare_garage_notifications';
const EVENT_NAME = 'autocare_garage_notifications_changed';

export const getGarageNotifications = (): GarageNotificationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GARAGE_NOTIFICATIONS));
      return DEFAULT_GARAGE_NOTIFICATIONS;
    }
    return JSON.parse(raw) as GarageNotificationItem[];
  } catch {
    return DEFAULT_GARAGE_NOTIFICATIONS;
  }
};

export const saveGarageNotifications = (items: GarageNotificationItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
};

export const getUnreadGarageNotificationsCount = (): number => {
  const items = getGarageNotifications();
  return items.filter((n) => !n.isRead).length;
};

export const toggleGarageNotificationRead = (id: string): GarageNotificationItem[] => {
  const items = getGarageNotifications();
  const updated = items.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
  saveGarageNotifications(updated);
  return updated;
};

export const markAllGarageNotificationsAsRead = (): GarageNotificationItem[] => {
  const items = getGarageNotifications();
  const updated = items.map((n) => ({ ...n, isRead: true }));
  saveGarageNotifications(updated);
  return updated;
};

export const clearReadGarageNotifications = (): GarageNotificationItem[] => {
  const items = getGarageNotifications();
  const updated = items.filter((n) => !n.isRead);
  saveGarageNotifications(updated);
  return updated;
};

/**
 * Custom React hook for live unread count updates across components
 */
export const useGarageUnreadCount = (): number => {
  const [count, setCount] = useState<number>(() => getUnreadGarageNotificationsCount());

  useEffect(() => {
    const handler = () => {
      setCount(getUnreadGarageNotificationsCount());
    };
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return count;
};
