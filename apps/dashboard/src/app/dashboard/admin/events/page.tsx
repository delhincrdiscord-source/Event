"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, MoreHorizontal, Archive, Trash2, Copy, Eye, RefreshCw, CalendarDays, CheckCircle2, FileText, List, CalendarIcon, Users,  } from "lucide-react";
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
  getEvents,
  getEventStats,
  deleteEvent,
  restoreEvent,
  publishEvent,
  unpublishEvent,
  archiveEvent,
  bulkDeleteEvents,
  bulkPublishEvents,
  bulkArchiveEvents,
  bulkUpdateEventStatus,
} from "./_actions/event";
import { getAllCategories } from "../categories/_actions/category";
import { getAllFestivals } from "../festivals/_actions/festival";
import {
  DeleteEventDialog,
  DuplicateEventDialog,
  PublishEventDialog,
  CalendarView,
} from "./_components";
import type { CommunityEventListItem, EventStatus, EventStats, EventCategoryListItem, FestivalListItem,  } from "@gameverse/types";
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  EVENT_VISIBILITY_LABELS,
  EVENT_VISIBILITY_COLORS,
} from "@gameverse/types";

const STATUS_OPTIONS: { value: EventStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "LIVE", label: "Live" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_ICONS: Record<EventStatus, React.ReactNode> = {
  DRAFT: <FileText className="h-4 w-4" />,
  PUBLISHED: <Globe className="h-4 w-4" />,
  LIVE: <CheckCircle2 className="h-4 w-4" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
  ARCHIVED: <Archive className="h-4 w-4" />,
};

function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function XCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

export default function EventsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<CommunityEventListItem[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [categories, setCategories] = useState<EventCategoryListItem[]>([]);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL\" as EventStatus | \"ALL",
    categoryId: "ALL",
    festivalId: "ALL",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CommunityEventListItem | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      let result = await getEvents({
        search: filters.search || undefined,
        status: filters.status === "ALL" ? undefined : filters.status,
        categoryId: filters.categoryId === "ALL" ? undefined : filters.categoryId,
        festivalId: filters.festivalId === "ALL" ? undefined : filters.festivalId,
        page: pagination.page,
        perPage: pagination.perPage,
        sortBy: "startDate",
        sortOrder: "desc",
      });
      if (result.success && result.data) {
        setEvents(result.data.events);
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
    let result = await getEventStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    let result = await getAllCategories();
    if (result.success && result.data) {
      setCategories(result.data);
    }
  }, []);

  const fetchFestivals = useCallback(async () => {
    let result = await getAllFestivals();
    if (result.success && result.data) {
      setFestivals(result.data);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchStats();
    fetchCategories();
    fetchFestivals();
  }, [fetchStats, fetchCategories, fetchFestivals]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as EventStatus | "ALL",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCategoryFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, categoryId: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFestivalFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, festivalId: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === events.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(events.map((e) => e.id));
    }
  };

  const handleSelectEvent = (id: string) => {
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
          result = await bulkDeleteEvents({ eventIds: selectedIds });
          break;
        case "publish":
          result = await bulkPublishEvents({ eventIds: selectedIds });
          break;
        case "archive":
          result = await bulkArchiveEvents({ eventIds: selectedIds });
          break;
        case "DRAFT": case"PUBLISHED": case"LIVE": case"COMPLETED": case"ARCHIVED":
          result = await bulkUpdateEventStatus(selectedIds, action);
          break;
      }

      if (result?.success) {
        setSelectedIds([]);
        fetchEvents();
        fetchStats();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      let result = await deleteEvent(id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedEvent(null);
        fetchEvents();
        fetchStats();
      }
    });
  };

  const handlePublish = async (id: string) => {
    startTransition(async () => {
      let result = await publishEvent(id);
      if (result.success) {
        setPublishDialogOpen(false);
        setSelectedEvent(null);
        fetchEvents();
        fetchStats();
      }
    });
  };

  const handleUnpublish = async (id: string) => {
    startTransition(async () => {
      let result = await unpublishEvent(id);
      if (result.success) {
        setPublishDialogOpen(false);
        setSelectedEvent(null);
        fetchEvents();
        fetchStats();
      }
    });
  };

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      let result = await archiveEvent(id);
      if (result.success) {
        fetchEvents();
        fetchStats();
      }
    });
  };

  const handleRestore = async (id: string) => {
    startTransition(async () => {
      let result = await restoreEvent(id);
      if (result.success) {
        fetchEvents();
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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Manage your community events and activities
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/events/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Events
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Draft Events
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Published Events
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Events</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.liveEvents}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters and View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event List</CardTitle>
              <CardDescription>
                View and manage all your events
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
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
              <Select
                value={filters.categoryId}
                onValueChange={handleCategoryFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.emoji && `${category.emoji} `}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    onClick={() => handleBulkAction("delete")}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
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
                    onClick={() => handleBulkAction("LIVE")}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Set Live
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calendar View */}
            {viewMode === "calendar" ? (
              <CalendarView
                festivalId={
                  filters.festivalId === "ALL"
                    ? undefined
                    : filters.festivalId
                }
              />
            ) : (
              <>
                {/* Event List */}
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
                ) : events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No events found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {filters.search ||
                      filters.status !== "ALL" ||
                      filters.categoryId !== "ALL" ||
                      filters.festivalId !== "ALL" ?"Try adjusting your search or filter criteria" :"Create your first event to get started"}
                    </p>
                    {!filters.search &&
                      filters.status === "ALL" &&
                      filters.categoryId === "ALL" &&
                      filters.festivalId === "ALL" && (
                        <Button
                          className="mt-4"
                          onClick={() =>
                            router.push("/dashboard/events/new")
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Event
                        </Button>
                      )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Select All Header */}
                    <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                      <Checkbox
                        checked={
                          selectedIds.length === events.length &&
                          events.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium w-[250px]">
                        Title
                      </span>
                      <span className="text-sm font-medium w-[120px]">
                        Category
                      </span>
                      <span className="text-sm font-medium w-[150px]">
                        Date/Time
                      </span>
                      <span className="text-sm font-medium w-[100px]">
                        Status
                      </span>
                      <span className="text-sm font-medium w-[120px]">
                        Visibility
                      </span>
                      <span className="text-sm font-medium w-[80px]">
                        RSVPs
                      </span>
                      <span className="ml-auto text-sm font-medium">
                        Actions
                      </span>
                    </div>

                    {/* Event Items */}
                    <AnimatePresence>
                      {events.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedIds.includes(event.id)}
                            onCheckedChange={() =>
                              handleSelectEvent(event.id)
                            }
                          />
                          <div className="flex-1 min-w-0 w-[250px]">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/events/${event.id}`
                                  )
                                }
                                className="font-medium hover:underline truncate"
                              >
                                {event.category?.emoji && (
                                  <span className="mr-1">
                                    {event.category.emoji}
                                  </span>
                                )}
                                {event.title}
                              </button>
                              {event.isFeatured && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                >
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {event.shortDescription || event.slug}
                            </p>
                          </div>
                          <div className="w-[120px]">
                            {event.category && (
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: event.category.color + "20",
                                  color: event.category.color,
                                  borderColor: event.category.color + "40",
                                }}
                              >
                                {event.category.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground w-[150px]">
                            <div>{formatDate(event.startDate)}</div>
                            <div className="text-xs">
                              {formatTime(event.startDate)} -{" "}
                              {formatTime(event.endDate)}
                            </div>
                          </div>
                          <div className="w-[100px]">
                            <Badge
                              className={`${EVENT_STATUS_COLORS[event.status]} flex items-center gap-1`}
                            >
                              {STATUS_ICONS[event.status]}
                              {EVENT_STATUS_LABELS[event.status]}
                            </Badge>
                          </div>
                          <div className="w-[120px]">
                            <Badge
                              className={`${EVENT_VISIBILITY_COLORS[event.visibility]} flex items-center gap-1`}
                            >
                              {EVENT_VISIBILITY_LABELS[event.visibility]}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground w-[80px] text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-4 w-4" />
                              {event._count?.rsvps || 0}
                            </div>
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
                                    `/dashboard/events/${event.id}`
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/events/${event.id}/edit`
                                  )
                                }
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {event.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setPublishDialogOpen(true);
                                  }}
                                >
                                  <Globe className="mr-2 h-4 w-4" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {event.status === "PUBLISHED" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setPublishDialogOpen(true);
                                  }}
                                >
                                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                                  Unpublish
                                </DropdownMenuItem>
                              )}
                              {event.status !== "ARCHIVED" && (
                                <DropdownMenuItem
                                  onClick={() => handleArchive(event.id)}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              {event.status === "ARCHIVED" && (
                                <DropdownMenuItem
                                  onClick={() => handleRestore(event.id)}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Restore
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setDuplicateDialogOpen(true);
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEvent(event);
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
                      of {pagination.total} events
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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedEvent && (
        <>
          <DeleteEventDialog
            eventTitle={selectedEvent.title}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={() => handleDelete(selectedEvent.id)}
            isPending={isPending}
          />
          <DuplicateEventDialog
            event={selectedEvent as any}
            open={duplicateDialogOpen}
            onOpenChange={setDuplicateDialogOpen}
          />
          <PublishEventDialog
            eventTitle={selectedEvent.title}
            isPublished={selectedEvent.status === "PUBLISHED"}
            open={publishDialogOpen}
            onOpenChange={setPublishDialogOpen}
            onConfirm={() =>
              selectedEvent.status === "PUBLISHED"
                ? handleUnpublish(selectedEvent.id)
                : handlePublish(selectedEvent.id)
            }
            isPending={isPending}
          />
        </>
      )}
    </div>
  );
}

function ArrowUpFromLine(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}
