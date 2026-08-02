"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { categoryRepository } from "@gameverse/database";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryFiltersSchema,
  bulkCategoryActionSchema,
  duplicateCategorySchema,
  type CategoryFiltersInput,
  type BulkCategoryActionInput,
  type DuplicateCategoryInput,
} from "@gameverse/validation";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@gameverse/types";

// =====================================================
// Category Server Actions
// =====================================================

export async function getCategories(
  filters: CategoryFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const validatedFilters = categoryFiltersSchema.parse(filters);
    const result = await categoryRepository.findMany(validatedFilters as never);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAllCategories(): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const categories = await categoryRepository.findAll();
    return ok(categories);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getCategoryById(id: string): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const category = await categoryRepository.findById(id);
    if (!category) {
      return handleActionError(new Error("Category not found"));
    }
    return ok(category);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getCategoryBySlug(slug: string): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      return handleActionError(new Error("Category not found"));
    }
    return ok(category);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getCategoryStats(): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const stats = await categoryRepository.getStats();
    return ok(stats);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createCategory(
  data: CreateCategoryInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = createCategorySchema.parse(data);
    const existingSlug = await categoryRepository.findBySlug(validatedData.slug);
    if (existingSlug) {
      return handleActionError(new Error("A category with this slug already exists"));
    }
    const category = await categoryRepository.create(validatedData as never);
    return ok(category);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      return handleActionError(new Error("Category not found"));
    }
    const validatedData = updateCategorySchema.parse(data);
    if (validatedData.slug) {
      const existingSlug = await categoryRepository.findBySlug(validatedData.slug);
      if (existingSlug && existingSlug.id !== id) {
        return handleActionError(new Error("A category with this slug already exists"));
      }
    }
    const category = await categoryRepository.update(id, validatedData as never);
    return ok(category);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      return handleActionError(new Error("Category not found"));
    }
    await categoryRepository.delete(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreCategory(id: string): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      return handleActionError(new Error("Category not found"));
    }
    await categoryRepository.restore(id);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function duplicateCategory(
  data: DuplicateCategoryInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = duplicateCategorySchema.parse(data);
    const existingSlug = await categoryRepository.findBySlug(validatedData.slug);
    if (existingSlug) {
      return handleActionError(new Error("A category with this slug already exists"));
    }
    const category = await categoryRepository.duplicate(validatedData.id, {
      name: validatedData.name,
      slug: validatedData.slug,
    });
    return ok(category);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDeleteCategories(
  data: BulkCategoryActionInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = bulkCategoryActionSchema.parse(data);
    await categoryRepository.bulkDelete(validatedData.categoryIds);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkActivateCategories(
  data: BulkCategoryActionInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = bulkCategoryActionSchema.parse(data);
    await categoryRepository.bulkActivate(validatedData.categoryIds);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDeactivateCategories(
  data: BulkCategoryActionInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const validatedData = bulkCategoryActionSchema.parse(data);
    await categoryRepository.bulkDeactivate(validatedData.categoryIds);
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function seedDefaultCategories(): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    await categoryRepository.seedDefaults();
    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}
