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
