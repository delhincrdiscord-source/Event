import { prisma } from "@gameverse/database";
import type {
  Notification,
  NotificationListItem,
  NotificationWithRelations,
  NotificationFilters,
  PaginatedNotifications,
  NotificationStats,
  CreateNotificationInput,
  NotificationQueueItem,
  NotificationChannel,
  DeliveryStatus,
} from "@gameverse/types";

// =====================================================
// Notification Repository
// =====================================================

export class NotificationRepository {
  async findById(id: string): Promise<Notification | null> {
    return (await prisma.notification.findFirst({
      where: { id },
    })) as unknown as Notification | null;
  }

  async findByIdWithRelations(
    id: string
  ): Promise<NotificationWithRelations | null> {
    return (await prisma.notification.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        deliveries: {
          orderBy: { createdAt: "desc" },
        },
      },
    })) as unknown as NotificationWithRelations | null;
  }

  async findMany(
    filters: NotificationFilters
  ): Promise<PaginatedNotifications> {
    const {
      search,
      type,
      isRead,
      isArchived,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      perPage = 20,
    } = filters;

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { message: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
      ...(isArchived !== undefined && { isArchived }),
      ...(dateFrom && {
        createdAt: { gte: new Date(dateFrom) },
      }),
      ...(dateTo && {
        createdAt: { lte: new Date(dateTo) },
      }),
    };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { ...where, isRead: false },
      }),
    ]);

    return {
      notifications: notifications as NotificationListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      unreadCount,
    };
  }

  async findByUser(
    userId: string,
    filters: Omit<NotificationFilters, "search"> = {}
  ): Promise<PaginatedNotifications> {
    const {
      type,
      isRead,
      isArchived,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      perPage = 20,
    } = filters;

    const where = {
      userId,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
      ...(isArchived !== undefined && { isArchived }),
    };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications as NotificationListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      unreadCount,
    };
  }

  async getStats(userId?: string): Promise<NotificationStats> {
    const baseWhere = userId ? { userId } : {};

    const [
      total,
      unread,
      archived,
      byType,
    ] = await Promise.all([
      prisma.notification.count({ where: baseWhere }),
      prisma.notification.count({
        where: { ...baseWhere, isRead: false },
      }),
      prisma.notification.count({
        where: { ...baseWhere, isArchived: true },
      }),
      prisma.notification.groupBy({
        by: ["type"],
        where: baseWhere,
        _count: true,
      }),
    ]);

    const typeCounts = byType.reduce(
      (acc, item) => {
        acc[item.type as keyof typeof acc] = item._count;
        return acc;
      },
      {
        SYSTEM: 0,
        ANNOUNCEMENT: 0,
        REGISTRATION: 0,
        APPROVAL: 0,
        REMINDER: 0,
        FESTIVAL: 0,
        EVENT: 0,
        CUSTOM: 0,
      }
    );

    return {
      totalNotifications: total,
      unreadNotifications: unread,
      readNotifications: total - unread,
      archivedNotifications: archived,
      byType: typeCounts,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    return (await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: (data.metadata ?? {}) as never,
      },
    })) as unknown as Notification;
  }

  async createMany(
    data: CreateNotificationInput[]
  ): Promise<{ count: number }> {
    return prisma.notification.createMany({
      data: data.map((item) => ({
        userId: item.userId,
        type: item.type,
        title: item.title,
        message: item.message,
        link: item.link ?? null,
        metadata: (item.metadata ?? {}) as never,
      })),
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return (await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })) as unknown as Notification;
  }

  async markAsUnread(id: string): Promise<Notification> {
    return (await prisma.notification.update({
      where: { id },
      data: {
        isRead: false,
        readAt: null,
      },
    })) as unknown as Notification;
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async archive(id: string): Promise<Notification> {
    return (await prisma.notification.update({
      where: { id },
      data: { isArchived: true },
    })) as unknown as Notification;
  }

  async bulkArchive(ids: string[]): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { isArchived: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.notification.delete({
      where: { id },
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await prisma.notification.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async createDelivery(
    notificationId: string,
    channel: NotificationChannel,
    announcementId?: string
  ): Promise<void> {
    await prisma.notificationDelivery.create({
      data: {
        notificationId,
        announcementId,
        channel,
        status: "PENDING",
      },
    });
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status };

    if (status === "SENT") {
      updateData.sentAt = new Date();
    } else if (status === "FAILED") {
      updateData.failedAt = new Date();
      updateData.errorMessage = errorMessage;
    }

    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: updateData,
    });
  }

  async getQueue(filters: {
    status?: DeliveryStatus;
    channel?: NotificationChannel;
    page?: number;
    perPage?: number;
  }): Promise<{ items: NotificationQueueItem[]; total: number }> {
    const { status, channel, page = 1, perPage = 20 } = filters;

    const where = {
      ...(status && { status }),
      ...(channel && { channel }),
    };

    const [items, total] = await Promise.all([
      prisma.notificationDelivery.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              message: true,
              userId: true,
              user: {
                select: {
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.notificationDelivery.count({ where }),
    ]);

    return {
      items: items as NotificationQueueItem[],
      total,
    };
  }

  async retryFailed(deliveryId: string): Promise<void> {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "RETRYING",
        retryCount: { increment: 1 },
      },
    });
  }

  async deleteAllUserNotifications(userId: string): Promise<{ count: number }> {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  }
}

export const notificationRepository = new NotificationRepository();
