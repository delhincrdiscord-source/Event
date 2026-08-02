"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  ArrowUpDown,
  Tag,
} from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gameverse/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";
import { Skeleton } from "@gameverse/ui/skeleton";
import { Separator } from "@gameverse/ui/separator";

import {
  getCategories,
  getCategoryStats,
  deleteCategory,
  restoreCategory,
  bulkDeleteCategories,
  bulkActivateCategories,
  bulkDeactivateCategories,
} from "./_actions/category";
import { DeleteCategoryDialog, DuplicateCategoryDialog } from "./_components";
import type {
  EventCategoryListItem,
  CategoryStats,
  PaginatedCategories,
} from "@gameverse/types";

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "sortOrder", label: "Sort Order" },
  { value: "createdAt", label: "Created At" },
] as const;

export default function CategoriesPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<EventCategoryListItem[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "sortOrder" as "name" | "sortOrder" | "createdAt",
    sortOrder: "asc" as "asc" | "desc",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: EventCategoryListItem | null;
  }>({ open: false, category: null });
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    category: EventCategoryListItem | null;
  }>({ open: false, category: null });

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCategories({
        search: filters.search || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: pagination.page,
        perPage: pagination.perPage,
      });
      if (result.success && result.data) {
        const data = result.data as PaginatedCategories;
        setCategories(data.categories);
        setPagination((prev) => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage]);

  const fetchStats = useCallback(async () => {
    const result = await getCategoryStats();
    if (result.success && result.data) {
      setStats(result.data as CategoryStats);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: value as "name" | "sortOrder" | "createdAt",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === categories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(categories.map((c) => c.id));
    }
  };

  const handleSelectCategory = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (!selectedIds.length) return;

    startTransition(async () => {
      let result;
      switch (action) {
        case "delete":
          result = await bulkDeleteCategories({ categoryIds: selectedIds });
          break;
        case "activate":
          result = await bulkActivateCategories({ categoryIds: selectedIds });
          break;
        case "deactivate":
          result = await bulkDeactivateCategories({ categoryIds: selectedIds });
          break;
      }

      if (result?.success) {
        setSelectedIds([]);
        fetchCategories();
        fetchStats();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        setDeleteDialog({ open: false, category: null });
        fetchCategories();
        fetchStats();
      }
    });
  };

  const handleRestore = async (id: string) => {
    startTransition(async () => {
      const result = await restoreCategory(id);
      if (result.success) {
        fetchCategories();
        fetchStats();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your events into categories
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/categories/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Category
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Categories
              </CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCategories}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Categories
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeCategories}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Categories
              </CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.inactiveCategories}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>
            View and manage all your categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filters.sortBy}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.length} selected
                    </span>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkAction("activate")}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Activate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkAction("deactivate")}
                      disabled={isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Deactivate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkAction("delete")}
                      disabled={isPending}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category List */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 rounded-lg border p-4"
                  >
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No categories found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filters.search
                    ? "Try adjusting your search criteria"
                    : "Create your first category to get started"}
                </p>
                {!filters.search && (
                  <Button
                    className="mt-4"
                    onClick={() =>
                      router.push("/dashboard/categories/new")
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Category
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All Header */}
                <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === categories.length &&
                      categories.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium flex-1">Name</span>
                  <span className="text-sm font-medium w-[120px]">
                    Slug
                  </span>
                  <span className="text-sm font-medium w-[80px]">
                    Status
                  </span>
                  <span className="text-sm font-medium w-[80px]">
                    Order
                  </span>
                  <span className="text-sm font-medium w-[80px]">
                    Events
                  </span>
                  <span className="ml-auto text-sm font-medium w-[80px]">
                    Actions
                  </span>
                </div>

                {/* Category Items */}
                <AnimatePresence mode="popLayout">
                  {categories.map((category) => (
                    <motion.div
                      key={category.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(category.id)}
                        onChange={() => handleSelectCategory(category.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ebebeb]"
                        style={{ backgroundColor: category.color + "20" }}
                      >
                        {category.emoji ? (
                          <span className="text-lg">{category.emoji}</span>
                        ) : (
                          <Tag
                            className="h-4 w-4"
                            style={{ color: category.color }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/categories/${category.id}`
                            )
                          }
                          className="font-medium hover:underline truncate"
                        >
                          {category.name}
                        </button>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono w-[120px] truncate">
                        {category.slug}
                      </div>
                      <div className="w-[80px]">
                        <Badge
                          variant={category.isActive ? "default" : "secondary"}
                          className={
                            category.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          }
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground w-[80px] text-center">
                        {category.sortOrder}
                      </div>
                      <div className="text-sm text-muted-foreground w-[80px] text-center">
                        {category._count?.events || 0}
                      </div>
                      <div className="w-[80px] flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/categories/${category.id}`
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/categories/${category.id}/edit`
                                )
                              }
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setDuplicateDialog({
                                  open: true,
                                  category,
                                })
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {category.isActive ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleBulkAction("deactivate")
                                }
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRestore(category.id)
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  category,
                                })
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  {(pagination.page - 1) * pagination.perPage + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.perPage,
                    pagination.total
                  )}{" "}
                  of {pagination.total} categories
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(pagination.page - 1)
                    }
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(pagination.page + 1)
                    }
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteCategoryDialog
        categoryName={deleteDialog.category?.name || ""}
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, category: deleteDialog.category })
        }
        onConfirm={() =>
          deleteDialog.category && handleDelete(deleteDialog.category.id)
        }
        isPending={isPending}
      />

      {/* Duplicate Dialog */}
      {duplicateDialog.category && (
        <DuplicateCategoryDialog
          category={duplicateDialog.category}
          open={duplicateDialog.open}
          onOpenChange={(open) =>
            setDuplicateDialog({ open, category: duplicateDialog.category })
          }
        />
      )}
    </div>
  );
}
