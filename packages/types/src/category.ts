// =====================================================
// Event Category Types
// =====================================================

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  emoji?: string | null;
  icon?: string | null;
  description?: string | null;
  color: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventCategoryListItem {
  id: string;
  name: string;
  slug: string;
  emoji?: string | null;
  icon?: string | null;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  _count?: {
    events: number;
  };
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  emoji?: string;
  icon?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  emoji?: string;
  icon?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CategoryFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "sortOrder" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
}

export interface PaginatedCategories {
  categories: EventCategoryListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export const DEFAULT_CATEGORIES: CreateCategoryInput[] = [
  { name: "Gaming Night", slug: "gaming-night", emoji: "\uD83C\uDFAE", color: "#5865F2", sortOrder: 0 },
  { name: "Tournament", slug: "tournament", emoji: "\uD83C\uDFC6", color: "#FEE75C", sortOrder: 1 },
  { name: "Movie Night", slug: "movie-night", emoji: "\uD83C\uDFAC", color: "#EB459E", sortOrder: 2 },
  { name: "Voice Hangout", slug: "voice-hangout", emoji: "\uD83D\uDCAC", color: "#57F287", sortOrder: 3 },
  { name: "Community Meetup", slug: "community-meetup", emoji: "\uD83D\uDC65", color: "#ED4245", sortOrder: 4 },
  { name: "Giveaway", slug: "giveaway", emoji: "\uD83C\uDF81", color: "#FEE75C", sortOrder: 5 },
  { name: "Workshop", slug: "workshop", emoji: "\uD83D\uDCA1", color: "#5865F2", sortOrder: 6 },
  { name: "Stage Event", slug: "stage-event", emoji: "\uD83C\uDF9F", color: "#EB459E", sortOrder: 7 },
  { name: "Creative Contest", slug: "creative-contest", emoji: "\uD83C\uDFA8", color: "#57F287", sortOrder: 8 },
  { name: "Special Event", slug: "special-event", emoji: "\u2B50", color: "#FEE75C", sortOrder: 9 },
];

export const CATEGORY_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const CATEGORY_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};
