import { z } from "zod";

// =====================================================
// User Validation Schemas
// =====================================================

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(64, "Username must be at most 64 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username must contain only letters, numbers, and underscores"
  );

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be at most 255 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

export const globalNameSchema = z
  .string()
  .max(128, "Display name must be at most 128 characters")
  .optional();

export const bioSchema = z
  .string()
  .max(500, "Bio must be at most 500 characters")
  .optional();

export const timezoneSchema = z.string().optional();

export const socialLinksSchema = z
  .object({
    twitter: z.string().url("Invalid Twitter URL").optional(),
    instagram: z.string().url("Invalid Instagram URL").optional(),
    youtube: z.string().url("Invalid YouTube URL").optional(),
    twitch: z.string().url("Invalid Twitch URL").optional(),
  })
  .optional();

export const notificationPrefsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  discord: z.boolean(),
});

export const privacySettingsSchema = z.object({
  show_profile: z.boolean(),
  show_email: z.boolean(),
});

// =====================================================
// User Update Schema
// =====================================================

export const updateUserSchema = z.object({
  globalName: globalNameSchema,
  email: emailSchema.optional(),
  bio: bioSchema,
  timezone: timezoneSchema,
  socialLinks: socialLinksSchema,
  notificationPrefs: notificationPrefsSchema.optional(),
  privacySettings: privacySettingsSchema.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// =====================================================
// User Profile Schema
// =====================================================

export const userProfileSchema = z.object({
  username: usernameSchema,
  globalName: globalNameSchema,
  bio: bioSchema,
  timezone: timezoneSchema,
  socialLinks: socialLinksSchema,
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
