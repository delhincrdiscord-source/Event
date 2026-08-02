"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import {
  notificationRepository,
  announcementRepository,
} from "@gameverse/database";
import {
  createNotificationSchema,
  notificationFiltersSchema,
  bulkNotificationActionSchema,
  notificationQueueFiltersSchema,
} from "@gameverse/validation";
import type {
  CreateNotificationInput,
  NotificationFiltersInput,
  BulkNotificationActionInput,
  NotificationQueueFiltersInput,
} from "@gameverse/validation";

// =====================================================
// Notification Server Actions
// =====================================================

export async function getNotifications(
  filters: NotificationFiltersInput
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkReadRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const validatedFilters = notificationFiltersSchema.parse(filters);
    const result = await notificationRepository.findMany(validatedFilters);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getNotificationById(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    const { allowed } = await checkReadRateLimit("notifications");
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const notification = await notificationRepository.findByIdWithRelations(id);
    if (!notification) {
      return { success: false, error: "Notification not found", code: "NOT_FOUND" };
    }
    return ok(notification);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUserNotifications(
  filters: Partial<NotificationFiltersInput> = {}
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkReadRateLimit("notifications");
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const result = await notificationRepository.findByUser(session.userId, {
      page: 1,
      perPage: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...filters,
    });
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getNotificationStats(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkReadRateLimit("notifications");
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const stats = await notificationRepository.getStats(session.userId);
    return ok(stats);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUnreadCount(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkReadRateLimit("notifications");
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const count = await notificationRepository.getUnreadCount(session.userId);
    return ok({ count });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createNotification(
  data: CreateNotificationInput
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const validatedData = createNotificationSchema.parse(data);
    const notification = await notificationRepository.create({
      ...validatedData,
      link: validatedData.link ?? undefined,
      metadata: validatedData.metadata ?? undefined,
    });

    const channels = validatedData.channels ?? ["IN_APP"];
    for (const channel of channels) {
      await notificationRepository.createDelivery(notification.id, channel);
    }

    return ok(notification);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function markAsRead(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const existingNotification = await notificationRepository.findById(id);
    if (!existingNotification) {
      return { success: false, error: "Notification not found", code: "NOT_FOUND" };
    }

    await notificationRepository.markAsRead(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function markAllAsRead(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    await notificationRepository.markAllAsRead(session.userId);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveNotification(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const existingNotification = await notificationRepository.findById(id);
    if (!existingNotification) {
      return { success: false, error: "Notification not found", code: "NOT_FOUND" };
    }

    await notificationRepository.archive(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteNotification(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const existingNotification = await notificationRepository.findById(id);
    if (!existingNotification) {
      return { success: false, error: "Notification not found", code: "NOT_FOUND" };
    }

    await notificationRepository.delete(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkArchiveNotifications(
  data: BulkNotificationActionInput
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const validatedData = bulkNotificationActionSchema.parse(data);
    await notificationRepository.bulkArchive(validatedData.notificationIds);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDeleteNotifications(
  data: BulkNotificationActionInput
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const validatedData = bulkNotificationActionSchema.parse(data);
    await notificationRepository.bulkDelete(validatedData.notificationIds);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getNotificationQueue(
  filters: NotificationQueueFiltersInput
): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    const { allowed } = await checkReadRateLimit("notifications");
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const validatedFilters = notificationQueueFiltersSchema.parse(filters);
    const result = await notificationRepository.getQueue(validatedFilters);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function retryFailedDelivery(
  deliveryId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    await notificationRepository.retryFailed(deliveryId);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function publishScheduledAnnouncements(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const count = await announcementRepository.publishScheduled();
    return ok({ count });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveExpiredAnnouncements(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const count = await announcementRepository.archiveExpired();
    return ok({ count });
  } catch (error) {
    return handleActionError(error);
  }
}
