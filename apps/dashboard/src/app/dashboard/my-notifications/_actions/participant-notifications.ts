"use server";

import { requireAuth } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { notificationRepository } from "@gameverse/database";
import type { NotificationType } from "@gameverse/types";

// =====================================================
// Participant Notification Server Actions
// =====================================================

export async function getParticipantNotifications(filters: {
  search?: string;
  type?: NotificationType;
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkReadRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const result = await notificationRepository.findByUser(session.userId, {
      type: filters.type,
      isRead: filters.isRead,
      isArchived: false,
      sortBy: filters.sortBy ?? "createdAt",
      sortOrder: filters.sortOrder ?? "desc",
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 20,
    });
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getParticipantNotificationStats(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkReadRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const stats = await notificationRepository.getStats(session.userId);

    // Count today's notifications
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await notificationRepository.findByUser(session.userId, {
      isArchived: false,
      page: 1,
      perPage: 1000,
    });
    const todayNotifications = todayCount.notifications.filter(
      (n) => new Date(n.createdAt) >= today
    ).length;

    return ok({ ...stats, todayNotifications });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getParticipantUnreadCount(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkReadRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const count = await notificationRepository.getUnreadCount(session.userId);
    return ok({ count });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function markParticipantNotificationRead(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const notification = await notificationRepository.findById(id);
    if (!notification || notification.userId !== session.userId) {
      return { success: false, error: "Notification not found", code: "NOT_FOUND" };
    }

    // Toggle read/unread
    if (notification.isRead) {
      await notificationRepository.markAsUnread(id);
    } else {
      await notificationRepository.markAsRead(id);
    }
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function markParticipantNotificationUnread(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const notification = await notificationRepository.findById(id);
    if (!notification || notification.userId !== session.userId) {
      return { success: false, error: "Notification not found", code: "NOT_FOUND" };
    }

    await notificationRepository.markAsUnread(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function markAllParticipantNotificationsRead(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
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

export async function deleteParticipantNotification(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const notification = await notificationRepository.findById(id);
    if (!notification || notification.userId !== session.userId) {
      return { success: false, error: "Notification not found", code: "NOT_FOUND" };
    }

    await notificationRepository.delete(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteAllReadParticipantNotifications(): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    // Get all read notifications for this user and delete them
    const readNotifications = await notificationRepository.findByUser(session.userId, {
      isRead: true,
      isArchived: false,
      page: 1,
      perPage: 1000,
    });

    if (readNotifications.notifications.length > 0) {
      await notificationRepository.bulkDelete(
        readNotifications.notifications.map((n) => n.id)
      );
    }

    return ok({ count: readNotifications.notifications.length });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCategoryParticipantNotifications(type: NotificationType): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkMutationRateLimit(`mutations:${session.userId}`);
    if (!allowed) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const categoryNotifications = await notificationRepository.findByUser(session.userId, {
      type,
      isArchived: false,
      page: 1,
      perPage: 1000,
    });

    if (categoryNotifications.notifications.length > 0) {
      await notificationRepository.bulkDelete(
        categoryNotifications.notifications.map((n) => n.id)
      );
    }

    return ok({ count: categoryNotifications.notifications.length });
  } catch (error) {
    return handleActionError(error);
  }
}
