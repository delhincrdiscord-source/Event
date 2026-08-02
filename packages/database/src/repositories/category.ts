import { prisma } from "@gameverse/database";
import type {
  EventCategory,
  EventCategoryListItem,
  CategoryFilters,
  PaginatedCategories,
  CategoryStats,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@gameverse/types";

// =====================================================
// Category Repository
// =====================================================

export class CategoryRepository {
  async findById(id: string): Promise<EventCategory | null> {
    return prisma.eventCategory.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async findBySlug(slug: string): Promise<EventCategory | null> {
    return prisma.eventCategory.findFirst({
      where: {
        slug,
        isDeleted: false,
      },
    });
  }

  async findMany(filters: CategoryFilters): Promise<PaginatedCategories> {
    const {
      search,
      isActive,
      sortBy = "sortOrder",
      sortOrder = "asc",
      page = 1,
      perPage = 10,
    } = filters;

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [categories, total] = await Promise.all([
      prisma.eventCategory.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          _count: {
            select: {
              events: true,
            },
          },
        },
      }),
      prisma.eventCategory.count({ where }),
    ]);

    return {
      categories: categories as EventCategoryListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findAll(): Promise<EventCategoryListItem[]> {
    return prisma.eventCategory.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });
  }

  async getStats(): Promise<CategoryStats> {
    const [total, active, inactive] = await Promise.all([
      prisma.eventCategory.count({ where: { isDeleted: false } }),
      prisma.eventCategory.count({
        where: { isDeleted: false, isActive: true },
      }),
      prisma.eventCategory.count({
        where: { isDeleted: false, isActive: false },
      }),
    ]);

    return {
      totalCategories: total,
      activeCategories: active,
      inactiveCategories: inactive,
    };
  }

  async create(data: CreateCategoryInput): Promise<EventCategory> {
    return prisma.eventCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        emoji: data.emoji,
        icon: data.icon,
        description: data.description,
        color: data.color ?? "#5865F2",
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, data: UpdateCategoryInput): Promise<EventCategory> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.emoji !== undefined) updateData.emoji = data.emoji;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.eventCategory.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.eventCategory.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async restore(id: string): Promise<void> {
    await prisma.eventCategory.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  async activate(id: string): Promise<void> {
    await prisma.eventCategory.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string): Promise<void> {
    await prisma.eventCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async duplicate(
    id: string,
    data: { name: string; slug: string }
  ): Promise<EventCategory> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error("Category not found");
    }

    return prisma.eventCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        emoji: original.emoji,
        icon: original.icon,
        description: original.description,
        color: original.color,
        sortOrder: original.sortOrder,
      },
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await prisma.eventCategory.updateMany({
      where: {
        id: { in: ids },
      },
      data: { isDeleted: true },
    });
  }

  async bulkActivate(ids: string[]): Promise<void> {
    await prisma.eventCategory.updateMany({
      where: {
        id: { in: ids },
      },
      data: { isActive: true },
    });
  }

  async bulkDeactivate(ids: string[]): Promise<void> {
    await prisma.eventCategory.updateMany({
      where: {
        id: { in: ids },
      },
      data: { isActive: false },
    });
  }

  async seedDefaults(): Promise<void> {
    const existingCount = await prisma.eventCategory.count({
      where: { isDeleted: false },
    });
    if (existingCount > 0) return;

    const defaults = [
      { name: "Gaming Night", slug: "gaming-night", emoji: "\uD83C\uDFAE", color: "#5865F2", sortOrder: 0 },
      { name: "Tournament", slug: "tournament", emoji: "\uD83C\uDFC6", color: "#FEE75C", sortOrder: 1 },
      { name: "Movie Night", slug: "movie-night", emoji: "\uD83C\uDFAC", color: "#EB459E", sortOrder: 2 },
      { name: "Voice Hangout", slug: "voice-hangout", emoji: "\uD83D\uDCAC", color: "#57F287", sortOrder: 3 },
      { name: "Community Meetup", slug: "community-meetup", emoji: "\uD83D\uDC65", color: "#ED4245", sortOrder: 4 },
      { name: "Giveaway", slug: "giveaway", emoji: "\uD83C\uDF81", color: "#FEE75C", sortOrder: 5 },
      { name: "Workshop", slug: "workshop", emoji: "\uD83D\uDCA1", color: "#5865F2", sortOrder: 6 },
      { name: "Stage Event", slug: "stage-event", emoji: "\uD83C\uDF9F", color: "#EB459E", sortOrder: 7 },
      { name: "Creative Contest", slug: "creative-contest", emoji: "\uD83C\uDFA8", color: "#57F287", sortOrder: 8 },
      { name: "Special Event", slug: "special-event", emoji: "\u2B50", color: "#FEE75C", sortOrder: 9 },
    ];

    await prisma.eventCategory.createMany({
      data: defaults,
    });
  }
}

export const categoryRepository = new CategoryRepository();
