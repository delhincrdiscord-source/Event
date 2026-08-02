"use server";

import { requireAuth, requireAdmin, AuthError } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { eventRepository, festivalRepository } from "@gameverse/database";
import {
  createCommunityEventSchema,
  updateCommunityEventSchema,
  eventFiltersSchema,
  bulkEventActionSchema,
  duplicateEventSchema,
} from "@gameverse/validation";
import type { CreateEventInput, UpdateEventInput } from "@gameverse/types";
import type {
  EventFiltersInput,
  BulkEventActionInput,
  DuplicateEventInput,
} from "@gameverse/validation";

// =====================================================
// Community Event Server Actions
// =====================================================

export async function getEvents(
  filters: EventFiltersInput
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.findMany>>>> {
  try {
    await requireAuth();
    const validatedFilters = eventFiltersSchema.parse(filters);
    const result = await eventRepository.findMany(validatedFilters);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getEventById(
  id: string
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.findByIdWithRelations>>>> {
  try {
    await requireAuth();
    const event = await eventRepository.findByIdWithRelations(id);
    if (!event) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }
    return ok(event);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getEventBySlug(
  slug: string
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.findBySlug>>>> {
  try {
    await requireAuth();
    const event = await eventRepository.findBySlug(slug);
    if (!event) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }
    return ok(event);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getEventStats(
  festivalId?: string
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.getStats>>>> {
  try {
    await requireAuth();
    const stats = await eventRepository.getStats(festivalId);
    return ok(stats);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUpcomingEvents(
  limit?: number
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.findUpcoming>>>> {
  try {
    await requireAuth();
    const events = await eventRepository.findUpcoming(limit);
    return ok(events);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getPastEvents(
  limit?: number
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.findPast>>>> {
  try {
    await requireAuth();
    const events = await eventRepository.findPast(limit);
    return ok(events);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getCalendarEvents(
  startDate: string,
  endDate: string,
  festivalId?: string
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.getCalendarEvents>>>> {
  try {
    await requireAuth();
    const events = await eventRepository.getCalendarEvents(
      new Date(startDate),
      new Date(endDate),
      festivalId
    );
    return ok(events);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function checkEventConflict(
  startDate: string,
  endDate: string,
  channelId: string,
  channelType: "voice" | "stage",
  excludeEventId?: string
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.checkConflict>>>> {
  try {
    await requireAuth();
    const result = await eventRepository.checkConflict(
      new Date(startDate),
      new Date(endDate),
      channelId,
      channelType,
      excludeEventId
    );
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createEvent(
  data: CreateEventInput
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.create>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = createCommunityEventSchema.parse(data);

    const existingFestival = await festivalRepository.findById(
      validatedData.festivalId
    );
    if (!existingFestival) {
      return { success: false, error: "Festival not found", code: "NOT_FOUND" };
    }

    const existingSlug = await eventRepository.findBySlug(validatedData.slug);
    if (existingSlug) {
      return { success: false, error: "An event with this slug already exists", code: "CONFLICT" };
    }

    if (
      validatedData.discordVoiceChannelId &&
      validatedData.startDate &&
      validatedData.endDate
    ) {
      const conflict = await eventRepository.checkConflict(
        new Date(validatedData.startDate),
        new Date(validatedData.endDate),
        validatedData.discordVoiceChannelId,
        "voice"
      );
      if (conflict.hasConflict) {
        return {
          success: false,
          error: `Channel conflict with: ${conflict.conflictingEvents.map((e: { title: string }) => e.title).join(", ")}`,
          code: "CONFLICT",
        };
      }
    }

    const event = await eventRepository.create(validatedData);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_CREATE",
      targetEntity: "CommunityEvent",
      targetId: event.id,
      changesJson: { title: validatedData.title, slug: validatedData.slug },
    });
    return ok(event);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateEvent(
  id: string,
  data: UpdateEventInput
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.update>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingEvent = await eventRepository.findById(id);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }
    const validatedData = updateCommunityEventSchema.parse(data);
    if (validatedData.slug) {
      const existingSlug = await eventRepository.findBySlug(validatedData.slug);
      if (existingSlug && existingSlug.id !== id) {
        return { success: false, error: "An event with this slug already exists", code: "CONFLICT" };
      }
    }

    const startDate = validatedData.startDate ?? existingEvent.startDate.toISOString();
    const endDate = validatedData.endDate ?? existingEvent.endDate.toISOString();
    const voiceChannel =
      validatedData.discordVoiceChannelId ?? existingEvent.discordVoiceChannelId;

    if (voiceChannel) {
      const conflict = await eventRepository.checkConflict(
        new Date(startDate),
        new Date(endDate),
        voiceChannel,
        "voice",
        id
      );
      if (conflict.hasConflict) {
        return {
          success: false,
          error: `Channel conflict with: ${conflict.conflictingEvents.map((e: { title: string }) => e.title).join(", ")}`,
          code: "CONFLICT",
        };
      }
    }

    const event = await eventRepository.update(id, validatedData);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_UPDATE",
      targetEntity: "CommunityEvent",
      targetId: id,
      changesJson: validatedData,
    });
    return ok(event);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteEvent(
  id: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingEvent = await eventRepository.findById(id);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }
    await eventRepository.delete(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_DELETE",
      targetEntity: "CommunityEvent",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreEvent(
  id: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingEvent = await eventRepository.findById(id);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }
    await eventRepository.restore(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_RESTORE",
      targetEntity: "CommunityEvent",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function publishEvent(
  id: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingEvent = await eventRepository.findById(id);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }
    await eventRepository.publish(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_PUBLISH",
      targetEntity: "CommunityEvent",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function unpublishEvent(
  id: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingEvent = await eventRepository.findById(id);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }
    await eventRepository.unpublish(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_UNPUBLISH",
      targetEntity: "CommunityEvent",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveEvent(
  id: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingEvent = await eventRepository.findById(id);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }
    await eventRepository.archive(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_ARCHIVE",
      targetEntity: "CommunityEvent",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function duplicateEvent(
  data: DuplicateEventInput
): Promise<ActionResult<Awaited<ReturnType<typeof eventRepository.duplicate>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = duplicateEventSchema.parse(data);
    const existingSlug = await eventRepository.findBySlug(validatedData.slug);
    if (existingSlug) {
      return { success: false, error: "An event with this slug already exists", code: "CONFLICT" };
    }
    const event = await eventRepository.duplicate(validatedData.id, {
      title: validatedData.title,
      slug: validatedData.slug,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
    });
    return ok(event);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDeleteEvents(
  data: BulkEventActionInput
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = bulkEventActionSchema.parse(data);
    await eventRepository.bulkDelete(validatedData.eventIds);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_BULK_DELETE",
      targetEntity: "CommunityEvent",
      changesJson: { eventIds: validatedData.eventIds },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkPublishEvents(
  data: BulkEventActionInput
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = bulkEventActionSchema.parse(data);
    await eventRepository.bulkPublish(validatedData.eventIds);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_BULK_PUBLISH",
      targetEntity: "CommunityEvent",
      changesJson: { eventIds: validatedData.eventIds },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkArchiveEvents(
  data: BulkEventActionInput
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = bulkEventActionSchema.parse(data);
    await eventRepository.bulkArchive(validatedData.eventIds);
    await writeAuditLog({
      actorId: session.userId,
      action: "EVENT_BULK_ARCHIVE",
      targetEntity: "CommunityEvent",
      changesJson: { eventIds: validatedData.eventIds },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkUpdateEventStatus(
  ids: string[],
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED"
    | "ARCHIVED"
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    if (!ids.length) {
      return { success: false, error: "No events selected", code: "VALIDATION_ERROR" };
    }
    await eventRepository.bulkUpdateStatus(ids, status);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}
