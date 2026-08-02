import { z } from "zod";

// =====================================================
// Announcement Validation Schemas
// =====================================================

export const announcementStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const announcementPrioritySchema = z.enum([
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

export const announcementVisibilitySchema = z.enum([
  "PUBLIC",
  "MEMBERS_ONLY",
  "ADMINS_ONLY",
]);

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(256, "Title must be at most 256 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(256, "Slug must be at most 256 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  summary: z
    .string()
    .max(512, "Summary must be at most 512 characters")
    .optional(),
  content: z.string().min(1, "Content is required"),
  bannerUrl: z.string().url("Invalid URL").optional().nullable(),
  authorId: z.string().uuid("Invalid author ID"),
  festivalId: z.string().uuid("Invalid festival ID").optional().nullable(),
  priority: announcementPrioritySchema.optional().default("NORMAL"),
  visibility: announcementVisibilitySchema.optional().default("PUBLIC"),
  status: announcementStatusSchema.optional().default("DRAFT"),
  publishAt: z.string().datetime().optional().nullable(),
  expireAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isPinned: z.boolean().optional().default(false),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(256, "Title must be at most 256 characters")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(256, "Slug must be at most 256 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  summary: z
    .string()
    .max(512, "Summary must be at most 512 characters")
    .optional(),
  content: z.string().min(1, "Content is required").optional(),
  bannerUrl: z.string().url("Invalid URL").optional().nullable(),
  festivalId: z.string().uuid("Invalid festival ID").optional().nullable(),
  priority: announcementPrioritySchema.optional(),
  visibility: announcementVisibilitySchema.optional(),
  status: announcementStatusSchema.optional(),
  publishAt: z.string().datetime().optional().nullable(),
  expireAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
});

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const announcementFiltersSchema = z.object({
  search: z.string().optional(),
  status: announcementStatusSchema.optional(),
  priority: announcementPrioritySchema.optional(),
  visibility: announcementVisibilitySchema.optional(),
  festivalId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z
    .enum(["title", "status", "priority", "publishAt", "createdAt", "viewCount"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type AnnouncementFiltersInput = z.infer<typeof announcementFiltersSchema>;

export const bulkAnnouncementActionSchema = z.object({
  announcementIds: z
    .array(z.string().uuid())
    .min(1, "At least one announcement must be selected"),
});

export type BulkAnnouncementActionInput = z.infer<
  typeof bulkAnnouncementActionSchema
>;
