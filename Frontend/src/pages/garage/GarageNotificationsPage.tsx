import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  X,
  Search,
  Wrench,
  QrCode,
  ShieldCheck,
  Send,
  Trash2,
  CheckCheck,
  Calendar,
  ChevronRight
} from 'lucide-react';
import GarageLayout from '../../components/layout/GarageLayout';
import QRScannerModal from '../../components/common/QRScannerModal';
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markNotificationUnread,
  dismissNotification,
  type BackendNotification
} from '../../services/notificationService';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import '../../styles/garage-dashboard.css';

interface ToastState {
  show: boolean;
  message: string;
}

interface GarageNotificationItem {
  id: string;
  title: string;
  subtitle: string;
  vehiclePlate?: string;
  customerName?: string;
  time: string;
  isUnread: boolean;
  priority: 'high' | 'medium' | 'low';
  type: 'service' | 'qr' | 'reminder' | 'system';
  section: 'today' | 'earlier';
  link?: string;
}

const INITIAL_GARAGE_NOTIFICATIONS: GarageNotificationItem[] = [
  {
    id: 'gnotif-1',
    title: 'Customer Inspection Pass Scanned (BR-05)',
    subtitle: 'WP CAR-1010 (Toyota Corolla Cross Hybrid) verified via station terminal scanner. Owner permission scope: Limited.',
    vehiclePlate: 'WP CAR-1010',
    customerName: 'K. Perera',
    time: '10:42 AM',
    isUnread: true,
    priority: 'high',
    type: 'qr',
    section: 'today',
    link: '/garage/vehicles',
  },
  {
    id: 'gnotif-2',
    title: 'Milestone Certified & Hashed to Immutable Ledger',
    subtitle: 'Annual Safety Diagnostic & Inverter Calibration successfully anchored to station cryptographic proof #tx-89410.',
    vehiclePlate: 'WP CAS-4521',
    customerName: 'S. Bandara',
    time: '09:15 AM',
    isUnread: true,
    priority: 'medium',
    type: 'service',
    section: 'today',
    link: '/garage/service-records',
  },
  {
    id: 'gnotif-3',
    title: 'Maintenance Due Reminder Dispatched',
    subtitle: 'Automated 10,000 km synthetic oil change & hybrid cooling check notification sent to vehicle owner.',
    vehiclePlate: 'CAA-1234',
    customerName: 'A. Liyanage',
    time: 'Yesterday',
    isUnread: false,
    priority: 'medium',
    type: 'reminder',
    section: 'earlier',
    link: '/garage/vehicles',
  },
  {
    id: 'gnotif-4',
    title: 'AI Telemetry Diagnostic Passed (BR-09)',
    subtitle: 'Odometer integrity check completed for WP CAS-4521: 85,240 km confirmed monotonic (0 rollbacks detected).',
    vehiclePlate: 'WP CAS-4521',
    customerName: 'S. Bandara',
    time: '20 Sep 2026',
    isUnread: false,
    priority: 'low',
    type: 'system',
    section: 'earlier',
    link: '/garage/audit',
  },
  {
    id: 'gnotif-5',
    title: 'Station Compliance Audit Certificate Renewed',
    subtitle: 'Perera Auto Works accredited under Sri Lanka Motor Vehicle Maintenance Standards (BR-03 Level 1 Partner).',
    vehiclePlate: 'STATION #PAW-05',
    customerName: 'Ministry of Transport',
    time: '18 Sep 2026',
    isUnread: false,
    priority: 'low',
    type: 'system',
    section: 'earlier',
    link: '/garage/audit',
  },
];

