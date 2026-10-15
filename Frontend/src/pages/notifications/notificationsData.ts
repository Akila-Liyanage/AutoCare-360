export type NotificationCategory = 'reminder' | 'system' | 'general';
export type NotificationBadgeType =
  | 'high-priority'
  | 'verified'
  | 'success'
  | 'reminder'
  | 'action-required';

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeType: NotificationBadgeType;
  timestamp: string;
  section: 'today' | 'earlier';
  isUnread: boolean;
  category: NotificationCategory;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  // TODAY SECTION
  {
    id: 'notif-001',
    title: 'Service due in 500 km',
    subtitle: 'WP ABC-1234 · Toyota Aqua',
    badgeText: 'High priority',
    badgeType: 'high-priority',
    timestamp: '10:42 AM',
    section: 'today',
    isUnread: true,
    category: 'reminder',
  },
  {
    id: 'notif-002',
    title: 'Maintenance record verified',
    subtitle: 'Perera Auto Works published record AC-9821',
    badgeText: 'Verified',
    badgeType: 'verified',
    timestamp: '9:18 AM',
    section: 'today',
    isUnread: true,
    category: 'system',
  },
  {
    id: 'notif-003',
    title: 'Quotation accepted',
    subtitle: 'Kaveesha P. approved QT-2026-091',
    badgeText: 'Success',
    badgeType: 'success',
    timestamp: '8:36 AM',
    section: 'today',
    isUnread: false,
    category: 'system',
  },

  // EARLIER SECTION
  {
    id: 'notif-004',
    title: 'Secure link expires tomorrow',
    subtitle: 'Insurance inspection access',
    badgeText: 'Reminder',
    badgeType: 'reminder',
    timestamp: 'Yesterday',
    section: 'earlier',
    isUnread: true,
    category: 'reminder',
  },
  {
    id: 'notif-005',
    title: 'OCR extraction needs review',
    subtitle: 'Invoice INV-1042 has 2 uncertain values',
    badgeText: 'Action required',
    badgeType: 'action-required',
    timestamp: '18 Sep',
    section: 'earlier',
    isUnread: true,
    category: 'system',
  },
  {
    id: 'notif-006',
    title: 'Annual emission test renewal',
    subtitle: 'Western Province jurisdiction inspection due in 7 days',
    badgeText: 'Reminder',
    badgeType: 'reminder',
    timestamp: '15 Sep',
    section: 'earlier',
    isUnread: false,
    category: 'reminder',
  },
  {
    id: 'notif-007',
    title: 'Tire pressure telemetry check',
    subtitle: 'TPMS sensor recalibration recommended after rotation',
    badgeText: 'Reminder',
    badgeType: 'reminder',
    timestamp: '12 Sep',
    section: 'earlier',
    isUnread: false,
    category: 'reminder',
  },
  {
    id: 'notif-008',
    title: 'Battery health periodic check',
    subtitle: 'State of Health verified at 98.4% during routine scan',
    badgeText: 'Reminder',
    badgeType: 'reminder',
    timestamp: '08 Sep',
    section: 'earlier',
    isUnread: false,
    category: 'reminder',
  },
  {
    id: 'notif-009',
    title: 'Ledger integrity check completed',
    subtitle: 'Consensus verified across distributed nodes with zero anomalies',
    badgeText: 'Success',
    badgeType: 'success',
    timestamp: '02 Sep',
    section: 'earlier',
    isUnread: false,
    category: 'general',
  },
  {
    id: 'notif-010',
    title: 'Workshop accreditation verified',
    subtitle: 'Apex Tech Service Center updated credentials',
    badgeText: 'Verified',
    badgeType: 'verified',
    timestamp: '28 Aug',
    section: 'earlier',
    isUnread: false,
    category: 'general',
  },
  {
    id: 'notif-011',
    title: 'Vehicle passport exported',
    subtitle: 'Tamper-proof digital passport PDF generated for owner download',
    badgeText: 'Success',
    badgeType: 'success',
    timestamp: '22 Aug',
    section: 'earlier',
    isUnread: false,
    category: 'general',
  },
  {
    id: 'notif-012',
    title: 'Profile security audit passed',
    subtitle: 'Authentication security checkpoints verified',
    badgeText: 'Verified',
    badgeType: 'verified',
    timestamp: '15 Aug',
    section: 'earlier',
    isUnread: false,
    category: 'general',
  },
];
