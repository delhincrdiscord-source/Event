"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@gameverse/database";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";

export interface ParticipantEvent {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  startDate: Date;
  endDate: Date;
  bannerUrl: string | null;
  thumbnailUrl: string | null;
  location: string | null;
  category: string | null;
  categoryEmoji: string | null;
  categoryColor: string | null;
  status: string;
  capacity: number | null;
  currentParticipants: number;
  isRegistered: boolean;
  registrationEnabled: boolean;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  festivalName: string | null;
  festivalId: string | null;
  discordVoiceChannelId: string | null;
  discordStageChannelId: string | null;
  waitlistEnabled: boolean;
}

export interface EventDetail extends ParticipantEvent {
  festival: {
    id: string;
    name: string;
    discordInvite: string | null;
  } | null;
}

export interface ParticipantEventsResult {
  events: ParticipantEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getParticipantEvents(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  festivalId?: string;
  categoryId?: string;
  status?: string;
  tab?: "upcoming" | "live" | "completed" | "registered";
  sortBy?: "date" | "title" | "participants";
  sortDir?: "asc" | "desc";
}): Promise<ActionResult<ParticipantEventsResult>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 12;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    // Build status filter based on tab
    let statusFilter: string[] = ["PUBLISHED", "LIVE", "COMPLETED"];
    if (options?.tab === "upcoming") statusFilter = ["PUBLISHED"];
    else if (options?.tab === "live") statusFilter = ["LIVE"];
    else if (options?.tab === "completed") statusFilter = ["COMPLETED"];

    // Build where clause
    const where: Record<string, unknown> = {
      isDeleted: false,
      status: { in: statusFilter },
    };

    if (options?.festivalId) where.festivalId = options.festivalId;
    if (options?.categoryId) where.categoryId = options.categoryId;

    if (options?.search) {
      const q = options.search;
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { festival: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Sort
    let orderBy: Record<string, string> = { startDate: "asc" };
    if (options?.sortBy === "title") orderBy = { title: options.sortDir ?? "asc" };
    else if (options?.sortBy === "participants") orderBy = { startDate: options.sortDir ?? "asc" };
    else orderBy = { startDate: options?.sortDir ?? "asc" };

    const [events, total, userRegistrations] = await Promise.all([
      prisma.communityEvent.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          startDate: true,
          endDate: true,
          bannerUrl: true,
          thumbnailUrl: true,
          location: true,
          status: true,
          capacity: true,
          registrationEnabled: true,
          registrationStart: true,
          registrationEnd: true,
          waitlistEnabled: true,
          discordVoiceChannelId: true,
          discordStageChannelId: true,
          festivalId: true,
          category: { select: { name: true, emoji: true, color: true } },
          festival: { select: { id: true, name: true } },
          _count: {
            select: {
              registrations: { where: { isDeleted: false } },
            },
          },
        },
      }),
      prisma.communityEvent.count({ where }),
      prisma.registration.findMany({
        where: { userId, isDeleted: false },
        select: { eventId: true },
      }),
    ]);

    const registeredEventIds = new Set(
      userRegistrations
        .map((r: { eventId: string | null }) => r.eventId)
        .filter(Boolean) as string[]
    );

    // If tab is "registered", filter to only registered events
    let mappedEvents = events.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      shortDescription: e.shortDescription,
      fullDescription: e.fullDescription,
      startDate: e.startDate,
      endDate: e.endDate,
      bannerUrl: e.bannerUrl,
      thumbnailUrl: e.thumbnailUrl,
      location: e.location,
      category: e.category?.name ?? null,
      categoryEmoji: e.category?.emoji ?? null,
      categoryColor: e.category?.color ?? null,
      status: e.status,
      capacity: e.capacity,
      currentParticipants: e._count.registrations,
      isRegistered: registeredEventIds.has(e.id),
      registrationEnabled: e.registrationEnabled,
      registrationStart: e.registrationStart,
      registrationEnd: e.registrationEnd,
      festivalName: e.festival?.name ?? null,
      festivalId: e.festivalId,
      discordVoiceChannelId: e.discordVoiceChannelId,
      discordStageChannelId: e.discordStageChannelId,
      waitlistEnabled: e.waitlistEnabled,
    }));

    if (options?.tab === "registered") {
      mappedEvents = mappedEvents.filter((e) => e.isRegistered);
    }

    return ok({ events: mappedEvents, total, page, pageSize });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getEventDetail(eventId: string): Promise<ActionResult<EventDetail>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const [event, userReg] = await Promise.all([
      prisma.communityEvent.findFirst({
        where: { id: eventId, isDeleted: false },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          startDate: true,
          endDate: true,
          bannerUrl: true,
          thumbnailUrl: true,
          location: true,
          status: true,
          capacity: true,
          registrationEnabled: true,
          registrationStart: true,
          registrationEnd: true,
          waitlistEnabled: true,
          discordVoiceChannelId: true,
          discordStageChannelId: true,
          festivalId: true,
          category: { select: { name: true, emoji: true, color: true } },
          festival: { select: { id: true, name: true, discordInvite: true } },
          _count: {
            select: {
              registrations: { where: { isDeleted: false } },
            },
          },
        },
      }),
      prisma.registration.findFirst({
        where: { userId, eventId, isDeleted: false },
        select: { id: true },
      }),
    ]);

    if (!event) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }

    return ok({
      id: event.id,
      title: event.title,
      slug: event.slug,
      shortDescription: event.shortDescription,
      fullDescription: event.fullDescription,
      startDate: event.startDate,
      endDate: event.endDate,
      bannerUrl: event.bannerUrl,
      thumbnailUrl: event.thumbnailUrl,
      location: event.location,
      category: event.category?.name ?? null,
      categoryEmoji: event.category?.emoji ?? null,
      categoryColor: event.category?.color ?? null,
      status: event.status,
      capacity: event.capacity,
      currentParticipants: event._count.registrations,
      isRegistered: !!userReg,
      registrationEnabled: event.registrationEnabled,
      registrationStart: event.registrationStart,
      registrationEnd: event.registrationEnd,
      festivalName: event.festival?.name ?? null,
      festivalId: event.festivalId,
      discordVoiceChannelId: event.discordVoiceChannelId,
      discordStageChannelId: event.discordStageChannelId,
      waitlistEnabled: event.waitlistEnabled,
      festival: event.festival
        ? {
            id: event.festival.id,
            name: event.festival.name,
            discordInvite: event.festival.discordInvite,
          }
        : null,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getFestivals(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  try {
    await requireAuth();
    const festivals = await prisma.festival.findMany({
      where: { isDeleted: false, isActive: true },
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    });
    return ok(festivals);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getEventCategories(): Promise<ActionResult<Array<{ id: string; name: string; emoji: string | null }>>> {
  try {
    await requireAuth();
    const categories = await prisma.eventCategory.findMany({
      where: { isDeleted: false, isActive: true },
      select: { id: true, name: true, emoji: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(categories);
  } catch (error) {
    return handleActionError(error);
  }
}
