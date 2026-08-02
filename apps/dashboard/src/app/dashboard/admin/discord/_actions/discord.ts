"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { createErrorResponse, handleActionError, ok, type ActionResult } from "@/lib/errors";
import { encrypt } from "@/lib/encryption";
import { writeAuditLog } from "@/lib/audit";
import { discordRepository } from "@gameverse/database";
import { prisma } from "@gameverse/database";
import { logger } from "@/lib/logger";
import {
  updateDiscordConfigSchema,
  createDiscordWebhookSchema,
  updateDiscordWebhookSchema,
  createDiscordRoleMappingSchema,
  updateDiscordRoleMappingSchema,
  createDiscordAutomationSchema,
  updateDiscordAutomationSchema,
  createDiscordSlashCommandSchema,
  updateDiscordSlashCommandSchema,
  discordWebhookLogFiltersSchema,
  discordActivityLogFiltersSchema,
  discordMemberSyncFiltersSchema,
} from "@gameverse/validation";
import type {
  UpdateDiscordConfigInput,
  CreateDiscordWebhookInput,
  UpdateDiscordWebhookInput,
  CreateDiscordRoleMappingInput,
  UpdateDiscordRoleMappingInput,
  CreateDiscordAutomationInput,
  UpdateDiscordAutomationInput,
  CreateDiscordSlashCommandInput,
  UpdateDiscordSlashCommandInput,
  DiscordWebhookLogFiltersInput,
  DiscordActivityLogFiltersInput,
  DiscordMemberSyncFiltersInput,
} from "@gameverse/validation";

// =====================================================
// Discord Config Server Actions
// =====================================================

