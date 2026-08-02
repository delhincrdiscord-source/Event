// =====================================================
// Community Event Types
// =====================================================

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type EventVisibility = "PUBLIC" | "MEMBERS_ONLY" | "HIDDEN";

export interface CommunityEvent {
  id: string;
  festivalId: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  bannerUrl?: string | null;
  thumbnailUrl?: string | null;
  startDate: Date;
  endDate: Date;
  timezone: string;
  location?: string | null;
  discordVoiceChannelId?: string | null;
  discordStageChannelId?: string | null;
  capacity?: number | null;
  waitlistEnabled: boolean;
  registrationEnabled: boolean;
  registrationStart?: Date | null;
  registrationEnd?: Date | null;
  status: EventStatus;
  visibility: EventVisibility;
  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
}

export interface CommunityEventListItem {
  id: string;
  festivalId: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  startDate: Date;
  endDate: Date;
  location?: string | null;
  status: EventStatus;
  visibility: EventVisibility;
  isFeatured: boolean;
  capacity?: number | null;
  createdAt: Date;
  _count?: {
    rsvps: number;
  };
  category?: {
    id: string;
    name: string;
    emoji?: string | null;
    color: string;
  };
  festival?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CommunityEventWithRelations extends CommunityEvent {
  category: {
    id: string;
    name: string;
    slug: string;
    emoji?: string | null;
    color: string;
  };
  festival: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    rsvps: number;
  };
}

export interface CreateEventInput {
  festivalId: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  location?: string;
  discordVoiceChannelId?: string;
  discordStageChannelId?: string;
  capacity?: number;
  waitlistEnabled?: boolean;
  registrationEnabled?: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  visibility?: EventVisibility;
  isFeatured?: boolean;
}

export interface UpdateEventInput {
  festivalId?: string;
  categoryId?: string;
  title?: string;
  slug?: string;
  shortDescription?: string;
  fullDescription?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  location?: string;
  discordVoiceChannelId?: string;
  discordStageChannelId?: string;
  capacity?: number;
  waitlistEnabled?: boolean;
  registrationEnabled?: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  status?: EventStatus;
  visibility?: EventVisibility;
  isFeatured?: boolean;
}

export interface EventFilters {
  search?: string;
  festivalId?: string;
  categoryId?: string;
  status?: EventStatus;
  visibility?: EventVisibility;
  isFeatured?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: "title" | "startDate" | "endDate" | "createdAt" | "status" | "category";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface EventStats {
  totalEvents: number;
  draftEvents: number;
  publishedEvents: number;
  liveEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  archivedEvents: number;
}

export interface PaginatedEvents {
  events: CommunityEventListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  status: EventStatus;
  categoryId: string;
  categoryName: string;
  categoryEmoji?: string | null;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingEvents: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    channelType: "voice" | "stage";
    channelId: string;
  }[];
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  LIVE: "Live",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

export const EVENT_VISIBILITY_LABELS: Record<EventVisibility, string> = {
  PUBLIC: "Public",
  MEMBERS_ONLY: "Members Only",
  HIDDEN: "Hidden",
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  PUBLISHED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  LIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  COMPLETED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  ARCHIVED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

export const EVENT_VISIBILITY_COLORS: Record<EventVisibility, string> = {
  PUBLIC: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  MEMBERS_ONLY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  HIDDEN: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "IST (UTC+5:30)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "EST (UTC-5)" },
  { value: "America/Los_Angeles", label: "PST (UTC-8)" },
  { value: "Europe/London", label: "GMT (UTC+0)" },
  { value: "Asia/Tokyo", label: "JST (UTC+9)" },
] as const;
