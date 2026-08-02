// =====================================================
// Permission Constants
// =====================================================

export const PERMISSIONS = {
  // Authentication
  AUTH_LOGIN: "auth:login",
  AUTH_REGISTER: "auth:register",

  // Users
  USERS_READ: "users:read",
  USERS_READ_SELF: "users:read:self",
  USERS_UPDATE: "users:update",
  USERS_UPDATE_SELF: "users:update:self",
  USERS_DELETE: "users:delete",

  // Events
  EVENTS_READ: "events:read",
  EVENTS_CREATE: "events:create",
  EVENTS_UPDATE: "events:update",
  EVENTS_DELETE: "events:delete",
  EVENTS_RSVP: "events:rsvp",

  // Registrations
  REGISTRATIONS_READ: "registrations:read",
  REGISTRATIONS_CREATE: "registrations:create",
  REGISTRATIONS_UPDATE_STATUS: "registrations:update:status",

  // Announcements
  ANNOUNCEMENTS_READ: "announcements:read",
  ANNOUNCEMENTS_CREATE: "announcements:create",
  ANNOUNCEMENTS_UPDATE: "announcements:update",
  ANNOUNCEMENTS_DELETE: "announcements:delete",

  // Gallery
  GALLERY_READ: "gallery:read",
  GALLERY_SUBMIT: "gallery:submit",
  GALLERY_APPROVE: "gallery:approve",
  GALLERY_DELETE: "gallery:delete",

  // FAQs
  FAQS_READ: "faqs:read",
  FAQS_CREATE: "faqs:create",
  FAQS_UPDATE: "faqs:update",
  FAQS_DELETE: "faqs:delete",
  FAQS_REORDER: "faqs:reorder",

  // Notifications
  NOTIFICATIONS_READ_SELF: "notifications:read:self",
  NOTIFICATIONS_BROADCAST: "notifications:broadcast",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // Analytics
  ANALYTICS_READ: "analytics:read",

  // Audit
  AUDIT_READ: "audit:read",

  // Discord
  DISCORD_SYNC: "discord:sync",
  DISCORD_WEBHOOK_TEST: "discord:webhook:test",
  DISCORD_LOGS_READ: "discord:logs:read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Permission groups for easier management
 */
export const PERMISSION_GROUPS = {
  PUBLIC: [PERMISSIONS.EVENTS_READ, PERMISSIONS.ANNOUNCEMENTS_READ, PERMISSIONS.FAQS_READ, PERMISSIONS.GALLERY_READ],
  MEMBER: [
    PERMISSIONS.EVENTS_RSVP,
    PERMISSIONS.REGISTRATIONS_CREATE,
    PERMISSIONS.GALLERY_SUBMIT,
    PERMISSIONS.NOTIFICATIONS_READ_SELF,
    PERMISSIONS.USERS_READ_SELF,
    PERMISSIONS.USERS_UPDATE_SELF,
    PERMISSIONS.DISCORD_SYNC,
  ],
  MODERATOR: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ANNOUNCEMENTS_UPDATE,
    PERMISSIONS.GALLERY_APPROVE,
    PERMISSIONS.REGISTRATIONS_READ,
  ],
  ORGANIZER: [
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_UPDATE,
    PERMISSIONS.REGISTRATIONS_UPDATE_STATUS,
    PERMISSIONS.ANNOUNCEMENTS_CREATE,
    PERMISSIONS.NOTIFICATIONS_BROADCAST,
    PERMISSIONS.ANALYTICS_READ,
  ],
  ADMIN: [
    PERMISSIONS.EVENTS_DELETE,
    PERMISSIONS.ANNOUNCEMENTS_DELETE,
    PERMISSIONS.GALLERY_DELETE,
    PERMISSIONS.FAQS_CREATE,
    PERMISSIONS.FAQS_UPDATE,
    PERMISSIONS.FAQS_DELETE,
    PERMISSIONS.FAQS_REORDER,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.DISCORD_WEBHOOK_TEST,
    PERMISSIONS.DISCORD_LOGS_READ,
  ],
} as const;

/**
 * Get all permissions for a set of roles
 */
export function getPermissionsForRoles(roles: string[]): Permission[] {
  const permissions = new Set<Permission>();

  // Everyone gets public permissions
  PERMISSION_GROUPS.PUBLIC.forEach((p) => permissions.add(p));

  if (roles.includes("MEMBER") || roles.includes("MODERATOR") || roles.includes("ORGANIZER") || roles.includes("ADMIN")) {
    PERMISSION_GROUPS.MEMBER.forEach((p) => permissions.add(p));
  }

  if (roles.includes("MODERATOR") || roles.includes("ORGANIZER") || roles.includes("ADMIN")) {
    PERMISSION_GROUPS.MODERATOR.forEach((p) => permissions.add(p));
  }

  if (roles.includes("ORGANIZER") || roles.includes("ADMIN")) {
    PERMISSION_GROUPS.ORGANIZER.forEach((p) => permissions.add(p));
  }

  if (roles.includes("ADMIN")) {
    PERMISSION_GROUPS.ADMIN.forEach((p) => permissions.add(p));
  }

  return Array.from(permissions);
}
