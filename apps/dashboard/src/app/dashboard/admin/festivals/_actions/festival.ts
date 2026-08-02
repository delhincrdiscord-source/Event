"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { checkMutationRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { festivalRepository } from "@gameverse/database";
import {
  createFestivalSchema,
  updateFestivalSchema,
  festivalFiltersSchema,
  bulkFestivalActionSchema,
  duplicateFestivalSchema,
  type CreateFestivalInput,
  type UpdateFestivalInput,
  type FestivalFiltersInput,
  type BulkFestivalActionInput,
  type DuplicateFestivalInput,
} from "@gameverse/validation";

// =====================================================
// Festival Server Actions
// =====================================================

export async function getFestivals(filters: FestivalFiltersInput): Promise<ActionResult<any>> {
  try {
    await requireAuth();
    const validatedFilters = festivalFiltersSchema.parse(filters);
    const result = await festivalRepository.findMany(validatedFilters as never);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getFestivalById(id: string): Promise<ActionResult<any>> {
  try {
    await requireAuth();
    const festival = await festivalRepository.findById(id);
    if (!festival) {
      return handleActionError(new Error("Festival not found"));
    }
    return ok(festival);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getFestivalBySlug(slug: string): Promise<ActionResult<any>> {
  try {
    await requireAuth();
    const festival = await festivalRepository.findBySlug(slug);
    if (!festival) {
      return handleActionError(new Error("Festival not found"));
    }
    return ok(festival);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getFestivalStats(): Promise<ActionResult<any>> {
  try {
    await requireAuth();
    const stats = await festivalRepository.getStats();
    return ok(stats);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createFestival(data: any): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = createFestivalSchema.parse(data);
    const existingSlug = await festivalRepository.findBySlug(validatedData.slug);
    if (existingSlug) {
      return handleActionError(new Error("A festival with this slug already exists"));
    }
    const festival = await festivalRepository.create(validatedData as never);
    await writeAuditLog({
      actorId: session.userId,
      action: "FESTIVAL_CREATE",
      targetEntity: "Festival",
      targetId: festival.id,
      changesJson: { name: validatedData.name, slug: validatedData.slug },
    });
    return ok(festival);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateFestival(id: string, data: any): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const existingFestival = await festivalRepository.findById(id);
    if (!existingFestival) {
      return handleActionError(new Error("Festival not found"));
    }
    const validatedData = updateFestivalSchema.parse(data);
    if (validatedData.slug) {
      const existingSlug = await festivalRepository.findBySlug(validatedData.slug);
      if (existingSlug && existingSlug.id !== id) {
        return handleActionError(new Error("A festival with this slug already exists"));
      }
    }
    const festival = await festivalRepository.update(id, validatedData as never);
    await writeAuditLog({
      actorId: session.userId,
      action: "FESTIVAL_UPDATE",
      targetEntity: "Festival",
      targetId: id,
      changesJson: validatedData,
    });
    return ok(festival);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteFestival(id: string): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const existingFestival = await festivalRepository.findById(id);
    if (!existingFestival) {
      return handleActionError(new Error("Festival not found"));
    }
    await festivalRepository.delete(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "FESTIVAL_DELETE",
      targetEntity: "Festival",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreFestival(id: string): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const existingFestival = await festivalRepository.findById(id);
    if (!existingFestival) {
      return handleActionError(new Error("Festival not found"));
    }
    await festivalRepository.restore(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "FESTIVAL_RESTORE",
      targetEntity: "Festival",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveFestival(id: string): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const existingFestival = await festivalRepository.findById(id);
    if (!existingFestival) {
      return handleActionError(new Error("Festival not found"));
    }
    await festivalRepository.archive(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "FESTIVAL_ARCHIVE",
      targetEntity: "Festival",
      targetId: id,
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function duplicateFestival(data: DuplicateFestivalInput): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = duplicateFestivalSchema.parse(data);
    const existingSlug = await festivalRepository.findBySlug(validatedData.slug);
    if (existingSlug) {
      return handleActionError(new Error("A festival with this slug already exists"));
    }
    const festival = await festivalRepository.duplicate(validatedData.id, {
      name: validatedData.name,
      slug: validatedData.slug,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
    });
    return ok(festival);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDeleteFestivals(data: BulkFestivalActionInput): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = bulkFestivalActionSchema.parse(data);
    await festivalRepository.bulkDelete(validatedData.festivalIds);
    await writeAuditLog({
      actorId: session.userId,
      action: "FESTIVAL_BULK_DELETE",
      targetEntity: "Festival",
      changesJson: { festivalIds: validatedData.festivalIds },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkArchiveFestivals(data: BulkFestivalActionInput): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = bulkFestivalActionSchema.parse(data);
    await festivalRepository.bulkArchive(validatedData.festivalIds);
    await writeAuditLog({
      actorId: session.userId,
      action: "FESTIVAL_BULK_ARCHIVE",
      targetEntity: "Festival",
      changesJson: { festivalIds: validatedData.festivalIds },
    });
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkUpdateFestivalStatus(
  ids: string[],
  status: "DRAFT" | "UPCOMING" | "LIVE" | "COMPLETED" | "ARCHIVED"
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    if (!ids.length) {
      return handleActionError(new Error("No festivals selected"));
    }
    await festivalRepository.bulkUpdateStatus(ids, status);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAllFestivals(): Promise<ActionResult<any>> {
  try {
    await requireAuth();
    const festivals = await festivalRepository.findAll();
    return ok(festivals);
  } catch (error) {
    return handleActionError(error);
  }
}
