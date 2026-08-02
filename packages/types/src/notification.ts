// =====================================================
// Notification Types
// =====================================================

export type NotificationType =
  | "SYSTEM" |"ANNOUNCEMENT" |"REGISTRATION" |"APPROVAL" |"REMINDER" |"FESTIVAL" |"EVENT" |"CUSTOM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  readAt?: Date | null;
}

export interface NotificationListItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
}

export interface NotificationWithRelations extends Notification {
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  deliveries: NotificationDelivery[];
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  announcementId?: string | null;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt?: Date | null;
  failedAt?: Date | null;
  errorMessage?: string | null;
  retryCount: number;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export type NotificationChannel = "IN_APP" | "DISCORD" | "EMAIL" | "PUSH";
export type DeliveryStatus = "PENDING" | "SENT" | "FAILED" | "RETRYING";

export interface NotificationFilters {
  search?: string;
  type?: NotificationType;
  isRead?: boolean;
  isArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "title" | "type" | "createdAt" | "readAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  archivedNotifications: number;
  byType: Record<NotificationType, number>;
}

export interface PaginatedNotifications {
  notifications: NotificationListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  unreadCount: number;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];
}

export interface BulkNotificationAction {
  notificationIds: string[];
}

export interface NotificationQueueItem {
  id: string;
  notificationId: string;
  announcementId?: string | null;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt?: Date | null;
  failedAt?: Date | null;
  errorMessage?: string | null;
  retryCount: number;
  createdAt: Date;
  notification?: {
    id: string;
    title: string;
    message: string;
    userId: string;
    user?: {
      username: string;
      email: string;
    };
  };
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  SYSTEM: "System",
  ANNOUNCEMENT: "Announcement",
  REGISTRATION: "Registration",
  APPROVAL: "Approval",
  REMINDER: "Reminder",
  FESTIVAL: "Festival",
  EVENT: "Event",
  CUSTOM: "Custom",
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  SYSTEM: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  ANNOUNCEMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  REGISTRATION: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  APPROVAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  REMINDER: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  FESTIVAL: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
  EVENT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
  CUSTOM: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  IN_APP: "In-App",
  DISCORD: "Discord",
  EMAIL: "Email",
  PUSH: "Push",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: "Pending",
  SENT: "Sent",
  FAILED: "Failed",
  RETRYING: "Retrying",
};

export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  SENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  RETRYING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
};