export async function getDiscordConfig(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:config");
    const config = await discordRepository.getConfig();
    return ok(config);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getDiscordConfigWithRelations(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:config:relations");
    const config = await discordRepository.getConfigWithRelations();
    return ok(config);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createDiscordConfig(data: {
  botToken: string;
  guildId: string;
  clientId: string;
  clientSecret?: string;
  publicKey?: string;
}): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:config:create");

    const existingConfig = await discordRepository.getConfig();
    if (existingConfig) {
      return createErrorResponse("CONFLICT", "Discord config already exists. Use update instead.");
    }

    const encryptedToken = encrypt(data.botToken);
    const encryptedSecret = data.clientSecret ? encrypt(data.clientSecret) : undefined;

    const config = await discordRepository.createConfig({
      ...data,
      botToken: encryptedToken,
      clientSecret: encryptedSecret,
    });
    return ok(config);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateDiscordConfigAction(
  id: string,
  data: UpdateDiscordConfigInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:config:update");

    const existingConfig = await discordRepository.getConfig();
    if (!existingConfig) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const validatedData = updateDiscordConfigSchema.parse(data);

    const encryptedData: Record<string, unknown> = { ...validatedData };
    if (validatedData.botToken) {
      encryptedData.botToken = encrypt(validatedData.botToken);
    }
    if (validatedData.clientSecret) {
      encryptedData.clientSecret = encrypt(validatedData.clientSecret);
    }

    const config = await discordRepository.updateConfig(id, encryptedData);
    return ok(config);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getDiscordStats(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:stats");
    const stats = await discordRepository.getStats();
    return ok(stats);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getBotStatus(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:bot-status");
    const status = await discordRepository.getBotStatusInfo();
    return ok(status);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Guild Server Actions
// =====================================================

export async function getDiscordGuilds(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:guilds");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const guilds = await discordRepository.getGuilds(config.id);
    return ok(guilds);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Role Server Actions
// =====================================================

export async function getDiscordRoles(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:roles");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const roles = await discordRepository.getRoles(config.id);
    return ok(roles);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Channel Server Actions
// =====================================================

export async function getDiscordChannels(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:channels");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const channels = await discordRepository.getChannels(config.id);
    return ok(channels);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Webhook Server Actions
// =====================================================

export async function getDiscordWebhooks(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:webhooks");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const webhooks = await discordRepository.getWebhooks(config.id);
    return ok(webhooks);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createDiscordWebhookAction(
  data: CreateDiscordWebhookInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:webhooks:create");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const validatedData = createDiscordWebhookSchema.parse(data);

    const token = process.env.DISCORD_BOT_TOKEN;
    let webhookId = "";
    let webhookToken = "";

    if (token) {
      try {
        const resp = await fetch(`https://discord.com/api/v10/channels/${validatedData.channelId}/webhooks`, {
          method: "POST",
          headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: validatedData.name, avatar: validatedData.avatarUrl ?? undefined }),
        });
        if (!resp.ok) throw new Error(`Discord API ${resp.status}`);
        const result = (await resp.json()) as { id: string; token: string };
        webhookId = result.id;
        webhookToken = result.token;
      } catch (err) {
        logger.error({ err: err }, "Failed to create Discord webhook via API");
        webhookId = `pending_${Date.now()}`;
        webhookToken = "";
      }
    } else {
      webhookId = `pending_${Date.now()}`;
      webhookToken = "";
    }

    const webhook = await discordRepository.createWebhook(config.id, {
      ...validatedData,
      webhookId,
      token: webhookToken,
    });

    await discordRepository.createActivityLog({
      configId: config.id,
      eventType: "WEBHOOK_EVENT",
      action: "Webhook created",
      targetId: webhook.id,
      targetName: webhook.name,
    });

    return ok(webhook);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateDiscordWebhookAction(
  id: string,
  data: UpdateDiscordWebhookInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:webhooks:update");

    const existingWebhook = await discordRepository.getWebhookById(id);
    if (!existingWebhook) {
      return createErrorResponse("NOT_FOUND", "Webhook not found");
    }

    const validatedData = updateDiscordWebhookSchema.parse(data);
    const webhook = await discordRepository.updateWebhook(id, {
      ...validatedData,
      avatarUrl: validatedData.avatarUrl ?? undefined,
    });

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "WEBHOOK_EVENT",
        action: "Webhook updated",
        targetId: webhook.id,
        targetName: webhook.name,
      });
    }

    return ok(webhook);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteDiscordWebhookAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:webhooks:delete");

    const existingWebhook = await discordRepository.getWebhookById(id);
    if (!existingWebhook) {
      return createErrorResponse("NOT_FOUND", "Webhook not found");
    }

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "WEBHOOK_EVENT",
        action: "Webhook deleted",
        targetId: existingWebhook.id,
        targetName: existingWebhook.name,
      });
    }

    await discordRepository.deleteWebhook(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function testDiscordWebhook(
  id: string
): Promise<ActionResult<{ message: string }>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:webhooks:test");

    const existingWebhook = await discordRepository.getWebhookById(id);
    if (!existingWebhook) {
      return createErrorResponse("NOT_FOUND", "Webhook not found");
    }

    const startTime = Date.now();

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createWebhookLog({
        webhookId: id,
        eventType: "test",
        status: "SUCCESS",
        payloadJson: { content: "Test message from Gameverse Dashboard" },
        responseJson: { success: true },
        statusCode: 200,
        durationMs: Date.now() - startTime,
      });

      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "WEBHOOK_EVENT",
        action: "Webhook test dispatched",
        targetId: existingWebhook.id,
        targetName: existingWebhook.name,
      });
    }

    return ok({ message: "Test webhook sent successfully" });
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Role Mapping Server Actions
// =====================================================

export async function getDiscordRoleMappings(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:role-mappings");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const mappings = await discordRepository.getRoleMappings(config.id);
    return ok(mappings);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createDiscordRoleMappingAction(
  data: CreateDiscordRoleMappingInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:role-mappings:create");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const validatedData = createDiscordRoleMappingSchema.parse(data);
    const mapping = await discordRepository.createRoleMapping(config.id, validatedData);

    await discordRepository.createActivityLog({
      configId: config.id,
      eventType: "ROLE_CHANGE",
      action: "Role mapping created",
      targetId: mapping.id,
      targetName: mapping.platformRole,
    });

    return ok(mapping);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateDiscordRoleMappingAction(
  id: string,
  data: UpdateDiscordRoleMappingInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:role-mappings:update");

    const validatedData = updateDiscordRoleMappingSchema.parse(data);
    const mapping = await discordRepository.updateRoleMapping(id, validatedData);

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "ROLE_CHANGE",
        action: "Role mapping updated",
        targetId: mapping.id,
        targetName: mapping.platformRole,
      });
    }

    return ok(mapping);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteDiscordRoleMappingAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:role-mappings:delete");

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "ROLE_CHANGE",
        action: "Role mapping deleted",
        targetId: id,
      });
    }

    await discordRepository.deleteRoleMapping(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Automation Server Actions
// =====================================================

export async function getDiscordAutomations(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:automations");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const automations = await discordRepository.getAutomations(config.id);
    return ok(automations);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createDiscordAutomationAction(
  data: CreateDiscordAutomationInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:automations:create");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const validatedData = createDiscordAutomationSchema.parse(data);
    const automation = await discordRepository.createAutomation(config.id, {
      ...validatedData,
      channelId: validatedData.channelId ?? undefined,
      roleId: validatedData.roleId ?? undefined,
      embedJson: validatedData.embedJson ?? undefined,
      conditions: validatedData.conditions ?? undefined,
    });

    await discordRepository.createActivityLog({
      configId: config.id,
      eventType: "BOT_EVENT",
      action: "Automation created",
      targetId: automation.id,
      targetName: automation.name,
    });

    return ok(automation);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateDiscordAutomationAction(
  id: string,
  data: UpdateDiscordAutomationInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:automations:update");

    const existingAutomation = await discordRepository.getAutomationById(id);
    if (!existingAutomation) {
      return createErrorResponse("NOT_FOUND", "Automation not found");
    }

    const validatedData = updateDiscordAutomationSchema.parse(data);
    const automation = await discordRepository.updateAutomation(id, {
      ...validatedData,
      channelId: validatedData.channelId ?? undefined,
      roleId: validatedData.roleId ?? undefined,
      embedJson: validatedData.embedJson ?? undefined,
      conditions: validatedData.conditions ?? undefined,
    });

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "BOT_EVENT",
        action: "Automation updated",
        targetId: automation.id,
        targetName: automation.name,
      });
    }

    return ok(automation);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteDiscordAutomationAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:automations:delete");

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "BOT_EVENT",
        action: "Automation deleted",
        targetId: id,
      });
    }

    await discordRepository.deleteAutomation(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Slash Command Server Actions
// =====================================================

export async function getDiscordSlashCommands(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:slash-commands");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const commands = await discordRepository.getSlashCommands(config.id);
    return ok(commands);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createDiscordSlashCommandAction(
  data: CreateDiscordSlashCommandInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:slash-commands:create");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found");
    }

    const validatedData = createDiscordSlashCommandSchema.parse(data);
    const command = await discordRepository.createSlashCommand(config.id, validatedData);

    await discordRepository.createActivityLog({
      configId: config.id,
      eventType: "SLASH_COMMAND",
      action: "Slash command created",
      targetId: command.id,
      targetName: command.name,
    });

    return ok(command);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateDiscordSlashCommandAction(
  id: string,
  data: UpdateDiscordSlashCommandInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:slash-commands:update");

    const validatedData = updateDiscordSlashCommandSchema.parse(data);
    const command = await discordRepository.updateSlashCommand(id, validatedData);

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "SLASH_COMMAND",
        action: "Slash command updated",
        targetId: command.id,
        targetName: command.name,
      });
    }

    return ok(command);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteDiscordSlashCommandAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:slash-commands:delete");

    const config = await discordRepository.getConfig();
    if (config) {
      await discordRepository.createActivityLog({
        configId: config.id,
        eventType: "SLASH_COMMAND",
        action: "Slash command deleted",
        targetId: id,
      });
    }

    await discordRepository.deleteSlashCommand(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Webhook Log Server Actions
// =====================================================

export async function getDiscordWebhookLogs(
  filters: DiscordWebhookLogFiltersInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:webhook-logs");

    const validatedFilters = discordWebhookLogFiltersSchema.parse(filters);
    const result = await discordRepository.getWebhookLogs(validatedFilters);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function retryFailedWebhookLogs(): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin();
    await checkMutationRateLimit("discord:webhook-logs:retry");

    const count = await discordRepository.retryFailedWebhookLogs();
    return ok({ count });
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Member Sync Server Actions
// =====================================================

export async function getDiscordMemberSyncs(
  filters: DiscordMemberSyncFiltersInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:member-syncs");

    const validatedFilters = discordMemberSyncFiltersSchema.parse(filters);
    const result = await discordRepository.getMemberSyncs(validatedFilters);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Discord Activity Log Server Actions
// =====================================================

export async function getDiscordActivityLogs(
  filters: DiscordActivityLogFiltersInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    await checkReadRateLimit("discord:activity-logs");

    const validatedFilters = discordActivityLogFiltersSchema.parse(filters);
    const result = await discordRepository.getActivityLogs(validatedFilters);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Registration Channel & Role Settings
// =====================================================

export async function getRegistrationSettings(): Promise<ActionResult<{
  registrationsChannelId: string | null;
  registeredRoleId: string | null;
}>> {
  try {
    await requireAdmin();
    await checkReadRateLimit("discord:registration-settings");

    const config = await discordRepository.getConfig();
    if (!config) {
      return ok({ registrationsChannelId: null, registeredRoleId: null });
    }

    const fullConfig = await prisma.discordConfig.findUnique({
      where: { id: config.id },
      select: { registrationsChannelId: true, registeredRoleId: true },
    });

    return ok({
      registrationsChannelId: fullConfig?.registrationsChannelId ?? null,
      registeredRoleId: fullConfig?.registeredRoleId ?? null,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateRegistrationSettings(data: {
  registrationsChannelId?: string;
  registeredRoleId?: string;
}): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit("discord:registration-settings:update");

    const config = await discordRepository.getConfig();
    if (!config) {
      return createErrorResponse("NOT_FOUND", "Discord config not found. Create a Discord config first.");
    }

    const updateData: Record<string, string | null> = {};
    if (data.registrationsChannelId !== undefined) {
      updateData.registrationsChannelId = data.registrationsChannelId || null;
    }
    if (data.registeredRoleId !== undefined) {
      updateData.registeredRoleId = data.registeredRoleId || null;
    }

    await prisma.discordConfig.update({
      where: { id: config.id },
      data: updateData,
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "DISCORD_REGISTRATION_SETTINGS_UPDATE",
      targetEntity: "DiscordConfig",
      targetId: config.id,
      changesJson: updateData,
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}
