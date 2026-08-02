// =====================================================
// Discord Integration Types
// =====================================================

export type BotStatus = "ONLINE" | "OFFLINE" | "ERROR" | "STARTING" | "STOPPING";
export type DiscordAccountStatus = "CONNECTED" | "DISCONNECTED" | "ERROR";
export type AutomationTrigger =
  | "REGISTRATION_APPROVED" |"ANNOUNCEMENT_PUBLISHED" |"EVENT_PUBLISHED" |"EVENT_REMINDER" |"EVENT_COMPLETED" |"USER_JOINED" |"USER_LEFT";
export type AutomationAction =
  | "ASSIGN_ROLE" |"REMOVE_ROLE" |"SEND_EMBED" |"SEND_MESSAGE" |"SEND_NOTIFICATION";
export type LogEventType =
  | "GUILD_EVENT" |"ROLE_CHANGE" |"WEBHOOK_EVENT" |"SLASH_COMMAND" |"BOT_EVENT" |"ERROR";

// =====================================================
// Discord Config
// =====================================================

export interface DiscordConfig {
  id: string;
  guildId: string;
  clientId: string;
  botStatus: BotStatus;
  lastLatency?: number | null;
  lastCheckedAt?: Date | null;
  isVerified: boolean;
  registeredRoleId?: string | null;
  registrationsChannelId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscordConfigWithRelations extends DiscordConfig {
  guilds: DiscordGuild[];
  roles: DiscordRole[];
  channels: DiscordChannel[];
  webhooks: DiscordWebhook[];
  automations: DiscordAutomation[];
  slashCommands: DiscordSlashCommand[];
}

export interface UpdateDiscordConfigInput {
  botToken?: string;
  guildId?: string;
  clientId?: string;
  clientSecret?: string;
  publicKey?: string;
}

// =====================================================
// Discord Guild
// =====================================================

export interface DiscordGuild {
  id: string;
  configId: string;
  guildId: string;
  name: string;
  iconUrl?: string | null;
  memberCount: number;
  onlineCount: number;
  boostCount: number;
  boostLevel: number;
  ownerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// Discord Role
// =====================================================

export interface DiscordRole {
  id: string;
  configId: string;
  roleId: string;
  name: string;
  color: number;
  position: number;
  isManaged: boolean;
  mentionable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscordRoleListItem extends DiscordRole {
  _count?: {
    mappings: number;
  };
}

// =====================================================
// Discord Channel
// =====================================================

export interface DiscordChannel {
  id: string;
  configId: string;
  channelId: string;
  name: string;
  type: number;
  topic?: string | null;
  nsfw: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscordChannelListItem extends DiscordChannel {
  _count?: {
    webhooks: number;
  };
}

// =====================================================
// Discord Webhook
// =====================================================

export interface DiscordWebhook {
  id: string;
  configId: string;
  channelId: string;
  webhookId: string;
  name: string;
  avatarUrl?: string | null;
  token: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscordWebhookListItem extends DiscordWebhook {
  channel?: {
    id: string;
    name: string;
    channelId: string;
  };
  _count?: {
    logs: number;
  };
}

export interface CreateDiscordWebhookInput {
  channelId: string;
  name: string;
  avatarUrl?: string;
}

export interface UpdateDiscordWebhookInput {
  name?: string;
  avatarUrl?: string;
  channelId?: string;
  isActive?: boolean;
}

// =====================================================
// Discord Role Mapping
// =====================================================

export interface DiscordRoleMapping {
  id: string;
  configId: string;
  roleId: string;
  platformRole: string;
  autoAssign: boolean;
  autoRemove: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscordRoleMappingListItem extends DiscordRoleMapping {
  role?: {
    id: string;
    name: string;
    roleId: string;
    color: number;
  };
}

export interface CreateDiscordRoleMappingInput {
  roleId: string;
  platformRole: string;
  autoAssign?: boolean;
  autoRemove?: boolean;
}

export interface UpdateDiscordRoleMappingInput {
  platformRole?: string;
  autoAssign?: boolean;
  autoRemove?: boolean;
}

// =====================================================
// Discord Automation
// =====================================================

export interface DiscordAutomation {
  id: string;
  configId: string;
  name: string;
  description?: string | null;
  trigger: AutomationTrigger;
  action: AutomationAction;
  channelId?: string | null;
  roleId?: string | null;
  messageTemplate?: string | null;
  embedJson?: Record<string, unknown> | null;
  conditions?: Record<string, unknown> | null;
  isActive: boolean;
  lastTriggeredAt?: Date | null;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiscordAutomationInput {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  channelId?: string;
  roleId?: string;
  messageTemplate?: string;
  embedJson?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateDiscordAutomationInput {
  name?: string;
  description?: string;
  trigger?: AutomationTrigger;
  action?: AutomationAction;
  channelId?: string;
  roleId?: string;
  messageTemplate?: string;
  embedJson?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  isActive?: boolean;
}

// =====================================================
// Discord Slash Command
// =====================================================

export interface DiscordSlashCommand {
  id: string;
  configId: string;
  commandId?: string | null;
  name: string;
  description: string;
  options?: Record<string, unknown> | null;
  isGlobal: boolean;
  isEnabled: boolean;
  usageCount: number;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiscordSlashCommandInput {
  name: string;
  description: string;
  options?: Record<string, unknown>;
  isGlobal?: boolean;
  isEnabled?: boolean;
}

export interface UpdateDiscordSlashCommandInput {
  description?: string;
  options?: Record<string, unknown>;
  isGlobal?: boolean;
  isEnabled?: boolean;
}

// =====================================================
// Discord Webhook Log
// =====================================================

export interface DiscordWebhookLog {
  id: string;
  webhookId: string;
  eventType: string;
  status: "SUCCESS" | "FAILED" | "RETRYING";
  payloadJson: Record<string, unknown>;
  responseJson?: Record<string, unknown> | null;
  statusCode?: number | null;
  errorMessage?: string | null;
  executedAt: Date;
  durationMs?: number | null;
}

export interface DiscordWebhookLogListItem extends DiscordWebhookLog {
  webhook?: {
    id: string;
    name: string;
    webhookId: string;
  };
}

// =====================================================
// Discord Member Sync
// =====================================================

export interface DiscordMemberSync {
  id: string;
  configId: string;
  userId: string;
  discordUserId: string;
  discordUsername?: string | null;
  discordNickname?: string | null;
  discordAvatarUrl?: string | null;
  isMember: boolean;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// Discord Activity Log
// =====================================================

export interface DiscordActivityLog {
  id: string;
  configId: string;
  eventType: LogEventType;
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface DiscordActivityLogListItem extends DiscordActivityLog {}

// =====================================================
// Filters & Pagination
// =====================================================

export interface DiscordWebhookLogFilters {
  webhookId?: string;
  status?: "SUCCESS" | "FAILED" | "RETRYING";
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface PaginatedDiscordWebhookLogs {
  logs: DiscordWebhookLogListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface DiscordActivityLogFilters {
  eventType?: LogEventType;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface PaginatedDiscordActivityLogs {
  logs: DiscordActivityLogListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface DiscordMemberSyncFilters {
  search?: string;
  isMember?: boolean;
  page?: number;
  perPage?: number;
}

export interface PaginatedDiscordMemberSyncs {
  members: DiscordMemberSync[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// =====================================================
// Bot Status
// =====================================================

export interface BotStatusInfo {
  status: BotStatus;
  latency?: number | null;
  guildCount: number;
  channelCount: number;
  roleCount: number;
  userCount: number;
  uptime?: number | null;
  lastCheckedAt?: Date | null;
}

// =====================================================
// Stats
// =====================================================

export interface DiscordIntegrationStats {
  isConfigured: boolean;
  isVerified: boolean;
  botStatus: BotStatus;
  guildCount: number;
  channelCount: number;
  roleCount: number;
  webhookCount: number;
  automationCount: number;
  slashCommandCount: number;
  memberSyncCount: number;
  recentLogs: number;
  failedWebhooks: number;
}

// =====================================================
// Labels & Colors
// =====================================================

export const BOT_STATUS_LABELS: Record<BotStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  ERROR: "Error",
  STARTING: "Starting",
  STOPPING: "Stopping",
};

export const BOT_STATUS_COLORS: Record<BotStatus, string> = {
  ONLINE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  OFFLINE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  STARTING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  STOPPING: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  REGISTRATION_APPROVED: "Registration Approved",
  ANNOUNCEMENT_PUBLISHED: "Announcement Published",
  EVENT_PUBLISHED: "Event Published",
  EVENT_REMINDER: "Event Reminder",
  EVENT_COMPLETED: "Event Completed",
  USER_JOINED: "User Joined",
  USER_LEFT: "User Left",
};

export const AUTOMATION_ACTION_LABELS: Record<AutomationAction, string> = {
  ASSIGN_ROLE: "Assign Role",
  REMOVE_ROLE: "Remove Role",
  SEND_EMBED: "Send Embed",
  SEND_MESSAGE: "Send Message",
  SEND_NOTIFICATION: "Send Notification",
};

export const LOG_EVENT_TYPE_LABELS: Record<LogEventType, string> = {
  GUILD_EVENT: "Guild Event",
  ROLE_CHANGE: "Role Change",
  WEBHOOK_EVENT: "Webhook Event",
  SLASH_COMMAND: "Slash Command",
  BOT_EVENT: "Bot Event",
  ERROR: "Error",
};

export const LOG_EVENT_TYPE_COLORS: Record<LogEventType, string> = {
  GUILD_EVENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  ROLE_CHANGE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  WEBHOOK_EVENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  SLASH_COMMAND: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
  BOT_EVENT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export const WEBHOOK_STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Success",
  FAILED: "Failed",
  RETRYING: "Retrying",
};

export const WEBHOOK_STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  RETRYING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
};

export const DISCORD_INVITE_URL = "https://discord.gg/delhi";
