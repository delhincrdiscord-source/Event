"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { checkMutationRateLimit, checkStrictRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { formRepository, eventRepository } from "@gameverse/database";
import {
  createFormFieldSchema,
  updateFormFieldSchema,
  reorderFieldsSchema,
  saveFormVersionSchema,
  submitFormResponseSchema,
} from "@gameverse/validation";
import type {
  CreateFormFieldInput,
  UpdateFormFieldInput,
  ReorderFieldsInput,
  SaveFormVersionInput,
  SubmitFormResponseInput,
} from "@gameverse/types";

// =====================================================
// Form Builder Server Actions
// =====================================================

export async function getFormFields(
  eventId: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.getFieldsByEventId>>>> {
  try {
    await requireAuth();
    const fields = await formRepository.getFieldsByEventId(eventId);
    return ok(fields);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getFormFieldById(
  id: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.getFieldById>>>> {
  try {
    await requireAuth();
    const field = await formRepository.getFieldById(id);
    if (!field) {
      return { success: false, error: "Field not found", code: "NOT_FOUND" };
    }
    return ok(field);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createFormField(
  eventId: string,
  data: CreateFormFieldInput
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.createField>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = createFormFieldSchema.parse(data);

    const existingEvent = await eventRepository.findById(eventId);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }

    const fields = await formRepository.getFieldsByEventId(eventId);
    const existingFieldName = fields.find(
      (f) => f.fieldName === validatedData.fieldName
    );
    if (existingFieldName) {
      return { success: false, error: "A field with this name already exists", code: "CONFLICT" };
    }

    const field = await formRepository.createField(validatedData, eventId);
    return ok(field);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateFormField(
  id: string,
  data: UpdateFormFieldInput
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.updateField>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingField = await formRepository.getFieldById(id);
    if (!existingField) {
      return { success: false, error: "Field not found", code: "NOT_FOUND" };
    }

    const validatedData = updateFormFieldSchema.parse(data);

    if (validatedData.fieldName && existingField.eventId) {
      const fields = await formRepository.getFieldsByEventId(
        existingField.eventId
      );
      const duplicateName = fields.find(
        (f) => f.fieldName === validatedData.fieldName && f.id !== id
      );
      if (duplicateName) {
        return { success: false, error: "A field with this name already exists", code: "CONFLICT" };
      }
    }

    const cleanData = {
      ...validatedData,
      minLength: validatedData.minLength ?? undefined,
      maxLength: validatedData.maxLength ?? undefined,
      min: (validatedData as Record<string, unknown>).min ?? undefined,
      max: (validatedData as Record<string, unknown>).max ?? undefined,
      pattern: validatedData.pattern ?? undefined,
      defaultValue: validatedData.defaultValue ?? undefined,
    };
    const field = await formRepository.updateField(id, cleanData as any);
    return ok(field);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteFormField(
  id: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingField = await formRepository.getFieldById(id);
    if (!existingField) {
      return { success: false, error: "Field not found", code: "NOT_FOUND" };
    }
    await formRepository.deleteField(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderFormFields(
  data: ReorderFieldsInput
): Promise<ActionResult<null>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = reorderFieldsSchema.parse(data);
    await formRepository.reorderFields(validatedData.fieldOrders);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function duplicateFormField(
  id: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.duplicateField>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingField = await formRepository.getFieldById(id);
    if (!existingField) {
      return { success: false, error: "Field not found", code: "NOT_FOUND" };
    }
    const field = await formRepository.duplicateField(id);
    return ok(field);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getFormStats(
  eventId?: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.getStats>>>> {
  try {
    await requireAuth();
    const stats = await formRepository.getStats(eventId);
    return ok(stats);
  } catch (error) {
    return handleActionError(error);
  }
}

// Version Management
export async function getFormVersions(
  eventId: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.getVersions>>>> {
  try {
    await requireAuth();
    const versions = await formRepository.getVersions(eventId);
    return ok(versions);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getLatestFormVersion(
  eventId: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.getLatestVersion>>>> {
  try {
    await requireAuth();
    const version = await formRepository.getLatestVersion(eventId);
    return ok(version);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getPublishedFormVersion(
  eventId: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.getPublishedVersion>>>> {
  try {
    await requireAuth();
    const version = await formRepository.getPublishedVersion(eventId);
    return ok(version);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function saveFormVersion(
  data: SaveFormVersionInput
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.createVersion>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = saveFormVersionSchema.parse(data);

    const existingEvent = await eventRepository.findById(validatedData.eventId);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }

    const fields = await formRepository.getFieldsByEventId(validatedData.eventId);

    const version = await formRepository.createVersion(
      validatedData.eventId,
      fields.length > 0 ? fields : []
    );

    return ok(version);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function publishFormVersion(
  versionId: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.publishVersion>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const version = await formRepository.publishVersion(versionId);
    return ok(version);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function unpublishFormVersion(
  versionId: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.unpublishVersion>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const version = await formRepository.unpublishVersion(versionId);
    return ok(version);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveFormVersion(
  versionId: string
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.archiveVersion>>>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const version = await formRepository.archiveVersion(versionId);
    return ok(version);
  } catch (error) {
    return handleActionError(error);
  }
}

// Response Management
export async function getFormResponses(
  eventId: string,
  page?: number,
  perPage?: number
): Promise<ActionResult<Awaited<ReturnType<typeof formRepository.getResponses>>>> {
  try {
    await requireAuth();
    const result = await formRepository.getResponses(eventId, page, perPage);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function submitFormResponse(
  data: SubmitFormResponseInput
): Promise<ActionResult<null>> {
  try {
    const session = await requireAuth();
    const { allowed } = await checkStrictRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const validatedData = submitFormResponseSchema.parse(data);

    const existingEvent = await eventRepository.findById(validatedData.eventId);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }

    await formRepository.submitResponse(
      validatedData.eventId,
      validatedData.responses
    );

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function exportFormResponses(
  eventId: string
): Promise<ActionResult<{ headers: string[]; rows: unknown[][] }>> {
  try {
    const session = await requireAdmin();
    const { allowed } = await checkMutationRateLimit(session.userId);
    if (!allowed) {
      return { success: false, error: "Too many requests. Please try again later", code: "RATE_LIMITED" };
    }

    const existingEvent = await eventRepository.findById(eventId);
    if (!existingEvent) {
      return { success: false, error: "Event not found", code: "NOT_FOUND" };
    }

    const { headers, rows } = await formRepository.exportResponses(eventId);
    return ok({ headers, rows });
  } catch (error) {
    return handleActionError(error);
  }
}
