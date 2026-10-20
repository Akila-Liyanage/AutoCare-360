import api from './api';

export interface BackendNotification {
  _id: string;
  userId: string;
  vehicleId?: {
    _id: string;
    registrationNumber: string;
    manufacturer: string;
    model: string;
  } | string | null;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read';
  reminderDate?: string | null;
  dueDate?: string | null;
  source: 'manual' | 'service' | 'document' | 'system';
  relatedServiceRecordId?: string | null;
  relatedDocumentId?: string | null;
  isDismissed: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  status?: string;
  priority?: string;
  type?: string;
  vehicleId?: string;
  includeDismissed?: boolean;
}

export interface CreateNotificationPayload {
  vehicleId?: string | null;
  title: string;
  message: string;
  type: string;
  priority?: 'low' | 'medium' | 'high';
  reminderDate?: string | null;
  dueDate?: string | null;
  relatedServiceRecordId?: string | null;
  relatedDocumentId?: string | null;
}

export interface GetNotificationsResponse {
  success: boolean;
  count: number;
  data: {
    notifications: BackendNotification[];
  };
}

export interface GetNotificationResponse {
  success: boolean;
  data: {
    notification: BackendNotification;
  };
}

export interface NotificationMutationResponse {
  success: boolean;
  message: string;
  data: {
    notification: BackendNotification;
  };
}

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}

export interface GetUnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

/**
 * Fetch all notifications for current user with optional query filters
 * GET /api/notifications
 */
export const getNotifications = async (
  filters?: NotificationFilters
): Promise<BackendNotification[]> => {
  const response = await api.get<GetNotificationsResponse>('/notifications', {
    params: filters,
  });
  return response.data?.data?.notifications || [];
};

/**
 * Fetch a single notification by ID
 * GET /api/notifications/:id
 */
export const getNotification = async (
  id: string
): Promise<BackendNotification> => {
  const response = await api.get<GetNotificationResponse>(`/notifications/${id}`);
  return response.data?.data?.notification;
};

/**
 * Create a new notification / reminder
 * POST /api/notifications
 */
export const createNotification = async (
  payload: CreateNotificationPayload
): Promise<BackendNotification> => {
  const response = await api.post<NotificationMutationResponse>(
    '/notifications',
    payload
  );
  return response.data?.data?.notification;
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationRead = async (
  id: string
): Promise<BackendNotification> => {
  const response = await api.patch<NotificationMutationResponse>(
    `/notifications/${id}/read`
  );
  return response.data?.data?.notification;
};

/**
 * Mark a notification as unread
 * PATCH /api/notifications/:id/unread
 */
export const markNotificationUnread = async (
  id: string
): Promise<BackendNotification> => {
  const response = await api.patch<NotificationMutationResponse>(
    `/notifications/${id}/unread`
  );
  return response.data?.data?.notification;
};

/**
 * Dismiss a notification
 * PATCH /api/notifications/:id/dismiss
 */
export const dismissNotification = async (
  id: string
): Promise<BackendNotification> => {
  const response = await api.patch<NotificationMutationResponse>(
    `/notifications/${id}/dismiss`
  );
  return response.data?.data?.notification;
};

/**
 * Delete a manual notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (
  id: string
): Promise<DeleteNotificationResponse> => {
  const response = await api.delete<DeleteNotificationResponse>(
    `/notifications/${id}`
  );
  return response.data;
};

/**
 * Fetch count of active unread notifications
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<GetUnreadCountResponse>(
    '/notifications/unread-count'
  );
  return response.data?.data?.unreadCount || 0;
};

export default {
  getNotifications,
  getNotification,
  createNotification,
  markNotificationRead,
  markNotificationUnread,
  dismissNotification,
  deleteNotification,
  getUnreadCount,
};
