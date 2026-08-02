// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

export interface ErrorDetail {
  field: string;
  message: string;
  rule: string;
}

// =====================================================
// Error Codes
// =====================================================

export type ErrorCode =
  | "UNAUTHORIZED" |"FORBIDDEN" |"NOT_FOUND" |"VALIDATION_ERROR" |"CONFLICT" |"RATE_LIMITED" |"INTERNAL_ERROR" |"INVALID_CREDENTIALS" |"ACCOUNT_SUSPENDED" |"EMAIL_NOT_VERIFIED" |"GUILD_MEMBERSHIP_REQUIRED";

// =====================================================
// Pagination Parameters
// =====================================================

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface FilterParams extends PaginationParams, SortParams {
  search?: string;
}

// =====================================================
// Rate Limit Headers
// =====================================================

export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
  "Retry-After"?: string;
}
