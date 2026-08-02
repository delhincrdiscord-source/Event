import { prisma } from "@gameverse/database";
import type {
  FormFieldConfig,
  FormFieldListItem,
  FormVersion,
  FormVersionListItem,
  FormResponse,
  FormResponseWithField,
  FormSubmission,
  FormStats,
  PaginatedFormResponses,
  CreateFormFieldInput,
  UpdateFormFieldInput,
} from "@gameverse/types";

// =====================================================
// Form Builder Repository
// =====================================================

export class FormRepository {
  async getFieldsByEventId(eventId: string): Promise<FormFieldConfig[]> {
    const fields = await prisma.formField.findMany({
      where: {
        eventId,
        isDeleted: false,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return fields.map((f) => ({
      ...f,
      options: (f.options as { label: string; value: string }[]) ?? null,
    }));
  }

  async getFieldsByFestivalId(festivalId: string): Promise<FormFieldConfig[]> {
    const fields = await prisma.formField.findMany({
      where: {
        festivalId,
        isDeleted: false,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return fields.map((f) => ({
      ...f,
      options: (f.options as { label: string; value: string }[]) ?? null,
    }));
  }

  async getFieldById(id: string): Promise<FormFieldConfig | null> {
    const field = await prisma.formField.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!field) return null;

    return {
      ...field,
      options: (field.options as { label: string; value: string }[]) ?? null,
    };
  }

  async createField(
    data: CreateFormFieldInput,
    eventId?: string,
    festivalId?: string
  ): Promise<FormFieldConfig> {
    const field = await prisma.formField.create({
      data: {
        fieldName: data.fieldName,
        label: data.label,
        fieldType: data.fieldType,
        description: data.description,
        placeholder: data.placeholder,
        isRequired: data.isRequired ?? false,
        minLength: data.minLength,
        maxLength: data.maxLength,
        pattern: data.pattern,
        defaultValue: data.defaultValue,
        helpText: data.helpText,
        validationMessage: data.validationMessage,
        displayOrder: data.displayOrder ?? 0,
        options: (data.options as never) ?? undefined,
        eventId: eventId ?? undefined,
        festivalId: festivalId ?? undefined,
      },
    });

    return {
      ...field,
      options: (field.options as { label: string; value: string }[]) ?? null,
    };
  }

  async updateField(
    id: string,
    data: UpdateFormFieldInput
  ): Promise<FormFieldConfig> {
    const updateData: Record<string, unknown> = {};

    if (data.fieldName !== undefined) updateData.fieldName = data.fieldName;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.fieldType !== undefined) updateData.fieldType = data.fieldType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.placeholder !== undefined) updateData.placeholder = data.placeholder;
    if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;
    if (data.minLength !== undefined) updateData.minLength = data.minLength;
    if (data.maxLength !== undefined) updateData.maxLength = data.maxLength;
    if (data.pattern !== undefined) updateData.pattern = data.pattern;
    if (data.defaultValue !== undefined) updateData.defaultValue = data.defaultValue;
    if (data.helpText !== undefined) updateData.helpText = data.helpText;
    if (data.validationMessage !== undefined)
      updateData.validationMessage = data.validationMessage;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.options !== undefined) updateData.options = data.options;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const field = await prisma.formField.update({
      where: { id },
      data: updateData,
    });

    return {
      ...field,
      options: (field.options as { label: string; value: string }[]) ?? null,
    };
  }

  async deleteField(id: string): Promise<void> {
    await prisma.formField.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async reorderFields(
    fieldOrders: { id: string; displayOrder: number }[]
  ): Promise<void> {
    await Promise.all(
      fieldOrders.map(({ id, displayOrder }) =>
        prisma.formField.update({
          where: { id },
          data: { displayOrder },
        })
      )
    );
  }

  async duplicateField(
    id: string,
    newFieldName?: string
  ): Promise<FormFieldConfig> {
    const original = await this.getFieldById(id);
    if (!original) {
      throw new Error("Field not found");
    }

    const field = await prisma.formField.create({
      data: {
        fieldName: newFieldName ?? `${original.fieldName}_copy`,
        label: `${original.label} (Copy)`,
        fieldType: original.fieldType,
        description: original.description,
        placeholder: original.placeholder,
        isRequired: original.isRequired,
        minLength: original.minLength,
        maxLength: original.maxLength,
        pattern: original.pattern,
        defaultValue: original.defaultValue,
        helpText: original.helpText,
        validationMessage: original.validationMessage,
        displayOrder: original.displayOrder + 1,
        options: (original.options as never) ?? undefined,
        eventId: original.eventId,
        festivalId: original.festivalId,
      },
    });

    return {
      ...field,
      options: (field.options as { label: string; value: string }[]) ?? null,
    };
  }

  async getStats(eventId?: string): Promise<FormStats> {
    const where = {
      isDeleted: false,
      ...(eventId && { eventId }),
    };

    const [totalFields, activeFields] = await Promise.all([
      prisma.formField.count({ where }),
      prisma.formField.count({ where: { ...where, isActive: true } }),
    ]);

    const versionWhere = eventId ? { eventId } : {};

    const [totalResponses, totalSubmissions, publishedVersions] =
      await Promise.all([
        prisma.formResponse.count({
          where: versionWhere,
        }),
        prisma.formResponse.groupBy({
          by: ["eventId"],
          where: versionWhere,
        }),
        prisma.formVersion.count({
          where: { ...versionWhere, status: "PUBLISHED" },
        }),
      ]);

    return {
      totalFields,
      activeFields,
      totalResponses,
      totalSubmissions: totalSubmissions.length,
      publishedVersions,
    };
  }

  // Version Management
  async getVersions(eventId: string): Promise<FormVersionListItem[]> {
    return prisma.formVersion.findMany({
      where: { eventId },
      orderBy: { version: "desc" },
      include: {},
    });
  }

  async getLatestVersion(eventId: string): Promise<FormVersion | null> {
    const version = await prisma.formVersion.findFirst({
      where: { eventId },
      orderBy: { version: "desc" },
    });

    if (!version) return null;

    return {
      ...version,
      fieldsJson: (version.fieldsJson as unknown as FormFieldConfig[]) ?? [],
    };
  }

  async getPublishedVersion(eventId: string): Promise<FormVersion | null> {
    const version = await prisma.formVersion.findFirst({
      where: { eventId, status: "PUBLISHED" },
      orderBy: { version: "desc" },
    });

    if (!version) return null;

    return {
      ...version,
      fieldsJson: (version.fieldsJson as unknown as FormFieldConfig[]) ?? [],
    };
  }

  async createVersion(
    eventId: string,
    fields: FormFieldConfig[]
  ): Promise<FormVersion> {
    const latestVersion = await prisma.formVersion.findFirst({
      where: { eventId },
      orderBy: { version: "desc" },
    });

    const nextVersion = (latestVersion?.version ?? 0) + 1;

    const version = await prisma.formVersion.create({
      data: {
        eventId,
        version: nextVersion,
        status: "DRAFT",
        fieldsJson: fields as never,
      },
    });

    return {
      ...version,
      fieldsJson: (version.fieldsJson as unknown as FormFieldConfig[]) ?? [],
    };
  }

  async publishVersion(versionId: string): Promise<FormVersion> {
    const version = await prisma.formVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new Error("Version not found");
    }

    const updated = await prisma.formVersion.update({
      where: { id: versionId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return {
      ...updated,
      fieldsJson: (updated.fieldsJson as unknown as FormFieldConfig[]) ?? [],
    };
  }

  async unpublishVersion(versionId: string): Promise<FormVersion> {
    const updated = await prisma.formVersion.update({
      where: { id: versionId },
      data: {
        status: "DRAFT",
        publishedAt: null,
      },
    });

    return {
      ...updated,
      fieldsJson: (updated.fieldsJson as unknown as FormFieldConfig[]) ?? [],
    };
  }

  async archiveVersion(versionId: string): Promise<FormVersion> {
    const updated = await prisma.formVersion.update({
      where: { id: versionId },
      data: {
        status: "ARCHIVED",
      },
    });

    return {
      ...updated,
      fieldsJson: (updated.fieldsJson as unknown as FormFieldConfig[]) ?? [],
    };
  }

  // Response Management
  async getResponses(
    eventId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedFormResponses> {
    const where = { eventId };

    const [responses, total] = await Promise.all([
      prisma.formResponse.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          formField: {
            select: {
              id: true,
              label: true,
              fieldType: true,
              fieldName: true,
            },
          },
        },
      }),
      prisma.formResponse.count({ where }),
    ]);

    // Group responses by submission (event + submittedAt combination)
    const submissionMap = new Map<string, FormSubmission>();
    for (const response of responses) {
      const key = `${response.eventId}-${response.submittedAt.toISOString()}`;
      if (!submissionMap.has(key)) {
        submissionMap.set(key, {
          id: key,
          eventId: response.eventId ?? eventId,
          responses: [],
          submittedAt: response.submittedAt,
        });
      }
      submissionMap.get(key)!.responses.push(response as FormResponseWithField);
    }

    return {
      responses: responses as FormResponse[],
      submissions: Array.from(submissionMap.values()),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getResponsesByField(
    formFieldId: string
  ): Promise<FormResponse[]> {
    return prisma.formResponse.findMany({
      where: { formFieldId },
      orderBy: { submittedAt: "desc" },
    });
  }

  async submitResponse(
    eventId: string,
    responses: { fieldName: string; value: string }[],
    version: number = 1
  ): Promise<void> {
    const fields = await prisma.formField.findMany({
      where: {
        eventId,
        isDeleted: false,
      },
    });

    const fieldMap = new Map<string, { id: string; fieldName: string }>(fields.map((f: { id: string; fieldName: string }) => [f.fieldName, f]));

    await prisma.formResponse.createMany({
      data: responses
        .filter((r: { fieldName: string; value: string }) => fieldMap.has(r.fieldName))
        .map((r: { fieldName: string; value: string }) => ({
          eventId,
          formFieldId: fieldMap.get(r.fieldName)!.id,
          responseValue: r.value,
          version,
        })),
    });
  }

  async exportResponses(
    eventId: string
  ): Promise<{ headers: string[]; rows: string[][] }> {
    const fields = await prisma.formField.findMany({
      where: {
        eventId,
        isDeleted: false,
      },
      orderBy: { displayOrder: "asc" },
    });

    const responses = await prisma.formResponse.findMany({
      where: { eventId },
      orderBy: { submittedAt: "asc" },
    });

    const headers = [
      "Submission ID",
      "Submitted At",
      ...fields.map((f: { label: string }) => f.label),
    ];

    // Group by submission
    const submissionMap = new Map<
      string,
      { submittedAt: Date; values: Map<string, string> }
    >();

    for (const response of responses) {
      const key = response.submittedAt.toISOString();
      if (!submissionMap.has(key)) {
        submissionMap.set(key, {
          submittedAt: response.submittedAt,
          values: new Map(),
        });
      }
      const field = fields.find((f) => f.id === response.formFieldId);
      if (field) {
        submissionMap.get(key)!.values.set(field.fieldName, response.responseValue);
      }
    }

    const rows = Array.from(submissionMap.entries()).map(
      ([key, { submittedAt, values }], index) => [
        `SUB-${String(index + 1).padStart(4, "0")}`,
        submittedAt.toISOString(),
        ...fields.map((f: { fieldName: string }) => values.get(f.fieldName) ?? ""),
      ]
    );

    return { headers, rows };
  }
}

export const formRepository = new FormRepository();
