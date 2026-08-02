// =====================================================
// Festival Types
// =====================================================

export type FestivalStatus = "DRAFT" | "UPCOMING" | "LIVE" | "COMPLETED" | "ARCHIVED";

export type FestivalVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";

export interface Festival {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  themeColor: string;
  discordInvite?: string | null;
  registrationEnabled: boolean;
  registrationStart?: Date | null;
  registrationEnd?: Date | null;
  startDate: Date;
  endDate: Date;
  timezone: string;
  visibility: FestivalVisibility;
  status: FestivalStatus;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
}

export interface FestivalWithStats extends Festival {
  _count?: {
    events: number;
    registrations: number;
  };
}

export interface FestivalListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  startDate: Date;
  endDate: Date;
  status: FestivalStatus;
  visibility: FestivalVisibility;
  isActive: boolean;
  createdAt: Date;
  _count?: {
    events: number;
    registrations: number;
  };
}

export interface CreateFestivalInput {
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  themeColor?: string;
  discordInvite?: string;
  registrationEnabled?: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  visibility?: FestivalVisibility;
}

export interface UpdateFestivalInput {
  name?: string;
  slug?: string;
  shortDescription?: string;
  fullDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  themeColor?: string;
  discordInvite?: string;
  registrationEnabled?: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  visibility?: FestivalVisibility;
  status?: FestivalStatus;
  isActive?: boolean;
}

export interface FestivalFilters {
  search?: string;
  status?: FestivalStatus;
  visibility?: FestivalVisibility;
  isActive?: boolean;
  sortBy?: "name" | "startDate" | "endDate" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface FestivalStats {
  totalFestivals: number;
  activeFestivals: number;
  draftFestivals: number;
  upcomingFestivals: number;
  liveFestivals: number;
  completedFestivals: number;
  archivedFestivals: number;
}

export interface PaginatedFestivals {
  festivals: FestivalListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export const FESTIVAL_STATUS_LABELS: Record<FestivalStatus, string> = {
  DRAFT: "Draft",
  UPCOMING: "Upcoming",
  LIVE: "Live",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const FESTIVAL_VISIBILITY_LABELS: Record<FestivalVisibility, string> = {
  PUBLIC: "Public",
  PRIVATE: "Private",
  UNLISTED: "Unlisted",
};

export const FESTIVAL_STATUS_COLORS: Record<FestivalStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  LIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  COMPLETED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  ARCHIVED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};
