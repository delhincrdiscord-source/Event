// =====================================================
// Application Configuration Constants
// =====================================================

export const APP_CONFIG = {
  // App Info
  NAME: "Delhi NCR Gameverse 2026",
  SHORT_NAME: "Gameverse",
  DESCRIPTION: "Community festival platform for Delhi NCR Discord community",

  // URLs
  LANDING_URL: process.env.NEXT_PUBLIC_LANDING_URL || "https://gameverse.delhincr.fun",
  DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.delhincr.fun",
  DISCORD_INVITE: process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/delhi",

  // API
  API_VERSION: "v1",
  API_PREFIX: "/api/v1",

  // Discord
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || "",

  // Storage
  B2_PUBLIC_URL: process.env.B2_PUBLIC_URL || "",

  // Session
  SESSION_COOKIE_NAME: "__session",
  SESSION_DURATION_HOURS: 24,
  SESSION_REMEMBER_ME_DURATION_DAYS: 30,
} as const;

// =====================================================
// Event Configuration
// =====================================================

export const EVENT_CONFIG = {
  MAX_WEEK_NUMBER: 4,
  MIN_WEEK_NUMBER: 1,
  WEEKS: [1, 2, 3, 4] as const,
  MAX_EVENTS_PER_WEEK: 20,
  RSVP_LIMIT_PER_EVENT: 500,
} as const;

// =====================================================
// Registration Configuration
// =====================================================

export const REGISTRATION_CONFIG = {
  PASS_PREFIX: "GV26",
  PASS_FORMAT: "GV26-XXXX-XXXX",
  MAX_REGISTRATIONS: 100000,
} as const;

// =====================================================
// File Upload Configuration
// =====================================================

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ] as const,
  UPLOAD_PATH: "uploads",
} as const;

// =====================================================
// Rate Limiting Configuration
// =====================================================

export const RATE_LIMIT_CONFIG = {
  PUBLIC_READ: { limit: 60, window: 60 }, // 60 requests per minute
  AUTHENTICATED_READ: { limit: 120, window: 60 }, // 120 requests per minute
  AUTHENTICATED_WRITE: { limit: 30, window: 60 }, // 30 requests per minute
  REGISTRATION: { limit: 5, window: 60 }, // 5 requests per minute
  FILE_UPLOAD: { limit: 10, window: 300 }, // 10 requests per 5 minutes
  ADMIN_WRITE: { limit: 60, window: 60 }, // 60 requests per minute
} as const;

// =====================================================
// Cache Configuration
// =====================================================

export const CACHE_CONFIG = {
  LANDING_PAGE_TTL: 60, // 1 minute
  EVENT_LIST_TTL: 30, // 30 seconds
  FAQ_LIST_TTL: 300, // 5 minutes
  GALLERY_TTL: 60, // 1 minute
  ANNOUNCEMENTS_TTL: 30, // 30 seconds
  USER_SESSION_TTL: 7 * 24 * 60 * 60, // 7 days
  ANALYTICS_TTL: 300, // 5 minutes
} as const;

// =====================================================
// Validation Configuration
// =====================================================

export const VALIDATION_CONFIG = {
  USERNAME: { MIN: 3, MAX: 64 },
  EMAIL: { MAX: 255 },
  PASSWORD: { MIN: 8, MAX: 128 },
  BIO: { MAX: 500 },
  TITLE: { MIN: 3, MAX: 128 },
  DESCRIPTION: { MIN: 10, MAX: 5000 },
  FAQ_QUESTION: { MIN: 10, MAX: 500 },
  FAQ_ANSWER: { MIN: 10, MAX: 5000 },
} as const;
