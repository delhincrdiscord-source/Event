"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Archive,
  Trash2,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  FileText,
  Clock,
  CheckCircle2,
  Pin,
  Globe,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
import { Checkbox } from "@gameverse/ui/checkbox";

import {
  getAnnouncements,
  getAnnouncementStats,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  bulkPublishAnnouncements,
  bulkArchiveAnnouncements,
  bulkDeleteAnnouncements,
} from "./_actions/announcement";
import { getAllFestivals } from "../festivals/_actions/festival";
import {
  DeleteAnnouncementDialog,
  DuplicateAnnouncementDialog,
} from "./_components";
import type {
  AnnouncementListItem,
  AnnouncementStatus,
  AnnouncementStats,
  AnnouncementPriority,
  AnnouncementVisibility,
  PaginatedAnnouncements,
  FestivalListItem,
  AnnouncementWithRelations,
} from "@gameverse/types";
import {
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_STATUS_COLORS,
  ANNOUNCEMENT_PRIORITY_LABELS,
  ANNOUNCEMENT_PRIORITY_COLORS,
  ANNOUNCEMENT_VISIBILITY_LABELS,
} from "@gameverse/types";

const STATUS_OPTIONS: { value: AnnouncementStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const PRIORITY_OPTIONS: { value: AnnouncementPriority | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const VISIBILITY_OPTIONS: { value: AnnouncementVisibility | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Visibility" },
  { value: "PUBLIC", label: "Public" },
  { value: "MEMBERS_ONLY", label: "Members Only" },
  { value: "ADMINS_ONLY", label: "Admins Only" },
];

export default function AnnouncementsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [announcements, setAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL" as AnnouncementStatus | "ALL",
    priority: "ALL" as AnnouncementPriority | "ALL",
    visibility: "ALL" as AnnouncementVisibility | "ALL",
    festivalId: "ALL",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementWithRelations | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAnnouncements({
        search: filters.search || undefined,
        status: filters.status === "ALL" ? undefined : filters.status,
        priority: filters.priority === "ALL" ? undefined : filters.priority,
        visibility: filters.visibility === "ALL" ? undefined : filters.visibility,
        festivalId: filters.festivalId === "ALL" ? undefined : filters.festivalId,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
        page: pagination.page,
        perPage: pagination.perPage,
      });
      if (result.success && result.data) {
        setAnnouncements(result.data.announcements);
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
    const result = await getAnnouncementStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  }, []);

  const fetchFestivals = useCallback(async () => {
    const result = await getAllFestivals();
    if (result.success && result.data) {
      setFestivals(result.data);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    fetchStats();
    fetchFestivals();
  }, [fetchStats, fetchFestivals]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as AnnouncementStatus | "ALL",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePriorityFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: value as AnnouncementPriority | "ALL",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleVisibilityFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      visibility: value as AnnouncementVisibility | "ALL",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFestivalFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, festivalId: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDateFromFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, dateFrom: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDateToFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, dateTo: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === announcements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(announcements.map((a) => a.id));
    }
  };

  const handleSelectAnnouncement = (id: string) => {
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
          result = await bulkDeleteAnnouncements(selectedIds);
          break;
        case "publish":
          result = await bulkPublishAnnouncements(selectedIds);
          break;
        case "archive":
          result = await bulkArchiveAnnouncements(selectedIds);
          break;
      }

      if (result?.success) {
        setSelectedIds([]);
        fetchAnnouncements();
        fetchStats();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedAnnouncement(null);
        fetchAnnouncements();
        fetchStats();
      }
    });
  };

  const handlePublish = async (id: string) => {
    startTransition(async () => {
      const result = await publishAnnouncement(id);
      if (result.success) {
        fetchAnnouncements();
        fetchStats();
      }
    });
  };

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      const result = await archiveAnnouncement(id);
      if (result.success) {
        fetchAnnouncements();
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
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Manage announcements, news, and updates for your community
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/announcements/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total
              </CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnnouncements}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Draft
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftAnnouncements}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Scheduled
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledAnnouncements}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Published
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedAnnouncements}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Archived
              </CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archivedAnnouncements}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Announcement List</CardTitle>
          <CardDescription>
            View and manage all your announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filters Row 1: Search and Dropdowns */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.priority}
                onValueChange={handlePriorityFilter}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.visibility}
                onValueChange={handleVisibilityFilter}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters Row 2: Festival and Date Range */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select
                value={filters.festivalId}
                onValueChange={handleFestivalFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by festival" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Festivals</SelectItem>
                  {festivals.map((festival) => (
                    <SelectItem key={festival.id} value={festival.id}>
                      {festival.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleDateFromFilter(e.target.value)}
                  className="w-full sm:w-[160px]"
                  placeholder="From"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleDateToFilter(e.target.value)}
                  className="w-full sm:w-[160px]"
                  placeholder="To"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selected
                  </span>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkAction("publish")}
                    disabled={isPending}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Publish
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
                    onClick={() => handleBulkAction("delete")}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Skeletons */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 rounded-lg border p-4"
                  >
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No announcements found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filters.search ||
                  filters.status !== "ALL" ||
                  filters.priority !== "ALL" ||
                  filters.visibility !== "ALL" ||
                  filters.festivalId !== "ALL" ||
                  filters.dateFrom ||
                  filters.dateTo
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first announcement to get started"}
                </p>
                {!filters.search &&
                  filters.status === "ALL" &&
                  filters.priority === "ALL" &&
                  filters.visibility === "ALL" &&
                  filters.festivalId === "ALL" &&
                  !filters.dateFrom &&
                  !filters.dateTo && (
                    <Button
                      className="mt-4"
                      onClick={() =>
                        router.push("/dashboard/announcements/new")
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Announcement
                    </Button>
                  )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All Header */}
                <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                  <Checkbox
                    checked={
                      selectedIds.length === announcements.length &&
                      announcements.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium w-[220px]">
                    Title
                  </span>
                  <span className="text-sm font-medium w-[90px]">
                    Status
                  </span>
                  <span className="text-sm font-medium w-[80px]">
                    Priority
                  </span>
                  <span className="text-sm font-medium w-[100px]">
                    Visibility
                  </span>
                  <span className="text-sm font-medium w-[120px]">
                    Author
                  </span>
                  <span className="text-sm font-medium w-[60px]">
                    Views
                  </span>
                  <span className="text-sm font-medium w-[90px]">
                    Created
                  </span>
                  <span className="ml-auto text-sm font-medium">
                    Actions
                  </span>
                </div>

                {/* Announcement Items */}
                <AnimatePresence>
                  {announcements.map((announcement) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedIds.includes(announcement.id)}
                        onCheckedChange={() =>
                          handleSelectAnnouncement(announcement.id)
                        }
                      />
                      <div className="flex-1 min-w-0 w-[220px]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/announcements/${announcement.id}`
                              )
                            }
                            className="font-medium hover:underline truncate"
                          >
                            {announcement.title}
                          </button>
                          {announcement.isPinned && (
                            <Pin className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {announcement.summary || announcement.slug}
                        </p>
                      </div>
                      <div className="w-[90px]">
                        <Badge
                          className={`${ANNOUNCEMENT_STATUS_COLORS[announcement.status]} flex items-center gap-1`}
                        >
                          {ANNOUNCEMENT_STATUS_LABELS[announcement.status]}
                        </Badge>
                      </div>
                      <div className="w-[80px]">
                        <Badge
                          className={`${ANNOUNCEMENT_PRIORITY_COLORS[announcement.priority]} flex items-center gap-1`}
                        >
                          {ANNOUNCEMENT_PRIORITY_LABELS[announcement.priority]}
                        </Badge>
                      </div>
                      <div className="w-[100px]">
                        <Badge variant="outline">
                          {ANNOUNCEMENT_VISIBILITY_LABELS[announcement.visibility]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground w-[120px] truncate">
                        {announcement.author?.username || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground w-[60px] text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {announcement.viewCount}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground w-[90px]">
                        {formatDate(announcement.createdAt)}
                      </div>
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
                                `/dashboard/announcements/${announcement.id}`
                              )
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/dashboard/announcements/${announcement.id}/edit`
                              )
                            }
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {announcement.status === "DRAFT" && (
                            <DropdownMenuItem
                              onClick={() => handlePublish(announcement.id)}
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {announcement.status !== "ARCHIVED" && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(announcement.id)}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAnnouncement(announcement as any);
                              setDuplicateDialogOpen(true);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAnnouncement(announcement as any);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.perPage + 1}{" "}
                  to{" "}
                  {Math.min(
                    pagination.page * pagination.perPage,
                    pagination.total
                  )}{" "}
                  of {pagination.total} announcements
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

      {/* Dialogs */}
      {selectedAnnouncement && (
        <>
          <DeleteAnnouncementDialog
            announcementTitle={selectedAnnouncement.title}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={() => handleDelete(selectedAnnouncement.id)}
            isPending={isPending}
          />
          <DuplicateAnnouncementDialog
            announcement={selectedAnnouncement}
            open={duplicateDialogOpen}
            onOpenChange={setDuplicateDialogOpen}
          />
        </>
      )}
    </div>
  );
}
