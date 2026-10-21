import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  X,
  Wrench,
  FileText,
  User,
  ShieldCheck,
  Search,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import '../../styles/garage-dashboard.css';
import {
  getGarageNotifications,
  toggleGarageNotificationRead,
  markAllGarageNotificationsAsRead,
  clearReadGarageNotifications,
} from './garageNotificationStore';

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

interface ToastState {
  show: boolean;
  message: string;
}

export const GarageNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<GarageNotificationItem[]>(
    () => getGarageNotifications()
  );
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Toggle Read/Unread
  const handleToggleRead = (id: string) => {
    const updated = toggleGarageNotificationRead(id);
    setNotifications(updated);
    const target = updated.find((n) => n.id === id);
    showToast(target?.isRead ? 'Marked as read.' : 'Marked as unread.');
  };

  // Mark all as read
    const handleMarkAllRead = () => {
    const updated = markAllGarageNotificationsAsRead();
    setNotifications(updated);
    showToast('All garage notifications marked as read.');
  };

  // Clear Read
    const handleClearRead = () => {
    const updated = clearReadGarageNotifications();
    setNotifications(updated);
    showToast('Read notifications cleared.');
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'UNREAD' && n.isRead) return false;
      if (activeTab === 'READ' && !n.isRead) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.vehicleRef && n.vehicleRef.toLowerCase().includes(q)) ||
        (n.customerName && n.customerName.toLowerCase().includes(q))
      );
    });
  }, [notifications, activeTab, selectedCategory, searchQuery]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const getCategoryBadge = (category: GarageNotificationItem['category']) => {
    switch (category) {
      case 'SERVICE_REMINDER':
        return { label: 'Service Reminder', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'INVOICE_QUOTATION':
        return { label: 'Quotation / Invoice', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'CUSTOMER_NOTICE':
        return { label: 'Customer Notice', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
      case 'AUDIT_SYSTEM':
        return { label: 'Audit / Security', bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      default:
        return { label: 'Notice', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  const getCategoryIcon = (category: GarageNotificationItem['category']) => {
    switch (category) {
      case 'SERVICE_REMINDER':
        return <Wrench size={18} style={{ color: '#2563eb' }} />;
      case 'INVOICE_QUOTATION':
        return <FileText size={18} style={{ color: '#059669' }} />;
      case 'CUSTOMER_NOTICE':
        return <User size={18} style={{ color: '#7c3aed' }} />;
      case 'AUDIT_SYSTEM':
        return <ShieldCheck size={18} style={{ color: '#d97706' }} />;
      default:
        return <Bell size={18} style={{ color: '#64748b' }} />;
    }
  };

  return (
    <GarageLayout activeItem="Notifications" breadcrumbCurrent="Garage Notifications">
      {/* Title & Actions Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Garage Service &amp; Client Notifications</h1>
          <p className="autocare-garage-main-subtitle">
            Stay updated with automated vehicle maintenance schedules, client authorizations, and digital invoice sign-offs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="autocare-garage-btn-primary"
              onClick={handleMarkAllRead}
              style={{ fontSize: '13px' }}
            >
              <Check size={16} />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}

          <button
            type="button"
            className="autocare-garage-hero-btn"
            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', fontSize: '13px' }}
            onClick={handleClearRead}
          >
            <Trash2 size={15} />
            <span>Clear Read</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Tab Filters */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 14px',
            flex: '1 1 280px',
            maxWidth: '460px',
          }}
        >
          <Search size={16} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications by title, vehicle plate, or client..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              color: '#0f172a',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Read Status Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(['ALL', 'UNREAD', 'READ'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#003874' : '#f1f5f9',
                color: activeTab === tab ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: activeTab === tab ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'UNREAD' ? `Unread (${unreadCount})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Filter Category:</span>
        {[
          { key: 'ALL', label: 'All Notices' },
          { key: 'SERVICE_REMINDER', label: 'Service Reminders' },
          { key: 'CUSTOMER_NOTICE', label: 'Customer Notices' },
          { key: 'INVOICE_QUOTATION', label: 'Quotations & Invoices' },
          { key: 'AUDIT_SYSTEM', label: 'Audit & System' },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            style={{
              background: selectedCategory === cat.key ? '#eff6ff' : '#ffffff',
              color: selectedCategory === cat.key ? '#0056a2' : '#64748b',
              border: selectedCategory === cat.key ? '1px solid #93c5fd' : '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: selectedCategory === cat.key ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notification Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotifications.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '48px 20px',
              textAlign: 'center',
            }}
          >
            <Bell size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>
              No notifications found
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              You are all caught up! New vehicle telemetry updates and client authorizations will appear here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const badge = getCategoryBadge(notif.category);
            return (
              <div
                key={notif.id}
                style={{
                  background: notif.isRead ? '#ffffff' : '#f8fafc',
                  border: notif.isRead ? '1px solid #e2e8f0' : '1.5px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: notif.isRead ? '0 1px 2px rgba(0,0,0,0.03)' : '0 2px 6px rgba(0, 56, 116, 0.06)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Left: Icon & Content */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: notif.isRead ? '#f1f5f9' : '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>

                      {notif.priority === 'HIGH' && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                          }}
                        >
                          HIGH PRIORITY
                        </span>
                      )}

                      {!notif.isRead && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#0284c7',
                            display: 'inline-block',
                          }}
                          title="Unread notice"
                        />
                      )}

                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>
                        {notif.timestamp}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                      {notif.title}
                    </h3>

                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                      {notif.message}
                    </p>

                    {/* Metadata tags */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#64748b' }}>
                      {notif.vehicleRef && (
                        <span>
                          Vehicle: <strong style={{ color: '#0056a2' }}>{notif.vehicleRef}</strong>
                        </span>
                      )}
                      {notif.customerName && (
                        <span>
                          Owner: <strong>{notif.customerName}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  {notif.actionRoute && (
                    <button
                      type="button"
                      onClick={() => navigate(notif.actionRoute!)}
                      className="autocare-garage-action-link"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      <span>Take Action</span>
                      <ExternalLink size={12} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleRead(notif.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    {notif.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Toast Notification */}
      {toast.show && (
        <div className="autocare-garage-toast" role="alert">
          <CheckCircle2 size={18} style={{ color: '#00B4EB', flexShrink: 0 }} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="autocare-garage-toast-close"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </GarageLayout>
  );
};

export default GarageNotificationsPage;
