import { Prisma } from "@prisma/client";
import { prisma } from "@gameverse/database";
import type {
  DiscordConfig,
  DiscordConfigWithRelations,
  UpdateDiscordConfigInput,
  DiscordGuild,
  DiscordRole,
  DiscordRoleListItem,
  DiscordChannel,
  DiscordChannelListItem,
  DiscordWebhook,
  DiscordWebhookListItem,
  CreateDiscordWebhookInput,
  UpdateDiscordWebhookInput,
  DiscordRoleMapping,
  DiscordRoleMappingListItem,
  CreateDiscordRoleMappingInput,
  UpdateDiscordRoleMappingInput,
  DiscordAutomation,
  CreateDiscordAutomationInput,
  UpdateDiscordAutomationInput,
  DiscordSlashCommand,
  CreateDiscordSlashCommandInput,
  UpdateDiscordSlashCommandInput,
  DiscordWebhookLog,
  DiscordWebhookLogListItem,
  DiscordWebhookLogFilters,
  PaginatedDiscordWebhookLogs,
  DiscordMemberSync,
  DiscordMemberSyncFilters,
  PaginatedDiscordMemberSyncs,
  DiscordActivityLog,
  DiscordActivityLogListItem,
  DiscordActivityLogFilters,
  PaginatedDiscordActivityLogs,
  BotStatusInfo,
  DiscordIntegrationStats,
} from "@gameverse/types";

// =====================================================
// Discord Repository
// =====================================================

export class DiscordRepository {
  // =====================================================
  // Config
  // =====================================================

