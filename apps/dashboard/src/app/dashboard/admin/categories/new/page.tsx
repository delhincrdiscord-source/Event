"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Palette,
  Tag,
} from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Textarea } from "@gameverse/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";


import { createCategory } from "../_actions/category";
import type { CreateCategoryInput } from "@gameverse/types";

// =====================================================
// Validation
// =====================================================

interface ValidationErrors {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  sortOrder?: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateForm(data: {
  name: string;
  slug: string;
  description: string;
  color: string;
  sortOrder: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (data.name.trim().length > 64) {
    errors.name = "Name must be at most 64 characters";
  }

  if (!data.slug.trim()) {
    errors.slug = "Slug is required";
  } else if (data.slug.trim().length < 2) {
    errors.slug = "Slug must be at least 2 characters";
  } else if (data.slug.trim().length > 64) {
    errors.slug = "Slug must be at most 64 characters";
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug.trim())) {
    errors.slug =
      "Slug must contain only lowercase letters, numbers, and hyphens";
  }

  if (data.description.length > 500) {
    errors.description = "Description must be at most 500 characters";
  }

  if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    errors.color = "Color must be a valid hex color (e.g. #5865F2)";
  }

  if (
    data.sortOrder &&
    (isNaN(Number(data.sortOrder)) || Number(data.sortOrder) < 0)
  ) {
    errors.sortOrder = "Sort order must be a non-negative number";
  }

  return errors;
}

// =====================================================
// Component
// =====================================================

export default function NewCategoryPage() {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [emoji, setEmoji] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#5865F2");
  const [sortOrder, setSortOrder] = useState("0");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (!slugManuallyEdited) {
        setSlug(generateSlug(value));
      }
    },
    [slugManuallyEdited]
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlugManuallyEdited(true);
    setSlug(value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    const formData = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      color,
      sortOrder,
    };

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);

    const categoryData: CreateCategoryInput = {
      name: name.trim(),
      slug: slug.trim(),
      emoji: emoji.trim() || undefined,
      icon: icon.trim() || undefined,
      description: description.trim() || undefined,
      color: color || undefined,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
    };

    try {
      const result = await createCategory(categoryData);

      if (result.success) {
        router.push("/dashboard/admin/categories");
      } else {
        setGlobalError(result.error ?? "Failed to create category");
      }
    } catch {
      setGlobalError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/admin/categories")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Category
          </h1>
          <p className="text-sm text-[#888888]">
            Add a new category to organize your events
          </p>
        </div>
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="flex items-center gap-2 rounded-lg border border-[#ee0000] bg-[#f7d4d6] p-4 text-sm text-[#c50000]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* ===================================================== */}
          {/* Basic Information */}
          {/* ===================================================== */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fafafa]">
                  <span className="text-sm font-semibold text-[#171717]">
                    1
                  </span>
                </div>
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Name, slug, and description
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[#171717] mb-1.5"
                >
                  Name <span className="text-[#ee0000]">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="e.g. Gaming Night"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-[#ee0000]">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="w-full">
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-[#171717] mb-1.5"
                >
                  Slug <span className="text-[#ee0000]">*</span>
                </label>
                <Input
                  id="slug"
                  placeholder="e.g. gaming-night"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
                {errors.slug ? (
                  <p className="mt-1 text-sm text-[#ee0000]">
                    {errors.slug}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[#888888]">
                    Auto-generated from name. Used in URLs.
                  </p>
                )}
              </div>

              <div className="w-full">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#171717] mb-1.5"
                >
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this category..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description ? (
                  <p className="mt-1 text-sm text-[#ee0000]">
                    {errors.description}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[#888888]">
                    {description.length}/500 characters
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ===================================================== */}
          {/* Appearance */}
          {/* ===================================================== */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fafafa]">
                  <span className="text-sm font-semibold text-[#171717]">
                    2
                  </span>
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Emoji, icon, color, and sort order
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full">
                <label
                  htmlFor="emoji"
                  className="block text-sm font-medium text-[#171717] mb-1.5"
                >
                  Emoji
                </label>
                <Input
                  id="emoji"
                  placeholder="e.g. 🎮"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                />
                <p className="mt-1 text-sm text-[#888888]">
                  An emoji to represent this category
                </p>
              </div>

              <div className="w-full">
                <label
                  htmlFor="icon"
                  className="block text-sm font-medium text-[#171717] mb-1.5"
                >
                  Icon
                </label>
                <Input
                  id="icon"
                  placeholder="e.g. gamepad-2"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                />
                <p className="mt-1 text-sm text-[#888888]">
                  Lucide icon name (e.g. gamepad-2, trophy, film)
                </p>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-[#171717] mb-1.5">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-md border border-[#ebebeb] p-0.5"
                  />
                  <Input
                    placeholder="#5865F2"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-32"
                  />
                  <div
                    className="h-10 w-10 rounded-full border border-[#ebebeb]"
                    style={{ backgroundColor: color }}
                  />
                </div>
                {errors.color && (
                  <p className="mt-1 text-sm text-[#ee0000]">
                    {errors.color}
                  </p>
                )}
              </div>

              <div className="w-full">
                <label
                  htmlFor="sort-order"
                  className="block text-sm font-medium text-[#171717] mb-1.5"
                >
                  Sort Order
                </label>
                <Input
                  id="sort-order"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
                {errors.sortOrder ? (
                  <p className="mt-1 text-sm text-[#ee0000]">
                    {errors.sortOrder}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[#888888]">
                    Lower numbers appear first
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===================================================== */}
        {/* Preview */}
        {/* ===================================================== */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fafafa]">
                <Palette className="h-4 w-4 text-[#171717]" />
              </div>
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  How your category will appear
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 rounded-lg border border-[#ebebeb] p-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ebebeb]"
                style={{ backgroundColor: color + "20" }}
              >
                {emoji ? (
                  <span className="text-xl">{emoji}</span>
                ) : (
                  <Tag className="h-5 w-5" style={{ color }} />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {name || "Category Name"}
                </p>
                <p className="text-sm text-[#888888]">
                  {slug || "category-slug"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================================================== */}
        {/* Actions */}
        {/* ===================================================== */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/admin/categories")}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Create Category
          </Button>
        </div>
      </form>
    </div>
  );
}
