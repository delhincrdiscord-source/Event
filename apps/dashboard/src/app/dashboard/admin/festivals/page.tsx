"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Archive,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
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
  getFestivals,
  getFestivalStats,
  deleteFestival,
  archiveFestival,
  restoreFestival,
  bulkDeleteFestivals,
  bulkArchiveFestivals,
  bulkUpdateFestivalStatus,
} from "./_actions/festival";
import type {
  FestivalListItem,
  FestivalStatus,
  PaginatedFestivals,
  FestivalStats,
} from "@gameverse/types";

const STATUS_OPTIONS: { value: FestivalStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "LIVE", label: "Live" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_COLORS: Record<FestivalStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  LIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  COMPLETED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  ARCHIVED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

const STATUS_ICONS: Record<FestivalStatus, React.ReactNode> = {
  DRAFT: <FileText className="h-4 w-4" />,
  UPCOMING: <Clock className="h-4 w-4" />,
  LIVE: <CheckCircle2 className="h-4 w-4" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  ARCHIVED: <Archive className="h-4 w-4" />,
};

export default function FestivalsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [stats, setStats] = useState<FestivalStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL" as FestivalStatus | "ALL",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFestivals = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getFestivals({
        search: filters.search || undefined,
        status: filters.status === "ALL" ? undefined : filters.status,
        page: pagination.page,
        perPage: pagination.perPage,
        sortBy: "startDate",
        sortOrder: "desc",
      });
      if (result.success && result.data) {
        setFestivals(result.data.festivals);
        setPagination((prev) => ({
          ...prev,
          total: result.data.total,
          totalPages: result.data.totalPages,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage]);

  const fetchStats = useCallback(async () => {
    const result = await getFestivalStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  }, []);

  useEffect(() => {
    fetchFestivals();
  }, [fetchFestivals]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as FestivalStatus | "ALL",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === festivals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(festivals.map((f) => f.id));
    }
  };

  const handleSelectFestival = (id: string) => {
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
          result = await bulkDeleteFestivals({ festivalIds: selectedIds });
          break;
        case "archive":
          result = await bulkArchiveFestivals({ festivalIds: selectedIds });
          break;
        case "DRAFT":
        case "UPCOMING":
        case "LIVE":
        case "COMPLETED":
          result = await bulkUpdateFestivalStatus(selectedIds, action);
          break;
      }

      if (result?.success) {
        setSelectedIds([]);
        fetchFestivals();
        fetchStats();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteFestival(id);
      if (result.success) {
        fetchFestivals();
        fetchStats();
      }
    });
  };

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      const result = await archiveFestival(id);
      if (result.success) {
        fetchFestivals();
        fetchStats();
      }
    });
  };

  const handleRestore = async (id: string) => {
    startTransition(async () => {
      const result = await restoreFestival(id);
      if (result.success) {
        fetchFestivals();
        fetchStats();
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Festivals</h1>
          <p className="text-muted-foreground">
            Manage your festivals and events
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/festivals/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Festival
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Festivals
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFestivals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Festivals
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeFestivals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Draft Festivals
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftFestivals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Live Festivals
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.liveFestivals}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Festival List</CardTitle>
          <CardDescription>
            View and manage all your festivals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search festivals..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selected
                </span>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("archive")}
                  disabled={isPending}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("LIVE")}
                  disabled={isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Set Live
                </Button>
              </div>
            )}

            {/* Festival List */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 rounded-lg border p-4"
                  >
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : festivals.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No festivals found</h3>
                <p className="text-sm text-muted-foreground">
                  {filters.search || filters.status !== "ALL"
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first festival to get started"}
                </p>
                {!filters.search && filters.status === "ALL" && (
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/dashboard/festivals/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Festival
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All Header */}
                <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === festivals.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-sm font-medium">Status</span>
                  <span className="text-sm font-medium">Dates</span>
                  <span className="text-sm font-medium">Events</span>
                  <span className="text-sm font-medium">Registrations</span>
                  <span className="ml-auto text-sm font-medium">Actions</span>
                </div>

                {/* Festival Items */}
                {festivals.map((festival) => (
                  <div
                    key={festival.id}
                    className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(festival.id)}
                      onChange={() => handleSelectFestival(festival.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/festivals/${festival.id}`)
                          }
                          className="font-medium hover:underline truncate"
                        >
                          {festival.name}
                        </button>
                        {!festival.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {festival.shortDescription || festival.slug}
                      </p>
                    </div>
                    <Badge
                      className={`${STATUS_COLORS[festival.status]} flex items-center gap-1`}
                    >
                      {STATUS_ICONS[festival.status]}
                      {festival.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(festival.startDate)} -{" "}
                      {formatDate(festival.endDate)}
                    </div>
                    <div className="text-sm text-muted-foreground w-16 text-center">
                      {festival._count?.events || 0}
                    </div>
                    <div className="text-sm text-muted-foreground w-20 text-center">
                      {festival._count?.registrations || 0}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/festivals/${festival.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/festivals/${festival.id}/edit`
                            )
                          }
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {festival.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => handleArchive(festival.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        {festival.status === "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => handleRestore(festival.id)}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/festivals/${festival.id}/duplicate`
                            )
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(festival.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.perPage + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.perPage,
                    pagination.total
                  )}{" "}
                  of {pagination.total} festivals
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
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
                    onClick={() => handlePageChange(pagination.page + 1)}
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
    </div>
  );
}
