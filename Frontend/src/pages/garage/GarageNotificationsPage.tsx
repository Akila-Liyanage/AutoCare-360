import React, { useState } from 'react';
import { Bell, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-dashboard.css';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'verification' | 'invoice' | 'service' | 'alert';
}

export const GarageNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Service Record Published & Verified',
      message: 'Hybrid Battery Diagnostic & Major Service for WP CAB-7890 committed to the tamper-proof ledger.',
      time: 'Just now',
      read: false,
      type: 'service',
    },
    {
      id: 'notif-2',
      title: 'Owner Linked Successfully',
      message: 'Chathura Perera confirmed vehicle passport association for WP CAB-7890 (Toyota Prius Prime).',
      time: '2 hours ago',
      read: false,
      type: 'verification',
    },
    {
      id: 'notif-3',
      title: 'New Service Request',
      message: 'Vehicle WP CAR-1010 has routine periodic maintenance scheduled.',
      time: '1 day ago',
      read: true,
      type: 'invoice',
    },
    {
      id: 'notif-4',
      title: 'Accreditation Status Confirmed',
      message: 'Perera Auto Works partner accreditation is valid and verified through 31 Dec 2026.',
      time: '3 days ago',
      read: true,
      type: 'verification',
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
            Real-time updates, customer confirmations and ledger publication alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          Mark all as read
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
        {notifications.map((notif) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: '#0A1128' }}>
                  {notif.title}
                </h3>
                <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>{notif.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: '18px' }}>
                {notif.message}
              </p>
            </div>
          </div>
        ))}
      </section>
    </GarageLayout>
  );
};

export default GarageNotificationsPage;
