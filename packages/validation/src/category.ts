import { z } from "zod";

// =====================================================
// Event Category Validation Schemas
// =====================================================

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(64, "Name must be at most 64 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(64, "Slug must be at most 64 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  emoji: z.string().max(16, "Emoji must be at most 16 characters").optional(),
  icon: z.string().max(64, "Icon must be at most 64 characters").optional(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional()
    .default("#5865F2"),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(64, "Name must be at most 64 characters")
    .optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(64, "Slug must be at most 64 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  emoji: z.string().max(16, "Emoji must be at most 16 characters").optional(),
  icon: z.string().max(64, "Icon must be at most 64 characters").optional(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const categoryFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z
    .enum(["name", "sortOrder", "createdAt"])
    .optional()
    .default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(10),
});

export type CategoryFiltersInput = z.infer<typeof categoryFiltersSchema>;

export const bulkCategoryActionSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1, "At least one category must be selected"),
});

export type BulkCategoryActionInput = z.infer<typeof bulkCategoryActionSchema>;

export const duplicateCategorySchema = z.object({
  id: z.string().uuid("Invalid category ID"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(64, "Name must be at most 64 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(64, "Slug must be at most 64 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
});

export type DuplicateCategoryInput = z.infer<typeof duplicateCategorySchema>;
