import { z } from "zod";

// =====================================================
// Notification Validation Schemas
// =====================================================

export const notificationTypeSchema = z.enum([
  "SYSTEM",
  "ANNOUNCEMENT",
  "REGISTRATION",
  "APPROVAL",
  "REMINDER",
  "FESTIVAL",
  "EVENT",
  "CUSTOM",
]);

export const notificationChannelSchema = z.enum([
  "IN_APP",
  "DISCORD",
  "EMAIL",
  "PUSH",
]);

export const deliveryStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "FAILED",
  "RETRYING",
]);

export const createNotificationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  type: notificationTypeSchema,
  title: z
    .string()
    .min(1, "Title is required")
    .max(256, "Title must be at most 256 characters"),
  message: z.string().min(1, "Message is required"),
  link: z.string().url("Invalid URL").optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  channels: z
    .array(notificationChannelSchema)
    .optional()
    .default(["IN_APP"]),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const notificationFiltersSchema = z.object({
  search: z.string().optional(),
  type: notificationTypeSchema.optional(),
  isRead: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z
    .enum(["title", "type", "createdAt", "readAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type NotificationFiltersInput = z.infer<typeof notificationFiltersSchema>;

export const bulkNotificationActionSchema = z.object({
  notificationIds: z
    .array(z.string().uuid())
    .min(1, "At least one notification must be selected"),
});

export type BulkNotificationActionInput = z.infer<
  typeof bulkNotificationActionSchema
>;

export const notificationQueueFiltersSchema = z.object({
  status: deliveryStatusSchema.optional(),
  channel: notificationChannelSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type NotificationQueueFiltersInput = z.infer<
  typeof notificationQueueFiltersSchema
>;
