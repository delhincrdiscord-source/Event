// =====================================================
// Announcement Types
// =====================================================

export type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type AnnouncementVisibility = "PUBLIC" | "MEMBERS_ONLY" | "ADMINS_ONLY";

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  bannerUrl?: string | null;
  authorId: string;
  festivalId?: string | null;
  priority: AnnouncementPriority;
  visibility: AnnouncementVisibility;
  status: AnnouncementStatus;
  publishAt?: Date | null;
  expireAt?: Date | null;
  tags: string[];
  viewCount: number;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementListItem {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  bannerUrl?: string | null;
  authorId: string;
  festivalId?: string | null;
  priority: AnnouncementPriority;
  visibility: AnnouncementVisibility;
  status: AnnouncementStatus;
  publishAt?: Date | null;
  expireAt?: Date | null;
  tags: string[];
  viewCount: number;
  isPinned: boolean;
  createdAt: Date;
  author?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  festival?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count?: {
    deliveries: number;
  };
}

export interface AnnouncementWithRelations extends Announcement {
  author: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
    globalName?: string | null;
  };
  festival?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  deliveries: AnnouncementDelivery[];
}

export interface AnnouncementDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt?: Date | null;
  failedAt?: Date | null;
  errorMessage?: string | null;
  retryCount: number;
  createdAt: Date;
}

type NotificationChannel = "IN_APP" | "DISCORD" | "EMAIL" | "PUSH";
type DeliveryStatus = "PENDING" | "SENT" | "FAILED" | "RETRYING";

export interface AnnouncementFilters {
  search?: string;
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  visibility?: AnnouncementVisibility;
  festivalId?: string;
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "title" | "status" | "priority" | "publishAt" | "createdAt" | "viewCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface AnnouncementStats {
  totalAnnouncements: number;
  draftAnnouncements: number;
  scheduledAnnouncements: number;
  publishedAnnouncements: number;
  archivedAnnouncements: number;
  totalViews: number;
}

export interface PaginatedAnnouncements {
  announcements: AnnouncementListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CreateAnnouncementInput {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  bannerUrl?: string;
  authorId: string;
  festivalId?: string;
  priority?: AnnouncementPriority;
  visibility?: AnnouncementVisibility;
  status?: AnnouncementStatus;
  publishAt?: string;
  expireAt?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  bannerUrl?: string;
  festivalId?: string;
  priority?: AnnouncementPriority;
  visibility?: AnnouncementVisibility;
  status?: AnnouncementStatus;
  publishAt?: string;
  expireAt?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface BulkAnnouncementAction {
  announcementIds: string[];
}

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const ANNOUNCEMENT_VISIBILITY_LABELS: Record<AnnouncementVisibility, string> = {
  PUBLIC: "Public",
  MEMBERS_ONLY: "Members Only",
  ADMINS_ONLY: "Admins Only",
};

export const ANNOUNCEMENT_PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  NORMAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export const ANNOUNCEMENT_STATUS_COLORS: Record<AnnouncementStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  SCHEDULED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  ARCHIVED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
};
