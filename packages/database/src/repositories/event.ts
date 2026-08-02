import { prisma } from "@gameverse/database";
import type {
  CommunityEvent,
  CommunityEventListItem,
  CommunityEventWithRelations,
  EventFilters,
  PaginatedEvents,
  EventStats,
  CreateEventInput,
  UpdateEventInput,
  CalendarEvent,
  ConflictCheck,
} from "@gameverse/types";

// =====================================================
// Event Repository
// =====================================================

export class EventRepository {
  async findById(id: string): Promise<CommunityEvent | null> {
    return prisma.communityEvent.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async findByIdWithRelations(
    id: string
  ): Promise<CommunityEventWithRelations | null> {
    return prisma.communityEvent.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            emoji: true,
            color: true,
          },
        },
        festival: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<CommunityEventWithRelations | null> {
    return prisma.communityEvent.findFirst({
      where: {
        slug,
        isDeleted: false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            emoji: true,
            color: true,
          },
        },
        festival: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });
  }

  async findMany(filters: EventFilters): Promise<PaginatedEvents> {
    const {
      search,
      festivalId,
      categoryId,
      status,
      visibility,
      isFeatured,
      startDateFrom,
      startDateTo,
      sortBy = "startDate",
      sortOrder = "desc",
      page = 1,
      perPage = 10,
    } = filters;

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { shortDescription: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(festivalId && { festivalId }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...(visibility && { visibility }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(startDateFrom || startDateTo
        ? {
            startDate: {
              ...(startDateFrom && { gte: new Date(startDateFrom) }),
              ...(startDateTo && { lte: new Date(startDateTo) }),
            },
          }
        : {}),
    };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [events, total] = await Promise.all([
      prisma.communityEvent.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              emoji: true,
              color: true,
            },
          },
          festival: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              rsvps: true,
            },
          },
        },
      }),
      prisma.communityEvent.count({ where }),
    ]);

    return {
      events: events as CommunityEventListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findUpcoming(limit: number = 5): Promise<CommunityEventListItem[]> {
    return prisma.communityEvent.findMany({
      where: {
        isDeleted: false,
        status: { in: ["PUBLISHED", "LIVE"] },
        startDate: { gte: new Date() },
      },
      orderBy: {
        startDate: "asc",
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            emoji: true,
            color: true,
          },
        },
        festival: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });
  }

  async findPast(limit: number = 5): Promise<CommunityEventListItem[]> {
    return prisma.communityEvent.findMany({
      where: {
        isDeleted: false,
        status: { in: ["COMPLETED", "CANCELLED"] },
        endDate: { lt: new Date() },
      },
      orderBy: {
        endDate: "desc",
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            emoji: true,
            color: true,
          },
        },
        festival: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });
  }

  async getCalendarEvents(
    startDate: Date,
    endDate: Date,
    festivalId?: string
  ): Promise<CalendarEvent[]> {
    const where = {
      isDeleted: false,
      status: { not: "CANCELLED" as const },
      startDate: { gte: startDate },
      endDate: { lte: endDate },
      ...(festivalId && { festivalId }),
    };

    const events = await prisma.communityEvent.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            emoji: true,
            color: true,
          },
        },
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      color: event.category.color,
      status: event.status,
      categoryId: event.categoryId,
      categoryName: event.category.name,
      categoryEmoji: event.category.emoji,
    }));
  }

  async getStats(festivalId?: string): Promise<EventStats> {
    const baseWhere = {
      isDeleted: false,
      ...(festivalId && { festivalId }),
    };

    const [total, draft, published, live, completed, cancelled, archived] =
      await Promise.all([
        prisma.communityEvent.count({ where: baseWhere }),
        prisma.communityEvent.count({
          where: { ...baseWhere, status: "DRAFT" },
        }),
        prisma.communityEvent.count({
          where: { ...baseWhere, status: "PUBLISHED" },
        }),
        prisma.communityEvent.count({
          where: { ...baseWhere, status: "LIVE" },
        }),
        prisma.communityEvent.count({
          where: { ...baseWhere, status: "COMPLETED" },
        }),
        prisma.communityEvent.count({
          where: { ...baseWhere, status: "CANCELLED" },
        }),
        prisma.communityEvent.count({
          where: { ...baseWhere, status: "ARCHIVED" },
        }),
      ]);

    return {
      totalEvents: total,
      draftEvents: draft,
      publishedEvents: published,
      liveEvents: live,
      completedEvents: completed,
      cancelledEvents: cancelled,
      archivedEvents: archived,
    };
  }

  async checkConflict(
    startDate: Date,
    endDate: Date,
    channelId: string,
    channelType: "voice" | "stage",
    excludeEventId?: string
  ): Promise<ConflictCheck> {
    const channelField =
      channelType === "voice" ?"discordVoiceChannelId" :"discordStageChannelId";

    const conflictingEvents = await prisma.communityEvent.findMany({
      where: {
        isDeleted: false,
        status: { not: "CANCELLED" },
        [channelField]: channelId,
        id: excludeEventId ? { not: excludeEventId } : undefined,
        OR: [
          {
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    });

    return {
      hasConflict: conflictingEvents.length > 0,
      conflictingEvents: conflictingEvents.map((e: { id: string; title: string; startDate: Date; endDate: Date }) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        channelType,
        channelId,
      })),
    };
  }

  async create(
    data: CreateEventInput,
    userId?: string
  ): Promise<CommunityEvent> {
    return prisma.communityEvent.create({
      data: {
        festivalId: data.festivalId,
        categoryId: data.categoryId,
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        bannerUrl: data.bannerUrl,
        thumbnailUrl: data.thumbnailUrl,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        timezone: data.timezone ?? "Asia/Kolkata",
        location: data.location,
        discordVoiceChannelId: data.discordVoiceChannelId,
        discordStageChannelId: data.discordStageChannelId,
        capacity: data.capacity,
        waitlistEnabled: data.waitlistEnabled ?? false,
        registrationEnabled: data.registrationEnabled ?? false,
        registrationStart: data.registrationStart
          ? new Date(data.registrationStart)
          : null,
        registrationEnd: data.registrationEnd
          ? new Date(data.registrationEnd)
          : null,
        visibility: data.visibility ?? "PUBLIC",
        isFeatured: data.isFeatured ?? false,
        status: "DRAFT",
        createdBy: userId,
      },
    });
  }

  async update(
    id: string,
    data: UpdateEventInput
  ): Promise<CommunityEvent> {
    const updateData: Record<string, unknown> = {};

    if (data.festivalId !== undefined) updateData.festivalId = data.festivalId;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.shortDescription !== undefined)
      updateData.shortDescription = data.shortDescription;
    if (data.fullDescription !== undefined)
      updateData.fullDescription = data.fullDescription;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.thumbnailUrl !== undefined)
      updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined)
      updateData.endDate = new Date(data.endDate);
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.discordVoiceChannelId !== undefined)
      updateData.discordVoiceChannelId = data.discordVoiceChannelId;
    if (data.discordStageChannelId !== undefined)
      updateData.discordStageChannelId = data.discordStageChannelId;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.waitlistEnabled !== undefined)
      updateData.waitlistEnabled = data.waitlistEnabled;
    if (data.registrationEnabled !== undefined)
      updateData.registrationEnabled = data.registrationEnabled;
    if (data.registrationStart !== undefined)
      updateData.registrationStart = data.registrationStart
        ? new Date(data.registrationStart)
        : null;
    if (data.registrationEnd !== undefined)
      updateData.registrationEnd = data.registrationEnd
        ? new Date(data.registrationEnd)
        : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    return prisma.communityEvent.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.communityEvent.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async restore(id: string): Promise<void> {
    await prisma.communityEvent.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  async publish(id: string): Promise<void> {
    await prisma.communityEvent.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
  }

  async unpublish(id: string): Promise<void> {
    await prisma.communityEvent.update({
      where: { id },
      data: { status: "DRAFT" },
    });
  }

  async archive(id: string): Promise<void> {
    await prisma.communityEvent.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  async duplicate(
    id: string,
    data: { title: string; slug: string; startDate: string; endDate: string }
  ): Promise<CommunityEvent> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error("Event not found");
    }

    return prisma.communityEvent.create({
      data: {
        festivalId: original.festivalId,
        categoryId: original.categoryId,
        title: data.title,
        slug: data.slug,
        shortDescription: original.shortDescription,
        fullDescription: original.fullDescription,
        bannerUrl: original.bannerUrl,
        thumbnailUrl: original.thumbnailUrl,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        timezone: original.timezone,
        location: original.location,
        discordVoiceChannelId: original.discordVoiceChannelId,
        discordStageChannelId: original.discordStageChannelId,
        capacity: original.capacity,
        waitlistEnabled: original.waitlistEnabled,
        registrationEnabled: original.registrationEnabled,
        registrationStart: original.registrationStart,
        registrationEnd: original.registrationEnd,
        visibility: original.visibility,
        isFeatured: original.isFeatured,
        status: "DRAFT",
        createdBy: original.createdBy,
      },
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await prisma.communityEvent.updateMany({
      where: {
        id: { in: ids },
      },
      data: { isDeleted: true },
    });
  }

  async bulkPublish(ids: string[]): Promise<void> {
    await prisma.communityEvent.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status: "PUBLISHED" },
    });
  }

  async bulkArchive(ids: string[]): Promise<void> {
    await prisma.communityEvent.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status: "ARCHIVED" },
    });
  }

  async bulkUpdateStatus(
    ids: string[],
    status:
      | "DRAFT" |"PUBLISHED" |"LIVE" |"COMPLETED" |"CANCELLED" |"ARCHIVED"
  ): Promise<void> {
    await prisma.communityEvent.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status },
    });
  }
}

export const eventRepository = new EventRepository();
