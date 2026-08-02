"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, Trash2, CheckCircle2, XCircle, Tag, Hash, Calendar, Activity,  } from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Badge } from "@gameverse/ui/badge";
import { Card, CardContent, CardHeader, CardTitle,  } from "@gameverse/ui/card";
import { Separator } from "@gameverse/ui/separator";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  getCategoryById,
  deleteCategory,
  restoreCategory,
  updateCategory,
} from "../_actions/category";
import { DeleteCategoryDialog } from "../_components";
import type { EventCategory } from "@gameverse/types";

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCategory = async () => {
      const result = await getCategoryById(id);
      if (result.success && result.data) {
        setCategory(result.data);
      }
      setIsLoading(false);
    };
    fetchCategory();
  }, [id]);

  const handleDelete = async () => {
    const result = await deleteCategory(id);
    if (result.success) {
      router.push("/dashboard/admin/categories");
    }
  };

  const handleRestore = async () => {
    const result = await restoreCategory(id);
    if (result.success) {
      setCategory((prev) =>
        prev ? { ...prev, isActive: true, isDeleted: false } : null
      );
    }
  };

  const handleToggleActive = async () => {
    if (!category) return;
    setIsUpdating(true);
    const result = await updateCategory(id, { isActive: !category.isActive });
    if (result.success) {
      setCategory((prev) =>
        prev ? { ...prev, isActive: !prev.isActive } : null
      );
    }
    setIsUpdating(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Tag className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">
          Category not found
        </h3>
        <p className="text-sm text-muted-foreground">
          The category you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/admin/categories")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/categories")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ebebeb]"
              style={{ backgroundColor: category.color + "20" }}
            >
              {category.emoji ? (
                <span className="text-2xl">{category.emoji}</span>
              ) : (
                <Tag
                  className="h-6 w-6"
                  style={{ color: category.color }}
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {category.name}
                </h1>
                <Badge
                  variant={category.isActive ? "default" : "secondary"}
                  className={
                    category.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :"bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                  }
                >
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono">
                {category.slug}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/categories/${category.id}/edit`)
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={isUpdating}
          >
            {category.isActive ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          {category.isActive && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Name
              </p>
              <p className="text-lg">{category.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Slug
              </p>
              <p className="font-mono text-sm">{category.slug}</p>
            </div>
            {category.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="whitespace-pre-wrap">
                  {category.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appearance & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Emoji
                  </p>
                  <p>{category.emoji || "None"}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Icon
                  </p>
                  <p>{category.icon || "None"}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Color
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-mono text-sm">
                      {category.color}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sort Order
                  </p>
                  <p>{category.sortOrder}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p>{category.isActive ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created At
                  </p>
                  <p>{formatDateTime(category.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </p>
                  <p>{formatDateTime(category.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <DeleteCategoryDialog
        categoryName={category.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