export const GarageNotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  // Local notifications list
  const [notifications, setNotifications] = useState<GarageNotificationItem[]>(INITIAL_GARAGE_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'service' | 'qr' | 'reminder'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  // QR Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // New Dispatch Notification Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [dispatchTitle, setDispatchTitle] = useState<string>('Scheduled Maintenance Due');
  const [dispatchMessage, setDispatchMessage] = useState<string>(
    'Your vehicle is due for periodic safety inspection and hybrid cooling system service at Perera Auto Works.'
  );
  const [dispatchPriority, setDispatchPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Fetch real notifications and vehicles from MongoDB
  useEffect(() => {
    getNotifications()
      .then((backendItems) => {
        if (backendItems && backendItems.length > 0) {
          const mapped: GarageNotificationItem[] = backendItems.map((doc: BackendNotification) => {
            const typeStr = (doc.type || '').toLowerCase();
            let catType: 'service' | 'qr' | 'reminder' | 'system' = 'service';
            if (typeStr.includes('qr') || typeStr.includes('share') || typeStr.includes('access')) {
              catType = 'qr';
            } else if (typeStr.includes('reminder') || typeStr.includes('due')) {
              catType = 'reminder';
            } else if (doc.source === 'system' || typeStr.includes('system')) {
              catType = 'system';
            }

            return {
              id: doc._id,
              title: doc.title,
              subtitle: doc.message,
              vehiclePlate: doc.vehicleId ? 'Vehicle Record' : 'Garage Terminal',
              customerName: 'Registered Customer',
              time: new Date(doc.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
              isUnread: doc.status === 'unread',
              priority: doc.priority || 'medium',
              type: catType,
              section: new Date(doc.createdAt).toDateString() === new Date().toDateString() ? 'today' : 'earlier',
              link: '/garage/vehicles',
            };
          });

          // Merge backend notifications with default initial ones
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = mapped.filter((m) => !existingIds.has(m.id));
            return [...newOnes, ...prev];
          });
        }
      })
      .catch(() => {});

    getMyVehicles()
      .then((veh: Vehicle[]) => {
        if (veh && veh.length > 0) {
          setVehiclesList(veh);
          setSelectedVehicleId(veh[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'unread' && !item.isUnread) return false;
      if (activeFilter === 'service' && item.type !== 'service') return false;
      if (activeFilter === 'qr' && item.type !== 'qr') return false;
      if (activeFilter === 'reminder' && item.type !== 'reminder') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSub = item.subtitle.toLowerCase().includes(q);
        const matchesPlate = (item.vehiclePlate || '').toLowerCase().includes(q);
        const matchesCustomer = (item.customerName || '').toLowerCase().includes(q);
        return matchesTitle || matchesSub || matchesPlate || matchesCustomer;
      }

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  const todayList = useMemo(() => filteredNotifications.filter((n) => n.section === 'today'), [filteredNotifications]);
  const earlierList = useMemo(() => filteredNotifications.filter((n) => n.section === 'earlier'), [filteredNotifications]);
  const unreadCount = useMemo(() => notifications.filter((n) => n.isUnread).length, [notifications]);

  // Actions
  const handleToggleRead = async (id: string, currentUnread: boolean) => {
    try {
      if (currentUnread) {
        await markNotificationRead(id).catch(() => {});
      } else {
        await markNotificationUnread(id).catch(() => {});
      }
    } catch {
      // Ignore background error
    }

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnread: !currentUnread } : item))
    );
    showToast(currentUnread ? 'Marked notification as read.' : 'Marked notification as unread.');
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissNotification(id).catch(() => {});
    } catch {
      // Ignore background error
    }

    setNotifications((prev) => prev.filter((item) => item.id !== id));
    showToast('Notification dismissed from feed.');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isUnread: false })));
    showToast('All garage notifications marked as read.');
  };

  // Dispatch customer alert
  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle.trim() || !dispatchMessage.trim()) return;

    try {
      setIsSubmitting(true);
      const targetVehicle = vehiclesList.find((v) => v._id === selectedVehicleId) || vehiclesList[0];

      await createNotification({
        title: dispatchTitle.trim(),
        message: dispatchMessage.trim(),
        type: 'service_reminder',
        priority: dispatchPriority,
        vehicleId: targetVehicle?._id,
      }).catch(() => {});

      const newNotif: GarageNotificationItem = {
        id: `gnotif-${Date.now()}`,
        title: dispatchTitle.trim(),
        subtitle: `${dispatchMessage.trim()} (Dispatched to ${targetVehicle ? targetVehicle.registrationNumber : 'Client Wallet'})`,
        vehiclePlate: targetVehicle ? targetVehicle.registrationNumber : 'WP CAR-1010',
        customerName: 'Customer Notification',
        time: 'Just now',
        isUnread: false,
        priority: dispatchPriority,
        type: 'reminder',
        section: 'today',
        link: '/garage/vehicles',
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setIsDispatchModalOpen(false);
      showToast(`Notification "${dispatchTitle}" dispatched to customer successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch notification.';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GarageLayout activeItem="Notifications" breadcrumbCurrent="Notifications">
      {/* Title & Action Row */}
      <div className="autocare-garage-title-row">
        <div>
          <h1 className="autocare-garage-main-title">Garage Alerts &amp; Customer Notifications</h1>
          <p className="autocare-garage-main-subtitle">
            Real-time station dispatch: service reminders, QR inspection scans, OTP certifications, and customer bookings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="autocare-garage-btn-primary"
            style={{ background: '#002B49', border: 'none' }}
            onClick={() => setIsScannerOpen(true)}
            title="Scan customer QR badge"
          >
            <QrCode size={15} />
            <span>Scan Client QR</span>
          </button>

          <button
            type="button"
            className="autocare-garage-btn-primary"
            onClick={() => setIsDispatchModalOpen(true)}
          >
            <Send size={15} />
            <span>Dispatch Customer Alert</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="autocare-garage-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Unread Alerts
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: unreadCount > 0 ? '#fee2e2' : '#f0fdf4',
                color: unreadCount > 0 ? '#dc2626' : '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {unreadCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Action items awaiting confirmation</span>
        </div>

        <div className="autocare-garage-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Service Milestones
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            14 Today
          </div>
          <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>100% Certified with OTP</span>
        </div>

        <div className="autocare-garage-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              QR Pass Scans
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#f3e8ff',
                color: '#7e22ce',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            3 Active
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Customer vehicle access verified</span>
        </div>

        <div className="autocare-garage-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Station Integrity Proofs
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            Synchronized
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Anchor #tx-89410 verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '480px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search notifications by vehicle plate, title, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Mark All as Read Action */}
          {unreadCount > 0 && (
            <button
              type="button"
              className="autocare-garage-hero-btn"
              style={{ background: '#f1f5f9', color: '#0f172a', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={14} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`autocare-qr-chip ${activeFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('all')}
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
          >
            All Alerts ({notifications.length})
          </button>

          <button
            type="button"
            className={`autocare-qr-chip ${activeFilter === 'unread' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('unread')}
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
          >
            Unread ({unreadCount})
          </button>

          <button
            type="button"
            className={`autocare-qr-chip ${activeFilter === 'service' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('service')}
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
          >
            Service Milestones
          </button>

          <button
            type="button"
            className={`autocare-qr-chip ${activeFilter === 'qr' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('qr')}
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
          >
            QR Pass Scans
          </button>

          <button
            type="button"
            className={`autocare-qr-chip ${activeFilter === 'reminder' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('reminder')}
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
          >
            Customer Reminders
          </button>
        </div>
      </div>

      {/* Notifications Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Today Group */}
        {todayList.length > 0 && (
          <section>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Today
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: item.isUnread ? '#f8fafc' : '#ffffff',
                    border: item.isUnread ? '1.5px solid #0056A2' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
                    {/* Category Icon */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background:
                          item.type === 'service'
                            ? '#e0f2fe'
                            : item.type === 'qr'
                            ? '#f3e8ff'
                            : item.type === 'reminder'
                            ? '#fef3c7'
                            : '#f1f5f9',
                        color:
                          item.type === 'service'
                            ? '#0284c7'
                            : item.type === 'qr'
                            ? '#7e22ce'
                            : item.type === 'reminder'
                            ? '#b45309'
                            : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.type === 'service' ? (
                        <Wrench size={18} />
                      ) : item.type === 'qr' ? (
                        <QrCode size={18} />
                      ) : item.type === 'reminder' ? (
                        <Calendar size={18} />
                      ) : (
                        <ShieldCheck size={18} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background:
                              item.priority === 'high'
                                ? '#fee2e2'
                                : item.priority === 'medium'
                                ? '#e0f2fe'
                                : '#f1f5f9',
                            color:
                              item.priority === 'high'
                                ? '#dc2626'
                                : item.priority === 'medium'
                                ? '#0369a1'
                                : '#475569',
                          }}
                        >
                          {item.priority === 'high' ? 'HIGH PRIORITY' : item.type.toUpperCase()}
                        </span>

                        {item.vehiclePlate && (
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              background: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: '#0f172a',
                            }}
                          >
                            {item.vehiclePlate}
                          </span>
                        )}

                        <span style={{ fontSize: '12px', color: '#64748b' }}>• {item.time}</span>
                      </div>

                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {item.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {item.link && (
                      <Link
                        to={item.link}
                        className="autocare-garage-hero-btn"
                        style={{
                          background: '#f8fafc',
                          color: '#0056A2',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          fontSize: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        <span>View</span>
                        <ChevronRight size={13} style={{ marginLeft: '2px' }} />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleRead(item.id, item.isUnread)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: item.isUnread ? '#0056A2' : '#94a3b8',
                        padding: '6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                      }}
                      title={item.isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      <CheckCircle2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDismiss(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        padding: '6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                      }}
                      title="Dismiss notification"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Earlier Group */}
        {earlierList.length > 0 && (
          <section>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Earlier
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {earlierList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: item.isUnread ? '#f8fafc' : '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: '#f1f5f9',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.type === 'service' ? (
                        <Wrench size={16} />
                      ) : item.type === 'qr' ? (
                        <QrCode size={16} />
                      ) : item.type === 'reminder' ? (
                        <Calendar size={16} />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        {item.vehiclePlate && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              background: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: '#0f172a',
                            }}
                          >
                            {item.vehiclePlate}
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{item.time}</span>
                      </div>

                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 600, color: '#0f172a' }}>
                        {item.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.4 }}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {item.link && (
                      <Link
                        to={item.link}
                        className="autocare-garage-hero-btn"
                        style={{
                          background: '#f8fafc',
                          color: '#0056A2',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          fontSize: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        <span>View</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleRead(item.id, item.isUnread)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: item.isUnread ? '#0056A2' : '#94a3b8',
                        padding: '6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                      }}
                      title={item.isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      <CheckCircle2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDismiss(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        padding: '6px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                      }}
                      title="Dismiss notification"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <Bell size={36} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              No notifications found
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              There are no matching notifications under the current filter query.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Dispatch Customer Service Alert */}
      {isDispatchModalOpen && (
        <div
          className="autocare-qr-modal-backdrop"
          onClick={() => setIsDispatchModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="autocare-qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="autocare-qr-modal-header">
              <div className="autocare-qr-modal-title-box">
                <div className="autocare-qr-modal-icon-badge">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="autocare-qr-modal-title">Dispatch Customer Service Alert</h3>
                  <p className="autocare-qr-modal-subtitle">
                    Send maintenance due reminders or invoice ready notifications to customer wallet
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="autocare-qr-modal-close-btn"
                onClick={() => setIsDispatchModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDispatchNotification} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Select Target Vehicle
                </label>
                {vehiclesList.length > 0 ? (
                  <select
                    className="autocare-field-select"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px' }}
                  >
                    {vehiclesList.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} - {v.manufacturer} {v.model} ({v.currentMileage?.toLocaleString() || '32,500'} km)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="autocare-qr-input"
                    value="WP CAR-1010 - Toyota Corolla Cross"
                    readOnly
                    style={{ width: '100%' }}
                  />
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Alert Title
                </label>
                <input
                  type="text"
                  className="autocare-qr-input"
                  value={dispatchTitle}
                  onChange={(e) => setDispatchTitle(e.target.value)}
                  placeholder="e.g. 40,000 km Hybrid Battery & Brake Service Due"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Dispatch Message
                </label>
                <textarea
                  className="autocare-qr-input"
                  value={dispatchMessage}
                  onChange={(e) => setDispatchMessage(e.target.value)}
                  placeholder="Detailed maintenance recommendation or collection notification..."
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Priority Level
                </label>
                <select
                  className="autocare-field-select"
                  value={dispatchPriority}
                  onChange={(e) => setDispatchPriority(e.target.value as 'low' | 'medium' | 'high')}
                  style={{ width: '100%', padding: '9px 12px' }}
                >
                  <option value="low">Standard / Routine Reminder</option>
                  <option value="medium">Medium Priority (Recommended within 14 days)</option>
                  <option value="high">High Priority / Urgent Safety Inspection</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="autocare-qr-btn-draft"
                  onClick={() => setIsDispatchModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="autocare-garage-btn-primary"
                  disabled={isSubmitting}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Dispatching...' : 'Send Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(token) => {
          navigate(`/buyer-qr?token=${encodeURIComponent(token)}`);
        }}
        title="Garage Inspection Terminal QR Scanner"
        subtitle="Scan customer vehicle QR badge to inspect digital maintenance passport"
      />

      {/* Toast Feedback */}
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
