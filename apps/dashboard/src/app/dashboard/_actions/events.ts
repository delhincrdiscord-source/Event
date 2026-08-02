"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@gameverse/database";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";

export interface ParticipantEvent {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  startDate: Date;
  endDate: Date;
  bannerUrl: string | null;
  location: string | null;
  category: string | null;
  status: string;
  capacity: number | null;
  currentParticipants: number;
  isRegistered: boolean;
}

export async function getParticipantEvents(): Promise<ActionResult<ParticipantEvent[]>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const [events, userRegistrations] = await Promise.all([
      prisma.communityEvent.findMany({
        where: {
          isDeleted: false,
          status: { in: ["PUBLISHED", "LIVE"] },
        },
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          startDate: true,
          endDate: true,
          bannerUrl: true,
          location: true,
          status: true,
          capacity: true,
          category: { select: { name: true } },
          _count: {
            select: {
              registrations: {
                where: { isDeleted: false },
              },
            },
          },
        },
      }),
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

    return ok(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        shortDescription: e.shortDescription,
        startDate: e.startDate,
        endDate: e.endDate,
        bannerUrl: e.bannerUrl,
        location: e.location,
        category: e.category?.name ?? null,
        status: e.status,
        capacity: e.capacity,
        currentParticipants: e._count.registrations,
        isRegistered: registeredEventIds.has(e.id),
      }))
    );
  } catch (error) {
    return handleActionError(error);
  }
}
