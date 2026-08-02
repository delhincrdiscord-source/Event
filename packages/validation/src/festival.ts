import { z } from "zod";

// =====================================================
// Festival Validation Schemas
// =====================================================

export const festivalStatusSchema = z.enum([
  "DRAFT",
  "UPCOMING",
  "LIVE",
  "COMPLETED",
  "ARCHIVED",
]);

export const festivalVisibilitySchema = z.enum([
  "PUBLIC",
  "PRIVATE",
  "UNLISTED",
]);

export const createFestivalSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(128, "Name must be at most 128 characters"),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(64, "Slug must be at most 64 characters")
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
    logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
    themeColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Theme color must be a valid hex color")
      .optional()
      .default("#5865F2"),
    discordInvite: z.string().url("Invalid Discord invite URL").optional().or(z.literal("")),
    registrationEnabled: z.boolean().optional().default(false),
    registrationStart: z.string().datetime("Invalid registration start date").optional(),
    registrationEnd: z.string().datetime("Invalid registration end date").optional(),
    startDate: z.string().datetime("Invalid start date format"),
    endDate: z.string().datetime("Invalid end date format"),
    timezone: z.string().optional().default("Asia/Kolkata"),
    visibility: festivalVisibilitySchema.optional().default("PUBLIC"),
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
      message: "Registration start date must be after festival start date",
      path: ["registrationStart"],
    }
  );

export type CreateFestivalInput = z.infer<typeof createFestivalSchema>;

export const updateFestivalSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(128, "Name must be at most 128 characters")
      .optional(),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(64, "Slug must be at most 64 characters")
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
    logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
    themeColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Theme color must be a valid hex color")
      .optional(),
    discordInvite: z.string().url("Invalid Discord invite URL").optional().or(z.literal("")),
    registrationEnabled: z.boolean().optional(),
    registrationStart: z.string().datetime("Invalid registration start date").optional(),
    registrationEnd: z.string().datetime("Invalid registration end date").optional(),
    startDate: z.string().datetime("Invalid start date format").optional(),
    endDate: z.string().datetime("Invalid end date format").optional(),
    timezone: z.string().optional(),
    visibility: festivalVisibilitySchema.optional(),
    status: festivalStatusSchema.optional(),
    isActive: z.boolean().optional(),
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

export type UpdateFestivalInput = z.infer<typeof updateFestivalSchema>;

export const festivalFiltersSchema = z.object({
  search: z.string().optional(),
  status: festivalStatusSchema.optional(),
  visibility: festivalVisibilitySchema.optional(),
  isActive: z.boolean().optional(),
  sortBy: z
    .enum(["name", "startDate", "endDate", "createdAt", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(10),
});

export type FestivalFiltersInput = z.infer<typeof festivalFiltersSchema>;

export const bulkFestivalActionSchema = z.object({
  festivalIds: z.array(z.string().uuid()).min(1, "At least one festival must be selected"),
});

export type BulkFestivalActionInput = z.infer<typeof bulkFestivalActionSchema>;

export const duplicateFestivalSchema = z.object({
  id: z.string().uuid("Invalid festival ID"),
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(128, "Name must be at most 128 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(64, "Slug must be at most 64 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
});

export type DuplicateFestivalInput = z.infer<typeof duplicateFestivalSchema>;
