"use server";

import {
  registrationRepository,
  eventRepository,
  formRepository,
  festivalRepository,
} from "@gameverse/database";
import {
  registrationFiltersSchema,
  bulkRegistrationActionSchema,
  addRegistrationNoteSchema,
  createRegistrationSchema,
  updateRegistrationSchema,
} from "@gameverse/validation";
import type {
  RegistrationFiltersInput,
  BulkRegistrationActionInput,
  AddRegistrationNoteInput,
  CreateRegistrationInput,
  UpdateRegistrationInput,
} from "@gameverse/validation";
import { requireAuth, requireAdmin, AuthError } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { publishRegistrationEvent, type RegistrationEvent } from "@gameverse/utils/redis-pubsub";
import { logger } from "@/lib/logger";

// =====================================================
// Registration Server Actions
// =====================================================

async function publishRegistrationCreatedEvent(
  registration: any,
  userId: string,
  discordUserId: string | null,
  discordUsername: string | null
): Promise<void> {
  try {
    const event = await eventRepository.findById(registration.eventId);
    const festival = event?.festivalId
      ? await festivalRepository.findById(event.festivalId)
      : null;

    const registrationEvent: RegistrationEvent = {
      type: "REGISTRATION_CREATED",
      registrationId: registration.id,
      passNumber: registration.passNumber,
      userId: userId,
      discordUserId: discordUserId,
      discordUsername: discordUsername,
      userName: registration.fullName,
      userEmail: registration.email,
      interest: registration.interest,
      festivalName: festival?.name ?? "Unknown Festival",
      status: registration.status,
      timestamp: new Date().toISOString(),
    };

    await publishRegistrationEvent(registrationEvent);
  } catch (error) {
    logger.error({ err: error }, "Failed to publish registration created event");
  }
}

async function publishRegistrationStatusUpdatedEvent(
  registrationId: string,
  newStatus: "APPROVED" | "REJECTED" | "WAITLISTED",
  rejectReason?: string
): Promise<void> {
  try {
    const registration = await registrationRepository.findByIdWithRelations(registrationId);
    if (!registration) return;

    const regAny = registration as any;
    const event = registration.eventId ? await eventRepository.findById(registration.eventId) : null;
    const festival = event?.festivalId
      ? await festivalRepository.findById(event.festivalId)
      : null;

    const registrationEvent: RegistrationEvent = {
      type: "REGISTRATION_STATUS_UPDATED",
      registrationId: registration.id,
      passNumber: registration.passNumber,
      userId: registration.userId,
      discordUserId: regAny.user?.discordAccount?.discordUserId ?? null,
      discordUsername: regAny.user?.discordAccount?.nickname ?? null,
      userName: regAny.fullName ?? registration.userId,
      userEmail: regAny.email ?? "",
      interest: regAny.interest ?? "",
      festivalName: festival?.name ?? "Unknown Festival",
      status: newStatus,
      messageId: regAny.discordMessageId ?? undefined,
      channelId: regAny.discordChannelId ?? undefined,
      rejectReason: rejectReason,
      timestamp: new Date().toISOString(),
    };

    await publishRegistrationEvent(registrationEvent);
  } catch (error) {
    logger.error({ err: error }, "Failed to publish registration status updated event");
  }
}

