import { prisma } from "@gameverse/database";
import type {
  Announcement,
  AnnouncementListItem,
  AnnouncementWithRelations,
  AnnouncementFilters,
  PaginatedAnnouncements,
  AnnouncementStats,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "@gameverse/types";

// =====================================================
// Announcement Repository
// =====================================================

export class AnnouncementRepository {
  async findById(id: string): Promise<Announcement | null> {
    return prisma.announcement.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async findBySlug(slug: string): Promise<Announcement | null> {
    return prisma.announcement.findFirst({
      where: {
        slug,
        isDeleted: false,
      },
    });
  }

  async findByIdWithRelations(
    id: string
  ): Promise<AnnouncementWithRelations | null> {
    return prisma.announcement.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            globalName: true,
          },
        },
        festival: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        deliveries: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async findMany(
    filters: AnnouncementFilters
  ): Promise<PaginatedAnnouncements> {
    const {
      search,
      status,
      priority,
      visibility,
      festivalId,
      authorId,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      perPage = 20,
    } = filters;

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { summary: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(visibility && { visibility }),
      ...(festivalId && { festivalId }),
      ...(authorId && { authorId }),
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

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
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
              deliveries: true,
            },
          },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return {
      announcements: announcements as AnnouncementListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getStats(festivalId?: string): Promise<AnnouncementStats> {
    const baseWhere = {
      isDeleted: false,
      ...(festivalId && { festivalId }),
    };

    const [
      total,
      draft,
      scheduled,
      published,
      archived,
      views,
    ] = await Promise.all([
      prisma.announcement.count({ where: baseWhere }),
      prisma.announcement.count({ where: { ...baseWhere, status: "DRAFT" } }),
      prisma.announcement.count({ where: { ...baseWhere, status: "SCHEDULED" } }),
      prisma.announcement.count({ where: { ...baseWhere, status: "PUBLISHED" } }),
      prisma.announcement.count({ where: { ...baseWhere, status: "ARCHIVED" } }),
      prisma.announcement.aggregate({
        where: baseWhere,
        _sum: { viewCount: true },
      }),
    ]);

    return {
      totalAnnouncements: total,
      draftAnnouncements: draft,
      scheduledAnnouncements: scheduled,
      publishedAnnouncements: published,
      archivedAnnouncements: archived,
      totalViews: views._sum.viewCount ?? 0,
    };
  }

  async create(data: CreateAnnouncementInput): Promise<Announcement> {
    return prisma.announcement.create({
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        bannerUrl: data.bannerUrl,
        authorId: data.authorId,
        festivalId: data.festivalId,
        priority: data.priority ?? "NORMAL",
        visibility: data.visibility ?? "PUBLIC",
        status: data.status ?? "DRAFT",
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expireAt: data.expireAt ? new Date(data.expireAt) : null,
        tags: data.tags ?? [],
        isPinned: data.isPinned ?? false,
      },
    });
  }

  async update(
    id: string,
    data: UpdateAnnouncementInput
  ): Promise<Announcement> {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.festivalId !== undefined) updateData.festivalId = data.festivalId;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.publishAt !== undefined)
      updateData.publishAt = data.publishAt ? new Date(data.publishAt) : null;
    if (data.expireAt !== undefined)
      updateData.expireAt = data.expireAt ? new Date(data.expireAt) : null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

    return prisma.announcement.update({
      where: { id },
      data: updateData,
    });
  }

  async findPinned(festivalId?: string): Promise<Announcement[]> {
    return prisma.announcement.findMany({
      where: {
        isPinned: true,
        isDeleted: false,
        ...(festivalId && { festivalId }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async publish(id: string): Promise<Announcement> {
    return prisma.announcement.update({
      where: { id },
      data: { status: "PUBLISHED", publishAt: new Date() },
    });
  }

  async unpublish(id: string): Promise<Announcement> {
    return prisma.announcement.update({
      where: { id },
      data: { status: "DRAFT" },
    });
  }

  async pin(id: string): Promise<Announcement> {
    return prisma.announcement.update({
      where: { id },
      data: { isPinned: true },
    });
  }

  async unpin(id: string): Promise<Announcement> {
    return prisma.announcement.update({
      where: { id },
      data: { isPinned: false },
    });
  }

  async archive(id: string): Promise<Announcement> {
    return prisma.announcement.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  async restore(id: string): Promise<void> {
    await prisma.announcement.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.announcement.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async duplicate(
    id: string,
    data: { title: string; slug: string }
  ): Promise<Announcement> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error("Announcement not found");
    }

    return prisma.announcement.create({
      data: {
        title: data.title,
        slug: data.slug,
        summary: original.summary,
        content: original.content,
        bannerUrl: original.bannerUrl,
        authorId: original.authorId,
        festivalId: original.festivalId,
        priority: original.priority,
        visibility: original.visibility,
        status: "DRAFT",
        tags: original.tags,
        isPinned: original.isPinned,
      },
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await prisma.announcement.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async bulkPublish(ids: string[]): Promise<void> {
    await prisma.announcement.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "PUBLISHED",
        publishAt: new Date(),
      },
    });
  }

  async bulkArchive(ids: string[]): Promise<void> {
    await prisma.announcement.updateMany({
      where: { id: { in: ids } },
      data: { status: "ARCHIVED" },
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await prisma.announcement.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted: true },
    });
  }

  async publishScheduled(): Promise<number> {
    const now = new Date();
    const result = await prisma.announcement.updateMany({
      where: {
        status: "SCHEDULED",
        publishAt: { lte: now },
        isDeleted: false,
      },
      data: {
        status: "PUBLISHED",
      },
    });
    return result.count;
  }

  async archiveExpired(): Promise<number> {
    const now = new Date();
    const result = await prisma.announcement.updateMany({
      where: {
        status: "PUBLISHED",
        expireAt: { lte: now },
        isDeleted: false,
      },
      data: {
        status: "ARCHIVED",
      },
    });
    return result.count;
  }
}

export const announcementRepository = new AnnouncementRepository();
