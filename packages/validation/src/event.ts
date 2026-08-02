import { z } from "zod";

// =====================================================
// Community Event Validation Schemas
// =====================================================

export const eventStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

export const eventVisibilitySchema = z.enum([
  "PUBLIC",
  "MEMBERS_ONLY",
  "HIDDEN",
]);

export const createCommunityEventSchema = z
  .object({
    festivalId: z.string().uuid("Invalid festival ID"),
    categoryId: z.string().uuid("Invalid category ID"),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(128, "Title must be at most 128 characters"),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(128, "Slug must be at most 128 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      ),
    shortDescription: z
      .string()
      .max(256, "Short description must be at most 256 characters")
      .optional(),
    fullDescription: z
      .string()
      .max(10000, "Full description must be at most 10000 characters")
      .optional(),
    bannerUrl: z.string().url("Invalid banner URL").optional().or(z.literal("")),
    thumbnailUrl: z
      .string()
      .url("Invalid thumbnail URL")
      .optional()
      .or(z.literal("")),
    startDate: z.string().datetime("Invalid start date format"),
    endDate: z.string().datetime("Invalid end date format"),
    timezone: z.string().optional().default("Asia/Kolkata"),
    location: z
      .string()
      .max(128, "Location must be at most 128 characters")
      .optional(),
    discordVoiceChannelId: z
      .string()
      .max(64, "Discord channel ID must be at most 64 characters")
      .optional(),
    discordStageChannelId: z
      .string()
      .max(64, "Discord channel ID must be at most 64 characters")
      .optional(),
    capacity: z.number().int().min(1, "Capacity must be at least 1").optional(),
    waitlistEnabled: z.boolean().optional().default(false),
    registrationEnabled: z.boolean().optional().default(false),
    registrationStart: z
      .string()
      .datetime("Invalid registration start date")
      .optional(),
    registrationEnd: z
      .string()
      .datetime("Invalid registration end date")
      .optional(),
    visibility: eventVisibilitySchema.optional().default("PUBLIC"),
    isFeatured: z.boolean().optional().default(false),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      if (data.registrationStart && data.registrationEnd) {
        return new Date(data.registrationEnd) > new Date(data.registrationStart);
      }
      return true;
    },
    {
      message: "Registration end date must be after registration start date",
      path: ["registrationEnd"],
    }
  )
  .refine(
    (data) => {
      if (data.registrationStart) {
        return new Date(data.registrationStart) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Registration start date must be after event start date",
      path: ["registrationStart"],
    }
  );

export type CreateCommunityEventInput = z.infer<
  typeof createCommunityEventSchema
>;

export const updateCommunityEventSchema = z
  .object({
    festivalId: z.string().uuid("Invalid festival ID").optional(),
    categoryId: z.string().uuid("Invalid category ID").optional(),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(128, "Title must be at most 128 characters")
      .optional(),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(128, "Slug must be at most 128 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      )
      .optional(),
    shortDescription: z
      .string()
      .max(256, "Short description must be at most 256 characters")
      .optional(),
    fullDescription: z
      .string()
      .max(10000, "Full description must be at most 10000 characters")
      .optional(),
    bannerUrl: z.string().url("Invalid banner URL").optional().or(z.literal("")),
    thumbnailUrl: z
      .string()
      .url("Invalid thumbnail URL")
      .optional()
      .or(z.literal("")),
    startDate: z.string().datetime("Invalid start date format").optional(),
    endDate: z.string().datetime("Invalid end date format").optional(),
    timezone: z.string().optional(),
    location: z
      .string()
      .max(128, "Location must be at most 128 characters")
      .optional(),
    discordVoiceChannelId: z
      .string()
      .max(64, "Discord channel ID must be at most 64 characters")
      .optional(),
    discordStageChannelId: z
      .string()
      .max(64, "Discord channel ID must be at most 64 characters")
      .optional(),
    capacity: z.number().int().min(1, "Capacity must be at least 1").optional(),
    waitlistEnabled: z.boolean().optional(),
    registrationEnabled: z.boolean().optional(),
    registrationStart: z
      .string()
      .datetime("Invalid registration start date")
      .optional(),
    registrationEnd: z
      .string()
      .datetime("Invalid registration end date")
      .optional(),
    status: eventStatusSchema.optional(),
    visibility: eventVisibilitySchema.optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.registrationStart && data.registrationEnd) {
        return new Date(data.registrationEnd) > new Date(data.registrationStart);
      }
      return true;
    },
    {
      message: "Registration end date must be after registration start date",
      path: ["registrationEnd"],
    }
  );

export type UpdateCommunityEventInput = z.infer<
  typeof updateCommunityEventSchema
>;

export const eventFiltersSchema = z.object({
  search: z.string().optional(),
  festivalId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: eventStatusSchema.optional(),
  visibility: eventVisibilitySchema.optional(),
  isFeatured: z.boolean().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  sortBy: z
    .enum(["title", "startDate", "endDate", "createdAt", "status", "category"])
    .optional()
    .default("startDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(10),
});

export type EventFiltersInput = z.infer<typeof eventFiltersSchema>;

export const bulkEventActionSchema = z.object({
  eventIds: z
    .array(z.string().uuid())
    .min(1, "At least one event must be selected"),
});

export type BulkEventActionInput = z.infer<typeof bulkEventActionSchema>;

export const duplicateEventSchema = z.object({
  id: z.string().uuid("Invalid event ID"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(128, "Title must be at most 128 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(128, "Slug must be at most 128 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
});

export type DuplicateEventInput = z.infer<typeof duplicateEventSchema>;
