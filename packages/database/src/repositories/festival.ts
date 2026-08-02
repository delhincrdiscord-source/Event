import { prisma } from "@gameverse/database";
import type {
  Festival,
  FestivalListItem,
  FestivalFilters,
  PaginatedFestivals,
  FestivalStats,
  CreateFestivalInput,
  UpdateFestivalInput,
} from "@gameverse/types";

// =====================================================
// Festival Repository
// =====================================================

export class FestivalRepository {
  async findById(id: string): Promise<Festival | null> {
    return prisma.festival.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async findBySlug(slug: string): Promise<Festival | null> {
    return prisma.festival.findFirst({
      where: {
        slug,
        isDeleted: false,
      },
    });
  }

  async findMany(filters: FestivalFilters): Promise<PaginatedFestivals> {
    const {
      search,
      status,
      visibility,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      perPage = 10,
    } = filters;

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { shortDescription: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status }),
      ...(visibility && { visibility }),
      ...(isActive !== undefined && { isActive }),
    };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [festivals, total] = await Promise.all([
      prisma.festival.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          _count: {
            select: {
              events: true,
              registrations: true,
            },
          },
        },
      }),
      prisma.festival.count({ where }),
    ]);

    return {
      festivals: festivals as FestivalListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findAll(): Promise<FestivalListItem[]> {
    return prisma.festival.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        _count: {
          select: {
            events: true,
            registrations: true,
          },
        },
      },
    });
  }

  async getStats(): Promise<FestivalStats> {
    const [total, active, draft, upcoming, live, completed, archived] =
      await Promise.all([
        prisma.festival.count({ where: { isDeleted: false } }),
        prisma.festival.count({ where: { isDeleted: false, isActive: true } }),
        prisma.festival.count({ where: { isDeleted: false, status: "DRAFT" } }),
        prisma.festival.count({ where: { isDeleted: false, status: "UPCOMING" } }),
        prisma.festival.count({ where: { isDeleted: false, status: "LIVE" } }),
        prisma.festival.count({ where: { isDeleted: false, status: "COMPLETED" } }),
        prisma.festival.count({ where: { isDeleted: false, status: "ARCHIVED" } }),
      ]);

    return {
      totalFestivals: total,
      activeFestivals: active,
      draftFestivals: draft,
      upcomingFestivals: upcoming,
      liveFestivals: live,
      completedFestivals: completed,
      archivedFestivals: archived,
    };
  }

  async create(data: CreateFestivalInput, userId?: string): Promise<Festival> {
    return prisma.festival.create({
      data: {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        bannerUrl: data.bannerUrl,
        logoUrl: data.logoUrl,
        themeColor: data.themeColor ?? "#5865F2",
        discordInvite: data.discordInvite,
        registrationEnabled: data.registrationEnabled ?? false,
        registrationStart: data.registrationStart
          ? new Date(data.registrationStart)
          : null,
        registrationEnd: data.registrationEnd
          ? new Date(data.registrationEnd)
          : null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        timezone: data.timezone ?? "Asia/Kolkata",
        visibility: data.visibility ?? "PUBLIC",
        status: "DRAFT",
        createdBy: userId,
      },
    });
  }

  async update(id: string, data: UpdateFestivalInput): Promise<Festival> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.shortDescription !== undefined)
      updateData.shortDescription = data.shortDescription;
    if (data.fullDescription !== undefined)
      updateData.fullDescription = data.fullDescription;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
    if (data.discordInvite !== undefined)
      updateData.discordInvite = data.discordInvite;
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
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.festival.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.festival.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async restore(id: string): Promise<void> {
    await prisma.festival.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  async archive(id: string): Promise<void> {
    await prisma.festival.update({
      where: { id },
      data: { status: "ARCHIVED", isActive: false },
    });
  }

  async activate(id: string): Promise<void> {
    await prisma.festival.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string): Promise<void> {
    await prisma.festival.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async duplicate(
    id: string,
    data: { name: string; slug: string; startDate: string; endDate: string }
  ): Promise<Festival> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error("Festival not found");
    }

    return prisma.festival.create({
      data: {
        name: data.name,
        slug: data.slug,
        shortDescription: original.shortDescription,
        fullDescription: original.fullDescription,
        bannerUrl: original.bannerUrl,
        logoUrl: original.logoUrl,
        themeColor: original.themeColor,
        discordInvite: original.discordInvite,
        registrationEnabled: original.registrationEnabled,
        registrationStart: original.registrationStart,
        registrationEnd: original.registrationEnd,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        timezone: original.timezone,
        visibility: original.visibility,
        status: "DRAFT",
        createdBy: original.createdBy,
      },
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await prisma.festival.updateMany({
      where: {
        id: { in: ids },
      },
      data: { isDeleted: true },
    });
  }

  async bulkArchive(ids: string[]): Promise<void> {
    await prisma.festival.updateMany({
      where: {
        id: { in: ids },
      },
      data: { status: "ARCHIVED", isActive: false },
    });
  }

  async bulkUpdateStatus(
    ids: string[],
    status: "DRAFT" | "UPCOMING" | "LIVE" | "COMPLETED" | "ARCHIVED"
  ): Promise<void> {
    await prisma.festival.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status,
        isActive: status === "LIVE" || status === "UPCOMING",
      },
    });
  }
}

export const festivalRepository = new FestivalRepository();