export async function getRegistrations(filters: RegistrationFiltersInput): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const validatedFilters = registrationFiltersSchema.parse(filters);
    const result = await registrationRepository.findMany(validatedFilters);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRegistrationById(id: string): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    const registration = await registrationRepository.findByIdWithRelations(id);
    if (!registration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }
    return ok(registration);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRegistrationByPassNumber(passNumber: string): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    const registration = await registrationRepository.findByPassNumber(passNumber);
    if (!registration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }
    return ok(registration);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRegistrationByQrCode(qrCode: string): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    const registration = await registrationRepository.findByQrCode(qrCode);
    if (!registration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }
    return ok(registration);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRegistrationStats(eventId?: string): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    const stats = await registrationRepository.getStats(eventId);
    return ok(stats);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getEventCapacity(eventId: string): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    const capacity = await registrationRepository.getEventCapacity(eventId);
    return ok(capacity);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createRegistration(data: CreateRegistrationInput): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    await checkMutationRateLimit(session.userId);
    const validatedData = createRegistrationSchema.parse(data);

    const existingEvent = await eventRepository.findById(validatedData.eventId);
    if (!existingEvent) {
      return handleActionError(new AuthError("NOT_FOUND", "Event not found"));
    }

    if (!existingEvent.registrationEnabled) {
      return handleActionError(new AuthError("VALIDATION_ERROR", "Registration is not enabled for this event"));
    }

    const now = new Date();
    if (existingEvent.registrationStart && now < existingEvent.registrationStart) {
      return handleActionError(new AuthError("VALIDATION_ERROR", "Registration has not started yet"));
    }
    if (existingEvent.registrationEnd && now > existingEvent.registrationEnd) {
      return handleActionError(new AuthError("VALIDATION_ERROR", "Registration has ended"));
    }

    const existingRegistration = await registrationRepository.findByUserAndEvent(
      validatedData.userId,
      validatedData.eventId
    );
    if (existingRegistration) {
      return handleActionError(new AuthError("CONFLICT", "You are already registered for this event"));
    }

    const capacity = await registrationRepository.getEventCapacity(validatedData.eventId);
    if (capacity.spotsLeft !== null && capacity.spotsLeft <= 0) {
      if (!existingEvent.waitlistEnabled) {
        return handleActionError(new AuthError("VALIDATION_ERROR", "Event is at full capacity"));
      }
    }

    const passNumber = await registrationRepository.generatePassNumber();
    const qrCode = await registrationRepository.generateQrCode();

    const registration = await registrationRepository.create(validatedData, passNumber, qrCode);

    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_CREATE",
      targetEntity: "Registration",
      targetId: registration.id,
      changesJson: { eventId: validatedData.eventId, userId: validatedData.userId },
    });

    if (validatedData.responses.length > 0) {
      const publishedVersion = await formRepository.getPublishedVersion(validatedData.eventId);
      if (publishedVersion) {
        await formRepository.submitResponse(validatedData.eventId, validatedData.responses, publishedVersion.version);
      }
    }

    await publishRegistrationCreatedEvent(
      registration,
      validatedData.userId,
      null,
      null
    );

    return ok(registration);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateRegistration(
  id: string,
  data: UpdateRegistrationInput
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingRegistration = await registrationRepository.findById(id);
    if (!existingRegistration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }

    const validatedData = updateRegistrationSchema.parse(data);

    if (validatedData.status && (validatedData.status === "APPROVED" || validatedData.status === "REJECTED" || validatedData.status === "WAITLISTED")) {
      await registrationRepository.updateStatus(id, validatedData.status, session.userId);
    }

    if (validatedData.notes) {
      await registrationRepository.addNote(id, session.userId, validatedData.notes, true);
    }

    if (validatedData.cancelReason) {
      await registrationRepository.cancel(id, validatedData.cancelReason, session.userId);
    }

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function approveRegistration(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingRegistration = await registrationRepository.findById(id);
    if (!existingRegistration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }

    await registrationRepository.updateStatus(id, "APPROVED", session.userId);
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_APPROVE",
      targetEntity: "Registration",
      targetId: id,
    });
    await publishRegistrationStatusUpdatedEvent(id, "APPROVED");
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function rejectRegistration(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingRegistration = await registrationRepository.findById(id);
    if (!existingRegistration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }

    await registrationRepository.updateStatus(id, "REJECTED", session.userId);
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_REJECT",
      targetEntity: "Registration",
      targetId: id,
    });
    await publishRegistrationStatusUpdatedEvent(id, "REJECTED");
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function waitlistRegistration(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingRegistration = await registrationRepository.findById(id);
    if (!existingRegistration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }

    await registrationRepository.updateStatus(id, "WAITLISTED", session.userId);
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_WAITLIST",
      targetEntity: "Registration",
      targetId: id,
    });
    await publishRegistrationStatusUpdatedEvent(id, "WAITLISTED");
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function cancelRegistration(
  id: string,
  cancelReason?: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingRegistration = await registrationRepository.findById(id);
    if (!existingRegistration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }

    await registrationRepository.cancel(id, cancelReason, session.userId);
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_CANCEL",
      targetEntity: "Registration",
      targetId: id,
      changesJson: { cancelReason },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function checkInRegistration(
  id: string,
  method: "manual" | "qr" = "manual"
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingRegistration = await registrationRepository.findById(id);
    if (!existingRegistration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }

    if (existingRegistration.status !== "APPROVED") {
      return handleActionError(new AuthError("VALIDATION_ERROR", "Only approved registrations can be checked in"));
    }

    await registrationRepository.checkIn(id, session.userId, method);
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_CHECKIN",
      targetEntity: "Registration",
      targetId: id,
      changesJson: { method },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function addRegistrationNote(data: AddRegistrationNoteInput): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const validatedData = addRegistrationNoteSchema.parse(data);

    const existingRegistration = await registrationRepository.findById(validatedData.registrationId);
    if (!existingRegistration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }

    const note = await registrationRepository.addNote(
      validatedData.registrationId,
      session.userId,
      validatedData.content,
      validatedData.isInternal
    );

    return ok(note);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkUpdateRegistrationStatus(
  data: BulkRegistrationActionInput,
  status: "APPROVED" | "REJECTED" | "WAITLISTED"
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const validatedData = bulkRegistrationActionSchema.parse(data);
    await registrationRepository.bulkUpdateStatus(validatedData.registrationIds, status, session.userId);
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_BULK_STATUS",
      targetEntity: "Registration",
      changesJson: { registrationIds: validatedData.registrationIds, status },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkCheckInRegistrations(
  data: BulkRegistrationActionInput
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const validatedData = bulkRegistrationActionSchema.parse(data);
    await registrationRepository.bulkCheckIn(validatedData.registrationIds, session.userId);
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_BULK_CHECKIN",
      targetEntity: "Registration",
      changesJson: { registrationIds: validatedData.registrationIds },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function exportRegistrations(eventId: string): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();

    const existingEvent = await eventRepository.findById(eventId);
    if (!existingEvent) {
      return handleActionError(new AuthError("NOT_FOUND", "Event not found"));
    }

    const { headers, rows } = await registrationRepository.exportByEvent(eventId);
    return ok({ headers, rows });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteRegistration(id: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingRegistration = await registrationRepository.findById(id);
    if (!existingRegistration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }
    await registrationRepository.delete(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_DELETE",
      targetEntity: "Registration",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDeleteRegistrations(
  data: BulkRegistrationActionInput
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const validatedData = bulkRegistrationActionSchema.parse(data);
    for (const id of validatedData.registrationIds) {
      await registrationRepository.delete(id);
    }
    await writeAuditLog({
      actorId: session.userId,
      action: "REGISTRATION_BULK_DELETE",
      targetEntity: "Registration",
      changesJson: { registrationIds: validatedData.registrationIds },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRegistrationAnalytics(): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();

    const stats = await registrationRepository.getStats();
    const statsAny = stats as any;

    // Today's registrations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayResult = await registrationRepository.findMany({
      dateFrom: today.toISOString(),
      dateTo: tomorrow.toISOString(),
      page: 1,
      perPage: 1,
    });
    const todayCount = (todayResult as any).total ?? 0;

    // Yesterday for growth
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayResult = await registrationRepository.findMany({
      dateFrom: yesterday.toISOString(),
      dateTo: today.toISOString(),
      page: 1,
      perPage: 1,
    });
    const yesterdayCount = (yesterdayResult as any).total ?? 0;

    const growthRate = yesterdayCount > 0
      ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
      : todayCount > 0 ? 100 : 0;

    const approvalRate = statsAny.totalRegistrations > 0
      ? Math.round((statsAny.approvedRegistrations / statsAny.totalRegistrations) * 100)
      : 0;

    return ok({
      todayRegistrations: todayCount,
      yesterdayRegistrations: yesterdayCount,
      dailyGrowth: growthRate,
      approvalRate,
      totalRegistrations: statsAny.totalRegistrations,
      pendingRegistrations: statsAny.pendingRegistrations,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function exportAllRegistrations(filters?: {
  status?: string;
  festivalId?: string;
  eventId?: string;
}): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();

    const result = await registrationRepository.findMany({
      status: filters?.status as any,
      festivalId: filters?.festivalId,
      eventId: filters?.eventId,
      page: 1,
      perPage: 10000,
      sortBy: "registeredAt",
      sortOrder: "desc",
    });

    const registrations = (result as any).registrations ?? [];

    const headers = [
      "Pass Number",
      "Display Name",
      "Username",
      "Email",
      "Discord Username",
      "Festival",
      "Event",
      "Status",
      "Attendance",
      "Registered At",
      "Approved At",
      "Checked In At",
    ];

    const rows = registrations.map((r: any) => ({
      passNumber: r.passNumber ?? "",
      displayName: r.user?.globalName ?? r.user?.username ?? "",
      username: r.user?.username ?? "",
      email: r.user?.email ?? "",
      discordUsername: r.user?.discordAccount?.nickname ?? r.user?.username ?? "",
      festival: r.festival?.name ?? "",
      event: r.event?.title ?? "",
      status: r.status ?? "",
      attendance: r.checkedInAt ? "Checked In" : "Not Checked In",
      registeredAt: r.registeredAt ? new Date(r.registeredAt).toISOString() : "",
      approvedAt: r.approvedAt ? new Date(r.approvedAt).toISOString() : "",
      checkedInAt: r.checkedInAt ? new Date(r.checkedInAt).toISOString() : "",
    }));

    return ok({ headers, rows });
  } catch (error) {
    return handleActionError(error);
  }
}
