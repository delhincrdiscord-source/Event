import { z } from "zod";

// =====================================================
// Discord Validation Schemas
// =====================================================

export const botStatusSchema = z.enum([
  "ONLINE",
  "OFFLINE",
  "ERROR",
  "STARTING",
  "STOPPING",
]);

export const automationTriggerSchema = z.enum([
  "REGISTRATION_APPROVED",
  "ANNOUNCEMENT_PUBLISHED",
  "EVENT_PUBLISHED",
  "EVENT_REMINDER",
  "EVENT_COMPLETED",
  "USER_JOINED",
  "USER_LEFT",
]);

export const automationActionSchema = z.enum([
  "ASSIGN_ROLE",
  "REMOVE_ROLE",
  "SEND_EMBED",
  "SEND_MESSAGE",
  "SEND_NOTIFICATION",
]);

export const logEventTypeSchema = z.enum([
  "GUILD_EVENT",
  "ROLE_CHANGE",
  "WEBHOOK_EVENT",
  "SLASH_COMMAND",
  "BOT_EVENT",
  "ERROR",
]);

export const webhookStatusSchema = z.enum([
  "SUCCESS",
  "FAILED",
  "RETRYING",
]);

// =====================================================
// Discord Config
// =====================================================

export const updateDiscordConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required").optional(),
  guildId: z
    .string()
    .min(1, "Guild ID is required")
    .regex(/^\d+$/, "Guild ID must be a number")
    .optional(),
  clientId: z
    .string()
    .min(1, "Client ID is required")
    .regex(/^\d+$/, "Client ID must be a number")
    .optional(),
  clientSecret: z.string().optional(),
  publicKey: z.string().optional(),
});

export type UpdateDiscordConfigInput = z.infer<typeof updateDiscordConfigSchema>;

// =====================================================
// Discord Webhook
// =====================================================

export const createDiscordWebhookSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(128, "Name must be at most 128 characters"),
  avatarUrl: z.string().url("Invalid URL").optional(),
});

export type CreateDiscordWebhookInput = z.infer<typeof createDiscordWebhookSchema>;

export const updateDiscordWebhookSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(128, "Name must be at most 128 characters")
    .optional(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
  channelId: z.string().uuid("Invalid channel ID").optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDiscordWebhookInput = z.infer<typeof updateDiscordWebhookSchema>;

// =====================================================
// Discord Role Mapping
// =====================================================

export const createDiscordRoleMappingSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
  platformRole: z.string().min(1, "Platform role is required"),
  autoAssign: z.boolean().optional().default(false),
  autoRemove: z.boolean().optional().default(false),
});

export type CreateDiscordRoleMappingInput = z.infer<typeof createDiscordRoleMappingSchema>;

export const updateDiscordRoleMappingSchema = z.object({
  platformRole: z.string().min(1, "Platform role is required").optional(),
  autoAssign: z.boolean().optional(),
  autoRemove: z.boolean().optional(),
});

export type UpdateDiscordRoleMappingInput = z.infer<typeof updateDiscordRoleMappingSchema>;

// =====================================================
// Discord Automation
// =====================================================

export const createDiscordAutomationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(128, "Name must be at most 128 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  trigger: automationTriggerSchema,
  action: automationActionSchema,
  channelId: z.string().regex(/^\d+$/, "Channel ID must be a number").optional().nullable(),
  roleId: z.string().regex(/^\d+$/, "Role ID must be a number").optional().nullable(),
  messageTemplate: z.string().max(2000, "Message must be at most 2000 characters").optional(),
  embedJson: z.record(z.unknown()).optional().nullable(),
  conditions: z.record(z.unknown()).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type CreateDiscordAutomationInput = z.infer<typeof createDiscordAutomationSchema>;

export const updateDiscordAutomationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(128, "Name must be at most 128 characters")
    .optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  trigger: automationTriggerSchema.optional(),
  action: automationActionSchema.optional(),
  channelId: z.string().regex(/^\d+$/, "Channel ID must be a number").optional().nullable(),
  roleId: z.string().regex(/^\d+$/, "Role ID must be a number").optional().nullable(),
  messageTemplate: z.string().max(2000, "Message must be at most 2000 characters").optional(),
  embedJson: z.record(z.unknown()).optional().nullable(),
  conditions: z.record(z.unknown()).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateDiscordAutomationInput = z.infer<typeof updateDiscordAutomationSchema>;

// =====================================================
// Discord Slash Command
// =====================================================

export const createDiscordSlashCommandSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(32, "Name must be at most 32 characters")
    .regex(/^[a-z-]+$/, "Name must contain only lowercase letters and hyphens"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(100, "Description must be at most 100 characters"),
  options: z.record(z.unknown()).optional(),
  isGlobal: z.boolean().optional().default(true),
  isEnabled: z.boolean().optional().default(true),
});

export type CreateDiscordSlashCommandInput = z.infer<typeof createDiscordSlashCommandSchema>;

export const updateDiscordSlashCommandSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(100, "Description must be at most 100 characters")
    .optional(),
  options: z.record(z.unknown()).optional(),
  isGlobal: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
});

export type UpdateDiscordSlashCommandInput = z.infer<typeof updateDiscordSlashCommandSchema>;

// =====================================================
// Filters
// =====================================================

export const discordWebhookLogFiltersSchema = z.object({
  webhookId: z.string().uuid().optional(),
  status: webhookStatusSchema.optional(),
  eventType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type DiscordWebhookLogFiltersInput = z.infer<typeof discordWebhookLogFiltersSchema>;

export const discordActivityLogFiltersSchema = z.object({
  eventType: logEventTypeSchema.optional(),
  action: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type DiscordActivityLogFiltersInput = z.infer<typeof discordActivityLogFiltersSchema>;

export const discordMemberSyncFiltersSchema = z.object({
  search: z.string().optional(),
  isMember: z.boolean().optional(),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type DiscordMemberSyncFiltersInput = z.infer<typeof discordMemberSyncFiltersSchema>;
