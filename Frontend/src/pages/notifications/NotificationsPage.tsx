import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  MOCK_NOTIFICATIONS,
  type NotificationItem
} from './notificationsData';
import '../../styles/notifications.css';

type FilterChip = 'all' | 'unread' | 'reminders' | 'system';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [activeChip, setActiveChip] = useState<FilterChip>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Toggle read/unread state on row click
  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.isUnread;
          if (!nextState) {
            showToast(`Marked "${item.title}" as read.`);
          } else {
            showToast(`Marked "${item.title}" as unread.`);
          }
          return { ...item, isUnread: nextState };
        }
        return item;
      })
    );
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

          {/* Empty State */}
          {filteredNotifications.length === 0 ? (
            <div className="autocare-notif-empty">
              <p style={{ fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a', fontSize: '16px' }}>
                No notifications found
              </p>
              <p style={{ margin: 0, fontSize: '13.5px' }}>
                Try adjusting your search query or selecting another filter category.
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
                      <button
                        key={item.id}
                        type="button"
                        className={`autocare-notif-row ${item.isUnread ? 'is-unread' : ''}`}
                        onClick={() => handleToggleRead(item.id)}
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
                        </div>
                      </button>
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
                      <button
                        key={item.id}
                        type="button"
                        className={`autocare-notif-row ${item.isUnread ? 'is-unread' : ''}`}
                        onClick={() => handleToggleRead(item.id)}
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
                        </div>
                      </button>
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
