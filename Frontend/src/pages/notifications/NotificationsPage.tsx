import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X, RefreshCw, AlertTriangle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  type NotificationItem,
  type NotificationCategory,
  type NotificationBadgeType
} from './notificationsData';
import {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  dismissNotification,
  type BackendNotification
} from '../../services/notificationService';
import '../../styles/notifications.css';

type FilterChip = 'all' | 'unread' | 'reminders' | 'system';

/**
 * Maps a backend notification document into the frontend UI NotificationItem
 */
const mapBackendNotification = (doc: BackendNotification): NotificationItem => {
  let category: NotificationCategory = 'general';
  const typeLower = (doc.type || '').toLowerCase();
  if (typeLower.includes('service') || typeLower.includes('reminder')) {
    category = 'reminder';
  } else if (
    doc.source === 'system' ||
    typeLower.includes('system') ||
    typeLower.includes('notice')
  ) {
    category = 'system';
  }

  let badgeType: NotificationBadgeType = 'reminder';
  let badgeText = 'Reminder';

  if (doc.priority === 'high') {
    badgeType = 'high-priority';
    badgeText = 'High priority';
  } else if (doc.source === 'service') {
    badgeType = 'verified';
    badgeText = 'Verified';
  } else if (doc.source === 'system') {
    badgeType = 'success';
    badgeText = 'Success';
  } else if (typeLower.includes('action') || typeLower.includes('urgent')) {
    badgeType = 'action-required';
    badgeText = 'Action required';
  }

  // Section: Today vs Earlier
  let section: 'today' | 'earlier' = 'earlier';
  if (doc.createdAt) {
    try {
      const d = new Date(doc.createdAt);
      const now = new Date();
      if (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        section = 'today';
      }
    } catch {
      section = 'earlier';
    }
  }

  // Format timestamp
  let formattedTime = 'Recently';
  if (doc.createdAt) {
    try {
      const d = new Date(doc.createdAt);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        const isSameDay =
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();

        if (isSameDay) {
          formattedTime = d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        } else {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          const isYesterday =
            d.getDate() === yesterday.getDate() &&
            d.getMonth() === yesterday.getMonth() &&
            d.getFullYear() === yesterday.getFullYear();

          if (isYesterday) {
            formattedTime = 'Yesterday';
          } else {
            formattedTime = d.toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
            });
          }
        }
      }
    } catch {
      formattedTime = 'Recently';
    }
  }

  return {
    id: doc._id,
    title: doc.title,
    subtitle: doc.message,
    badgeText,
    badgeType,
    timestamp: formattedTime,
    section,
    isUnread: doc.status === 'unread',
    category,
  };
};

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeChip, setActiveChip] = useState<FilterChip>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Async API loading & error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  /**
   * Fetch live notifications from real backend API
   */
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const backendDocs = await getNotifications();
      setNotifications(backendDocs.map(mapBackendNotification));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to retrieve notifications. Please check your connection.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        setIsLoading(true);
        setApiError(null);
        const backendDocs = await getNotifications();
        if (isMounted) {
          setNotifications(backendDocs.map(mapBackendNotification));
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to retrieve notifications. Please check your connection.';
          setApiError(msg);
          setIsLoading(false);
        }
      }
    };

    initData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic counts
  const allCount = notifications.length;
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.isUnread).length,
    [notifications]
  );
  const remindersCount = useMemo(
    () => notifications.filter((n) => n.category === 'reminder').length,
    [notifications]
  );
  const systemCount = useMemo(
    () => notifications.filter((n) => n.category === 'system').length,
    [notifications]
  );

  // Toggle read/unread state
  const handleToggleRead = async (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (!item) return;

    const willBeRead = item.isUnread;
    try {
      if (willBeRead) {
        await markNotificationRead(id);
        showToast(`Marked "${item.title}" as read.`);
      } else {
        await markNotificationUnread(id);
        showToast(`Marked "${item.title}" as unread.`);
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isUnread: !willBeRead } : n
        )
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to update notification state.';
      showToast(msg);
    }
  };

  // Dismiss notification
  const handleDismiss = async (id: string, title: string) => {
    try {
      await dismissNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      showToast(`Dismissed notification "${title}".`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to dismiss notification.';
      showToast(msg);
    }
  };

  // Filtered notifications by search query and active chip
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Chip filter
      if (activeChip === 'unread' && !item.isUnread) return false;
      if (activeChip === 'reminders' && item.category !== 'reminder') return false;
      if (activeChip === 'system' && item.category !== 'system') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSub = item.subtitle.toLowerCase().includes(query);
        const matchesBadge = item.badgeText.toLowerCase().includes(query);
        return matchesTitle || matchesSub || matchesBadge;
      }

      return true;
    });
  }, [notifications, activeChip, searchQuery]);

  // Group into Today and Earlier
  const todayList = useMemo(
    () => filteredNotifications.filter((n) => n.section === 'today'),
    [filteredNotifications]
  );

  const earlierList = useMemo(
    () => filteredNotifications.filter((n) => n.section === 'earlier'),
    [filteredNotifications]
  );

  const todayNewCount = useMemo(
    () => todayList.filter((n) => n.isUnread).length,
    [todayList]
  );

  return (
    <div className="autocare-notifications-page">
      <Navbar />

      <main className="autocare-notifications-main">
        <div className="autocare-notifications-container">
          {/* Header Row */}
          <div className="autocare-notif-header-row">
            <div className="autocare-notif-title-group">
              <h1 className="autocare-notif-title">Notifications</h1>
              <p className="autocare-notif-subtitle">
                Stay ahead of maintenance, verification and access activity.
              </p>
            </div>

            <div className="autocare-notif-actions">
              <button
                type="button"
                className="autocare-btn-notif-settings"
                onClick={() =>
                  showToast(
                    'Notification preferences & dispatch channels will be configurable in the upcoming release.'
                  )
                }
              >
                Notification settings
              </button>
              <Link
                to="/notifications/create"
                className="autocare-btn-schedule-notif"
                style={{ textDecoration: 'none' }}
              >
                Schedule notification
              </Link>
            </div>
          </div>

          {/* Search Field & Filters Button */}
          <div className="autocare-notif-search-section">
            <label htmlFor="notif-search-input" className="autocare-notif-search-label">
              SEARCH
            </label>
            <div className="autocare-notif-search-bar-row">
              <input
                id="notif-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications"
                className="autocare-notif-search-input"
                aria-label="Search notifications"
              />
              <button
                type="button"
                className="autocare-notif-filters-btn"
                onClick={() =>
                  showToast('Advanced filter toggles will be available in the upcoming release.')
                }
              >
                Filters
              </button>
            </div>
          </div>

          {/* Filter Chips / Tabs Row */}
          <div className="autocare-notif-chips-row" role="tablist" aria-label="Notification Categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeChip === 'all'}
              className={`autocare-notif-chip ${activeChip === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveChip('all')}
            >
              All {allCount}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeChip === 'unread'}
              className={`autocare-notif-chip ${activeChip === 'unread' ? 'is-active' : ''}`}
              onClick={() => setActiveChip('unread')}
            >
              Unread {unreadCount}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeChip === 'reminders'}
              className={`autocare-notif-chip ${activeChip === 'reminders' ? 'is-active' : ''}`}
              onClick={() => setActiveChip('reminders')}
            >
              Reminders {remindersCount}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeChip === 'system'}
              className={`autocare-notif-chip ${activeChip === 'system' ? 'is-active' : ''}`}
              onClick={() => setActiveChip('system')}
            >
              System {systemCount}
            </button>
          </div>

          {/* API Error State */}
          {apiError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                color: '#991b1b',
                fontSize: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} color="#dc2626" />
                <span>{apiError}</span>
              </div>
              <button
                type="button"
                onClick={loadNotifications}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '64px 20px',
                color: '#0056A2',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              <RefreshCw size={20} className="autocare-spin" />
              <span>Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State */
            <div className="autocare-notif-empty">
              <p style={{ fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a', fontSize: '16px' }}>
                No notifications found
              </p>
              <p style={{ margin: 0, fontSize: '13.5px' }}>
                {searchQuery || activeChip !== 'all'
                  ? 'Try adjusting your search query or selecting another filter category.'
                  : 'All caught up! You have no active notifications.'}
              </p>
            </div>
          ) : (
            <>
              {/* TODAY SECTION */}
              {todayList.length > 0 && (
                <section className="autocare-notif-card" aria-label="Today Notifications">
                  <div className="autocare-notif-card-header">
                    <h2 className="autocare-notif-card-title">Today</h2>
                    <p className="autocare-notif-card-count">
                      {todayNewCount} new {todayNewCount === 1 ? 'notification' : 'notifications'}
                    </p>
                  </div>

                  <div className="autocare-notif-list">
                    {todayList.map((item) => (
                      <div
                        key={item.id}
                        className={`autocare-notif-row ${item.isUnread ? 'is-unread' : ''}`}
                        onClick={() => handleToggleRead(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleToggleRead(item.id);
                          }
                        }}
                        title={item.isUnread ? 'Click to mark as read' : 'Click to mark as unread'}
                        aria-pressed={item.isUnread}
                      >
                        <div className="autocare-notif-row-left">
                          {item.isUnread ? (
                            <span className="autocare-notif-dot" aria-label="Unread notification" />
                          ) : (
                            <span className="autocare-notif-dot-spacer" aria-hidden="true" />
                          )}
                          <div className="autocare-notif-content">
                            <h3 className="autocare-notif-item-title">{item.title}</h3>
                            <p className="autocare-notif-item-sub">{item.subtitle}</p>
                          </div>
                        </div>

                        <div className="autocare-notif-row-right">
                          <span className={`autocare-notif-badge is-${item.badgeType}`}>
                            {item.badgeText}
                          </span>
                          <span className="autocare-notif-timestamp">{item.timestamp}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(item.id, item.title);
                            }}
                            title="Dismiss notification"
                            aria-label="Dismiss notification"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                            }}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* EARLIER SECTION */}
              {earlierList.length > 0 && (
                <section className="autocare-notif-card" aria-label="Earlier Notifications">
                  <div className="autocare-notif-card-header">
                    <h2 className="autocare-notif-card-title">Earlier</h2>
                  </div>

                  <div className="autocare-notif-list">
                    {earlierList.map((item) => (
                      <div
                        key={item.id}
                        className={`autocare-notif-row ${item.isUnread ? 'is-unread' : ''}`}
                        onClick={() => handleToggleRead(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleToggleRead(item.id);
                          }
                        }}
                        title={item.isUnread ? 'Click to mark as read' : 'Click to mark as unread'}
                        aria-pressed={item.isUnread}
                      >
                        <div className="autocare-notif-row-left">
                          {item.isUnread ? (
                            <span className="autocare-notif-dot" aria-label="Unread notification" />
                          ) : (
                            <span className="autocare-notif-dot-spacer" aria-hidden="true" />
                          )}
                          <div className="autocare-notif-content">
                            <h3 className="autocare-notif-item-title">{item.title}</h3>
                            <p className="autocare-notif-item-sub">{item.subtitle}</p>
                          </div>
                        </div>

                        <div className="autocare-notif-row-right">
                          <span className={`autocare-notif-badge is-${item.badgeType}`}>
                            {item.badgeText}
                          </span>
                          <span className="autocare-notif-timestamp">{item.timestamp}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(item.id, item.title);
                            }}
                            title="Dismiss notification"
                            aria-label="Dismiss notification"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                            }}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="autocare-notif-toast" role="status">
          <Clock size={18} className="autocare-notif-toast-icon" />
          <span>{toastMessage}</span>
          <button
            type="button"
            className="autocare-notif-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default NotificationsPage;