  async getConfig(): Promise<DiscordConfig | null> {
    return prisma.discordConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  async getConfigWithRelations(): Promise<DiscordConfigWithRelations | null> {
    return (await prisma.discordConfig.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        guilds: true,
        roles: {
          orderBy: { position: "desc" },
        },
        channels: {
          orderBy: { position: "asc" },
        },
        webhooks: {
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                channelId: true,
              },
            },
          },
        },
        automations: true,
        slashCommands: true,
      },
    })) as unknown as DiscordConfigWithRelations | null;
  }

  async createConfig(data: {
    botToken: string;
    guildId: string;
    clientId: string;
    clientSecret?: string;
    publicKey?: string;
  }): Promise<DiscordConfig> {
    return prisma.discordConfig.create({
      data: {
        botTokenEncrypted: data.botToken,
        guildId: data.guildId,
        clientId: data.clientId,
        clientSecretEncrypted: data.clientSecret,
        publicKey: data.publicKey,
      },
    });
  }

  async updateConfig(
    id: string,
    data: UpdateDiscordConfigInput
  ): Promise<DiscordConfig> {
    const updateData: Record<string, unknown> = {};

    if (data.botToken !== undefined) updateData.botTokenEncrypted = data.botToken;
    if (data.guildId !== undefined) updateData.guildId = data.guildId;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.clientSecret !== undefined) updateData.clientSecretEncrypted = data.clientSecret;
    if (data.publicKey !== undefined) updateData.publicKey = data.publicKey;

    return prisma.discordConfig.update({
      where: { id },
      data: updateData,
    });
  }

  async updateBotStatus(
    id: string,
    status: "ONLINE" | "OFFLINE" | "ERROR" | "STARTING" | "STOPPING",
    latency?: number
  ): Promise<DiscordConfig> {
    return prisma.discordConfig.update({
      where: { id },
      data: {
        botStatus: status,
        lastLatency: latency,
        lastCheckedAt: new Date(),
      },
    });
  }

  async setVerified(id: string, isVerified: boolean): Promise<DiscordConfig> {
    return prisma.discordConfig.update({
      where: { id },
      data: { isVerified },
    });
  }

  // =====================================================
  // Guild
  // =====================================================

  async getGuilds(configId: string): Promise<DiscordGuild[]> {
    return prisma.discordGuild.findMany({
      where: { configId },
      orderBy: { name: "asc" },
    });
  }

  async syncGuilds(
    configId: string,
    guilds: Array<{
      guildId: string;
      name: string;
      iconUrl?: string;
      memberCount: number;
      onlineCount: number;
      boostCount: number;
      boostLevel: number;
      ownerId?: string;
    }>
  ): Promise<void> {
    const BATCH_SIZE = 50;
    for (let i = 0; i < guilds.length; i += BATCH_SIZE) {
      const batch = guilds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((guild: { guildId: string; name: string; iconUrl?: string; memberCount: number; onlineCount: number; boostCount: number; boostLevel: number; ownerId?: string }) =>
          prisma.discordGuild.upsert({
            where: {
              configId_guildId: {
                configId,
                guildId: guild.guildId,
              },
            },
            create: {
              configId,
              ...guild,
            },
            update: {
              name: guild.name,
              iconUrl: guild.iconUrl,
              memberCount: guild.memberCount,
              onlineCount: guild.onlineCount,
              boostCount: guild.boostCount,
              boostLevel: guild.boostLevel,
              ownerId: guild.ownerId,
            },
          })
        )
      );
    }
  }

  // =====================================================
  // Roles
  // =====================================================

  async getRoles(configId: string): Promise<DiscordRoleListItem[]> {
    return prisma.discordRole.findMany({
      where: { configId },
      orderBy: { position: "desc" },
      include: {
        _count: {
          select: {
            mappings: true,
          },
        },
      },
    });
  }

  async syncRoles(
    configId: string,
    roles: Array<{
      roleId: string;
      name: string;
      color: number;
      position: number;
      isManaged: boolean;
      mentionable: boolean;
    }>
  ): Promise<void> {
    const BATCH_SIZE = 50;
    for (let i = 0; i < roles.length; i += BATCH_SIZE) {
      const batch = roles.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((role: { roleId: string; name: string; color: number; position: number; isManaged: boolean; mentionable: boolean }) =>
          prisma.discordRole.upsert({
            where: {
              configId_roleId: {
                configId,
                roleId: role.roleId,
              },
            },
            create: {
              configId,
              ...role,
            },
            update: {
              name: role.name,
              color: role.color,
              position: role.position,
              isManaged: role.isManaged,
              mentionable: role.mentionable,
            },
          })
        )
      );
    }
  }

  // =====================================================
  // Channels
  // =====================================================

  async getChannels(configId: string): Promise<DiscordChannelListItem[]> {
    return prisma.discordChannel.findMany({
      where: { configId },
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: {
            webhooks: true,
          },
        },
      },
    });
  }

  async syncChannels(
    configId: string,
    channels: Array<{
      channelId: string;
      name: string;
      type: number;
      topic?: string;
      nsfw: boolean;
      position: number;
    }>
  ): Promise<void> {
    const BATCH_SIZE = 50;
    for (let i = 0; i < channels.length; i += BATCH_SIZE) {
      const batch = channels.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((channel: { channelId: string; name: string; type: number; topic?: string; nsfw: boolean; position: number }) =>
          prisma.discordChannel.upsert({
            where: {
              configId_channelId: {
                configId,
                channelId: channel.channelId,
              },
            },
            create: {
              configId,
              ...channel,
            },
            update: {
              name: channel.name,
              type: channel.type,
              topic: channel.topic,
              nsfw: channel.nsfw,
              position: channel.position,
            },
          })
        )
      );
    }
  }

  // =====================================================
  // Webhooks
  // =====================================================

  async getWebhooks(configId: string): Promise<DiscordWebhookListItem[]> {
    return prisma.discordWebhook.findMany({
      where: { configId },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            channelId: true,
          },
        },
        _count: {
          select: {
            logs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getWebhookById(id: string): Promise<DiscordWebhook | null> {
    return prisma.discordWebhook.findFirst({
      where: { id },
    });
  }

  async createWebhook(
    configId: string,
    data: CreateDiscordWebhookInput & {
      webhookId: string;
      token: string;
    }
  ): Promise<DiscordWebhook> {
    return prisma.discordWebhook.create({
      data: {
        configId,
        channelId: data.channelId,
        webhookId: data.webhookId,
        name: data.name,
        avatarUrl: data.avatarUrl,
        token: data.token,
      },
    });
  }

  async updateWebhook(
    id: string,
    data: UpdateDiscordWebhookInput
  ): Promise<DiscordWebhook> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.channelId !== undefined) updateData.channelId = data.channelId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.discordWebhook.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteWebhook(id: string): Promise<void> {
    await prisma.discordWebhook.delete({
      where: { id },
    });
  }

  // =====================================================
  // Role Mappings
  // =====================================================

  async getRoleMappings(configId: string): Promise<DiscordRoleMappingListItem[]> {
    return prisma.discordRoleMapping.findMany({
      where: { configId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            roleId: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createRoleMapping(
    configId: string,
    data: CreateDiscordRoleMappingInput
  ): Promise<DiscordRoleMapping> {
    return prisma.discordRoleMapping.create({
      data: {
        configId,
        roleId: data.roleId,
        platformRole: data.platformRole,
        autoAssign: data.autoAssign ?? false,
        autoRemove: data.autoRemove ?? false,
      },
    });
  }

  async updateRoleMapping(
    id: string,
    data: UpdateDiscordRoleMappingInput
  ): Promise<DiscordRoleMapping> {
    const updateData: Record<string, unknown> = {};

    if (data.platformRole !== undefined) updateData.platformRole = data.platformRole;
    if (data.autoAssign !== undefined) updateData.autoAssign = data.autoAssign;
    if (data.autoRemove !== undefined) updateData.autoRemove = data.autoRemove;

    return prisma.discordRoleMapping.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteRoleMapping(id: string): Promise<void> {
    await prisma.discordRoleMapping.delete({
      where: { id },
    });
  }

  // =====================================================
  // Automations
  // =====================================================

  async getAutomations(configId: string): Promise<DiscordAutomation[]> {
    return (await prisma.discordAutomation.findMany({
      where: { configId },
      orderBy: { createdAt: "desc" },
    })) as unknown as DiscordAutomation[];
  }

  async getAutomationById(id: string): Promise<DiscordAutomation | null> {
    return (await prisma.discordAutomation.findFirst({
      where: { id },
    })) as unknown as DiscordAutomation | null;
  }

  async createAutomation(
    configId: string,
    data: CreateDiscordAutomationInput
  ): Promise<DiscordAutomation> {
    return (await prisma.discordAutomation.create({
      data: {
        configId,
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        action: data.action,
        channelId: data.channelId,
        roleId: data.roleId,
        messageTemplate: data.messageTemplate,
        embedJson: (data.embedJson as never) ?? undefined,
        conditions: (data.conditions as never) ?? undefined,
        isActive: data.isActive ?? true,
      },
    })) as unknown as DiscordAutomation;
  }

  async updateAutomation(
    id: string,
    data: UpdateDiscordAutomationInput
  ): Promise<DiscordAutomation> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.trigger !== undefined) updateData.trigger = data.trigger;
    if (data.action !== undefined) updateData.action = data.action;
    if (data.channelId !== undefined) updateData.channelId = data.channelId;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.messageTemplate !== undefined) updateData.messageTemplate = data.messageTemplate;
    if (data.embedJson !== undefined) updateData.embedJson = data.embedJson;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return (await prisma.discordAutomation.update({
      where: { id },
      data: updateData as never,
    })) as unknown as DiscordAutomation;
  }

  async deleteAutomation(id: string): Promise<void> {
    await prisma.discordAutomation.delete({
      where: { id },
    });
  }

  async incrementAutomationTriggerCount(id: string): Promise<void> {
    await prisma.discordAutomation.update({
      where: { id },
      data: {
        triggerCount: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });
  }

  // =====================================================
  // Slash Commands
  // =====================================================

  async getSlashCommands(configId: string): Promise<DiscordSlashCommand[]> {
    return (await prisma.discordSlashCommand.findMany({
      where: { configId },
      orderBy: { name: "asc" },
    })) as unknown as DiscordSlashCommand[];
  }

  async createSlashCommand(
    configId: string,
    data: CreateDiscordSlashCommandInput
  ): Promise<DiscordSlashCommand> {
    return (await prisma.discordSlashCommand.create({
      data: {
        configId,
        name: data.name,
        description: data.description,
        options: (data.options as never) ?? undefined,
        isGlobal: data.isGlobal ?? true,
        isEnabled: data.isEnabled ?? true,
      },
    })) as unknown as DiscordSlashCommand;
  }

  async updateSlashCommand(
    id: string,
    data: UpdateDiscordSlashCommandInput
  ): Promise<DiscordSlashCommand> {
    const updateData: Record<string, unknown> = {};

    if (data.description !== undefined) updateData.description = data.description;
    if (data.options !== undefined) updateData.options = data.options;
    if (data.isGlobal !== undefined) updateData.isGlobal = data.isGlobal;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;

    return (await prisma.discordSlashCommand.update({
      where: { id },
      data: updateData as never,
    })) as unknown as DiscordSlashCommand;
  }

  async deleteSlashCommand(id: string): Promise<void> {
    await prisma.discordSlashCommand.delete({
      where: { id },
    });
  }

  async incrementSlashCommandUsage(id: string): Promise<void> {
    await prisma.discordSlashCommand.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  // =====================================================
  // Webhook Logs
  // =====================================================

  async getWebhookLogs(
    filters: DiscordWebhookLogFilters
  ): Promise<PaginatedDiscordWebhookLogs> {
    const {
      webhookId,
      status,
      eventType,
      dateFrom,
      dateTo,
      page = 1,
      perPage = 20,
    } = filters;

    const where = {
      ...(webhookId && { webhookId }),
      ...(status && { status }),
      ...(eventType && { eventType }),
      ...(dateFrom && {
        executedAt: { gte: new Date(dateFrom) },
      }),
      ...(dateTo && {
        executedAt: { lte: new Date(dateTo) },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.discordWebhookLog.findMany({
        where,
        orderBy: { executedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          webhook: {
            select: {
              id: true,
              name: true,
              webhookId: true,
            },
          },
        },
      }),
      prisma.discordWebhookLog.count({ where }),
    ]);

    return {
      logs: logs as DiscordWebhookLogListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async createWebhookLog(data: {
    webhookId: string;
    eventType: string;
    status: "SUCCESS" | "FAILED" | "RETRYING";
    payloadJson: Record<string, unknown>;
    responseJson?: Record<string, unknown>;
    statusCode?: number;
    errorMessage?: string;
    durationMs?: number;
  }): Promise<DiscordWebhookLog> {
    return (await prisma.discordWebhookLog.create({
      data: data as never,
    })) as unknown as DiscordWebhookLog;
  }

  async retryFailedWebhookLogs(): Promise<number> {
    const result = await prisma.discordWebhookLog.updateMany({
      where: {
        status: "FAILED",
      },
      data: {
        status: "RETRYING",
      },
    });
    return result.count;
  }

  // =====================================================
  // Member Sync
  // =====================================================

  async getMemberSyncs(
    filters: DiscordMemberSyncFilters
  ): Promise<PaginatedDiscordMemberSyncs> {
    const {
      search,
      isMember,
      page = 1,
      perPage = 20,
    } = filters;

    const where = {
      ...(search && {
        OR: [
          { discordUsername: { contains: search, mode: "insensitive" as const } },
          { discordNickname: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(isMember !== undefined && { isMember }),
    };

    const [members, total] = await Promise.all([
      prisma.discordMemberSync.findMany({
        where,
        orderBy: { lastSyncedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.discordMemberSync.count({ where }),
    ]);

    return {
      members,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async syncMember(
    configId: string,
    userId: string,
    discordData: {
      discordUserId: string;
      discordUsername: string;
      discordNickname?: string;
      discordAvatarUrl?: string;
      isMember: boolean;
    }
  ): Promise<DiscordMemberSync> {
    return prisma.discordMemberSync.upsert({
      where: {
        configId_userId: {
          configId,
          userId,
        },
      },
      create: {
        configId,
        userId,
        ...discordData,
      },
      update: {
        discordUsername: discordData.discordUsername,
        discordNickname: discordData.discordNickname,
        discordAvatarUrl: discordData.discordAvatarUrl,
        isMember: discordData.isMember,
        lastSyncedAt: new Date(),
      },
    });
  }

  // =====================================================
  // Activity Logs
  // =====================================================

  async getActivityLogs(
    filters: DiscordActivityLogFilters
  ): Promise<PaginatedDiscordActivityLogs> {
    const {
      eventType,
      action,
      dateFrom,
      dateTo,
      page = 1,
      perPage = 20,
    } = filters;

    const where = {
      ...(eventType && { eventType }),
      ...(action && { action: { contains: action, mode: "insensitive" as const } }),
      ...(dateFrom && {
        createdAt: { gte: new Date(dateFrom) },
      }),
      ...(dateTo && {
        createdAt: { lte: new Date(dateTo) },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.discordActivityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.discordActivityLog.count({ where }),
    ]);

    return {
      logs: logs as DiscordActivityLogListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async createActivityLog(data: {
    configId: string;
    eventType: "GUILD_EVENT" | "ROLE_CHANGE" | "WEBHOOK_EVENT" | "SLASH_COMMAND" | "BOT_EVENT" | "ERROR";
    action: string;
    actorId?: string;
    actorName?: string;
    targetId?: string;
    targetName?: string;
    details?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<DiscordActivityLog> {
    return (await prisma.discordActivityLog.create({
      data: data as never,
    })) as unknown as DiscordActivityLog;
  }

  // =====================================================
  // Stats
  // =====================================================

  async getStats(): Promise<DiscordIntegrationStats> {
    const config = await this.getConfig();

    if (!config) {
      return {
        isConfigured: false,
        isVerified: false,
        botStatus: "OFFLINE",
        guildCount: 0,
        channelCount: 0,
        roleCount: 0,
        webhookCount: 0,
        automationCount: 0,
        slashCommandCount: 0,
        memberSyncCount: 0,
        recentLogs: 0,
        failedWebhooks: 0,
      };
    }

    const [
      guildCount,
      channelCount,
      roleCount,
      webhookCount,
      automationCount,
      slashCommandCount,
      memberSyncCount,
      recentLogs,
      failedWebhooks,
    ] = await Promise.all([
      prisma.discordGuild.count({ where: { configId: config.id } }),
      prisma.discordChannel.count({ where: { configId: config.id } }),
      prisma.discordRole.count({ where: { configId: config.id } }),
      prisma.discordWebhook.count({ where: { configId: config.id } }),
      prisma.discordAutomation.count({ where: { configId: config.id } }),
      prisma.discordSlashCommand.count({ where: { configId: config.id } }),
      prisma.discordMemberSync.count({ where: { configId: config.id } }),
      prisma.discordActivityLog.count({
        where: {
          configId: config.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.discordWebhookLog.count({
        where: {
          webhook: { configId: config.id },
          status: "FAILED",
          executedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      isConfigured: true,
      isVerified: config.isVerified,
      botStatus: config.botStatus,
      guildCount,
      channelCount,
      roleCount,
      webhookCount,
      automationCount,
      slashCommandCount,
      memberSyncCount,
      recentLogs,
      failedWebhooks,
    };
  }

  async getBotStatusInfo(): Promise<BotStatusInfo> {
    const config = await this.getConfig();

    if (!config) {
      return {
        status: "OFFLINE",
        guildCount: 0,
        channelCount: 0,
        roleCount: 0,
        userCount: 0,
      };
    }

    const [guildCount, channelCount, roleCount, userCount] = await Promise.all([
      prisma.discordGuild.count({ where: { configId: config.id } }),
      prisma.discordChannel.count({ where: { configId: config.id } }),
      prisma.discordRole.count({ where: { configId: config.id } }),
      prisma.discordMemberSync.count({ where: { configId: config.id } }),
    ]);

    return {
      status: config.botStatus,
      latency: config.lastLatency,
      guildCount,
      channelCount,
      roleCount,
      userCount,
      lastCheckedAt: config.lastCheckedAt,
    };
  }
}

export const discordRepository = new DiscordRepository();
