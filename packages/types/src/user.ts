// =====================================================
// User Types
// =====================================================

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  username: string;
  globalName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  socialLinks?: SocialLinks;
  notificationPrefs: NotificationPrefs;
  privacySettings: PrivacySettings;
  isVerified: boolean;
  bannedAt?: Date;
  banReason?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  twitch?: string;
}

export interface NotificationPrefs {
  email: boolean;
  push: boolean;
  discord: boolean;
}

export interface PrivacySettings {
  show_profile: boolean;
  show_email: boolean;
}

// =====================================================
// User Roles
// =====================================================

export type RoleName = "ADMIN" | "ORGANIZER" | "MODERATOR" | "MEMBER" | "GUEST";

export interface Role {
  id: string;
  name: RoleName;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  key: string;
  description?: string;
}

// =====================================================
// User with Roles
// =====================================================

export interface UserWithRoles extends User {
  roles: RoleName[];
  permissions: string[];
}

// =====================================================
// User Profile (Public)
// =====================================================

export interface UserProfile {
  id: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  isVerified: boolean;
  createdAt: Date;
}

// =====================================================
// Auth Types
// =====================================================

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionWithUser extends Session {
  user: User;
}

// =====================================================
// Discord Types
// =====================================================

export interface DiscordAccount {
  id: string;
  userId: string;
  joinedDiscordAt?: Date;
  syncedAt: Date;
}
