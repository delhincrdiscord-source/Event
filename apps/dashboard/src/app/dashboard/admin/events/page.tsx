"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, MoreHorizontal, Archive, Trash2, Copy, Eye, RefreshCw, CalendarDays, CheckCircle2, FileText, List, CalendarIcon, Users, Pause, XCircle, Clock, UserCheck, Radio, LayoutGrid, Table2, AlertTriangle, RotateCcw, Pencil, Timer,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Badge } from "@gameverse/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gameverse/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@gameverse/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@gameverse/ui/select";
import { Skeleton } from "@gameverse/ui/skeleton";
import { Separator } from "@gameverse/ui/separator";
import { Checkbox } from "@gameverse/ui/checkbox";

import {
  getEvents, getEventStats, deleteEvent, restoreEvent, publishEvent,
  unpublishEvent, archiveEvent, bulkDeleteEvents, bulkPublishEvents,
  bulkArchiveEvents, bulkUpdateEventStatus,
} from "./_actions/event";
import { getAllCategories } from "../categories/_actions/category";
import { getAllFestivals } from "../festivals/_actions/festival";
import { DeleteEventDialog, DuplicateEventDialog, PublishEventDialog, CalendarView } from "./_components";
import type { CommunityEventListItem, EventStatus, EventStats, EventCategoryListItem, FestivalListItem } from "@gameverse/types";


// ─── Extended Status Config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: "Draft", color: "text-slate-400", bg: "bg-slate-500/10",
    border: "border-slate-500/20", dot: "bg-slate-400",
    icon: <FileText className="h-3 w-3" />,
  },
  UPCOMING: {
    label: "Upcoming", color: "text-blue-400", bg: "bg-blue-500/10",
    border: "border-blue-500/20", dot: "bg-blue-400",
    icon: <Clock className="h-3 w-3" />,
  },
  PUBLISHED: {
    label: "Registration Open", color: "text-emerald-400", bg: "bg-emerald-500/10",
    border: "border-emerald-500/20", dot: "bg-emerald-400 animate-pulse",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REGISTRATION_CLOSED: {
    label: "Registration Closed", color: "text-amber-400", bg: "bg-amber-500/10",
    border: "border-amber-500/20", dot: "bg-amber-400",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  LIVE: {
    label: "Live", color: "text-green-400", bg: "bg-green-500/10",
    border: "border-green-500/20", dot: "bg-green-400 animate-pulse",
    icon: <Radio className="h-3 w-3" />,
  },
  PAUSED: {
    label: "Paused", color: "text-orange-400", bg: "bg-orange-500/10",
    border: "border-orange-500/20", dot: "bg-orange-400",
    icon: <Pause className="h-3 w-3" />,
  },
  COMPLETED: {
    label: "Completed", color: "text-purple-400", bg: "bg-purple-500/10",
    border: "border-purple-500/20", dot: "bg-purple-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10",
    border: "border-red-500/20", dot: "bg-red-400",
    icon: <XCircle className="h-3 w-3" />,
  },
  ARCHIVED: {
    label: "Archived", color: "text-zinc-400", bg: "bg-zinc-500/10",
    border: "border-zinc-500/20", dot: "bg-zinc-400",
    icon: <Archive className="h-3 w-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const SORT_OPTIONS = [
  { value: "startDate_desc", label: "Upcoming First" },
  { value: "startDate_asc", label: "Oldest First" },
  { value: "createdAt_desc", label: "Newest Created" },
  { value: "createdAt_asc", label: "Oldest Created" },
  { value: "title_asc", label: "Name A–Z" },
];

export default function EventsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<CommunityEventListItem[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [categories, setCategories] = useState<EventCategoryListItem[]>([]);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 12, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ search: "", status: "ALL", categoryId: "ALL", festivalId: "ALL" });
  const [sort, setSort] = useState("startDate_desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "table" | "calendar">("card");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEventListItem | null>(null);
  const [liveEvents, setLiveEvents] = useState<CommunityEventListItem[]>([]);
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, string>>({});

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sortBy, sortOrder] = sort.split("_") as [string, "asc" | "desc"];
      let result = await getEvents({
        search: filters.search || undefined,
        status: filters.status === "ALL" ? undefined : filters.status as EventStatus,
        categoryId: filters.categoryId === "ALL" ? undefined : filters.categoryId,
        festivalId: filters.festivalId === "ALL" ? undefined : filters.festivalId,
        page: pagination.page,
        perPage: pagination.perPage,
        sortBy: sortBy as any,
        sortOrder,
      });
      if (result.success && result.data) {
        setEvents(result.data.events);
        setPagination(prev => ({ ...prev, total: result.data.total, totalPages: result.data.totalPages }));
        setLiveEvents(result.data.events.filter(e => e.status === "LIVE"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage, sort]);

  const fetchStats = useCallback(async () => {
    let result = await getEventStats();
    if (result.success && result.data) setStats(result.data);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchStats(); getAllCategories().then(r => r.success && r.data && setCategories(r.data)); getAllFestivals().then(r => r.success && r.data && setFestivals(r.data)); }, [fetchStats]);

  // Live elapsed timer
  useEffect(() => {
    if (!liveEvents.length) return;
    const interval = setInterval(() => {
      const times: Record<string, string> = {};
      liveEvents.forEach(e => {
        const diff = Date.now() - new Date(e.startDate).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        times[e.id] = `${h > 0 ? h + "h " : ""}${m}m ${s}s`;
      });
      setElapsedTimes(times);
    }, 1000);
    return () => clearInterval(interval);
  }, [liveEvents]);

  const handleSearch = (v: string) => { setFilters(p => ({ ...p, search: v })); setPagination(p => ({ ...p, page: 1 })); };
  const handleStatusFilter = (v: string) => { setFilters(p => ({ ...p, status: v })); setPagination(p => ({ ...p, page: 1 })); };
  const handleCategoryFilter = (v: string) => { setFilters(p => ({ ...p, categoryId: v })); setPagination(p => ({ ...p, page: 1 })); };
  const handleFestivalFilter = (v: string) => { setFilters(p => ({ ...p, festivalId: v })); setPagination(p => ({ ...p, page: 1 })); };
  const handlePageChange = (n: number) => setPagination(p => ({ ...p, page: n }));
  const handleSelectAll = () => setSelectedIds(selectedIds.length === events.length ? [] : events.map(e => e.id));
  const handleSelectEvent = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const handleBulkAction = async (action: string) => {
    if (!selectedIds.length) return;
    startTransition(async () => {
      let result: any;
      if (action === "delete") result = await bulkDeleteEvents({ eventIds: selectedIds });
      else if (action === "publish") result = await bulkPublishEvents({ eventIds: selectedIds });
      else if (action === "archive") result = await bulkArchiveEvents({ eventIds: selectedIds });
      else result = await bulkUpdateEventStatus(selectedIds, action as EventStatus);
      if (result?.success) { setSelectedIds([]); fetchEvents(); fetchStats(); }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const r = await deleteEvent(id);
      if (r.success) { setDeleteDialogOpen(false); setSelectedEvent(null); fetchEvents(); fetchStats(); }
    });
  };

  const handlePublish = async (id: string) => {
    startTransition(async () => {
      const r = await publishEvent(id);
      if (r.success) { setPublishDialogOpen(false); setSelectedEvent(null); fetchEvents(); fetchStats(); }
    });
  };

  const handleUnpublish = async (id: string) => {
    startTransition(async () => {
      const r = await unpublishEvent(id);
      if (r.success) { setPublishDialogOpen(false); setSelectedEvent(null); fetchEvents(); fetchStats(); }
    });
  };

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      const r = await archiveEvent(id);
      if (r.success) { fetchEvents(); fetchStats(); }
    });
  };

  const handleRestore = async (id: string) => {
    startTransition(async () => {
      const r = await restoreEvent(id);
      if (r.success) { fetchEvents(); fetchStats(); }
    });
  };

  const formatDate = (d: Date) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  const formatTime = (d: Date) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const getDuration = (start: Date, end: Date) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const statsCards = stats ? [
    { label: "Total Events", value: stats.totalEvents, icon: CalendarDays, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Upcoming", value: stats.publishedEvents, icon: Clock, color: "text-sky-400", bg: "bg-sky-500/10" },
    { label: "Live Now", value: stats.liveEvents, icon: Radio, color: "text-green-400", bg: "bg-green-500/10", pulse: true },
    { label: "Completed", value: stats.completedEvents, icon: CheckCircle2, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Cancelled", value: stats.cancelledEvents, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Draft", value: stats.draftEvents, icon: FileText, color: "text-slate-400", bg: "bg-slate-500/10" },
    { label: "Archived", value: stats.archivedEvents, icon: Archive, color: "text-zinc-400", bg: "bg-zinc-500/10" },
    { label: "Active Hosts", value: liveEvents.length, icon: UserCheck, color: "text-amber-400", bg: "bg-amber-500/10" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            Events
          </h1>
          <p className="text-muted-foreground mt-1">Create, schedule, manage and monitor all festival events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchEvents(); fetchStats(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => router.push("/dashboard/admin/events/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Dashboard Summary */}
      {isLoading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.label}</p>
                        <p className="text-3xl font-bold mt-1">{card.value}</p>
                      </div>
                      <div className={`rounded-xl p-3 ${card.bg}`}>
                        <Icon className={`h-5 w-5 ${card.color} ${(card as any).pulse ? "animate-pulse" : ""}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Live Event Panel */}
      <AnimatePresence>
        {liveEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                  </span>
                  Live Events ({liveEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {liveEvents.map(event => (
                    <div key={event.id} className="rounded-lg border border-green-500/20 bg-background/50 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.festival?.name}</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">LIVE</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{elapsedTimes[event.id] || "0m 0s"}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event._count?.rsvps || 0}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => router.push(`/dashboard/admin/events/${event.id}`)}>
                          <Eye className="mr-1 h-3 w-3" />View
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => handleArchive(event.id)}>
                          <Pause className="mr-1 h-3 w-3" />End
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Event List</CardTitle>
              <CardDescription>View and manage all your events</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {[
                { mode: "card" as const, icon: LayoutGrid },
                { mode: "table" as const, icon: Table2 },
                { mode: "calendar" as const, icon: CalendarIcon },
              ].map(({ mode, icon: Icon }) => (
                <Button key={mode} variant={viewMode === mode ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setViewMode(mode)}>
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Search & Filters */}
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by event name, host, game..." value={filters.search} onChange={e => handleSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filters.status} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.festivalId} onValueChange={handleFestivalFilter}>
                <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Festival" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Festivals</SelectItem>
                  {festivals.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.categoryId} onValueChange={handleCategoryFilter}>
                <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji && `${c.emoji} `}{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-2">
                  <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
                  <Separator orientation="vertical" className="h-6" />
                  {[
                    { action: "publish", icon: CheckCircle2, label: "Publish" },
                    { action: "LIVE", icon: Radio, label: "Set Live" },
                    { action: "archive", icon: Archive, label: "Archive" },
                    { action: "delete", icon: Trash2, label: "Delete" },
                  ].map(({ action, icon: Icon, label }) => (
                    <Button key={action} variant="ghost" size="sm" onClick={() => handleBulkAction(action)} disabled={isPending}>
                      <Icon className="mr-2 h-4 w-4" />{label}
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calendar View */}
            {viewMode === "calendar" ? (
              <CalendarView festivalId={filters.festivalId === "ALL" ? undefined : filters.festivalId} />
            ) : isLoading ? (
              <div className={viewMode === "card" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No events found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {filters.search || filters.status !== "ALL" ? "Try adjusting your search or filters" : "Create your first event to get started"}
                </p>
                {!filters.search && filters.status === "ALL" && (
                  <Button className="mt-4" onClick={() => router.push("/dashboard/admin/events/new")}>
                    <Plus className="mr-2 h-4 w-4" />Create Event
                  </Button>
                )}
              </div>
            ) : viewMode === "card" ? (
              /* Card View */
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {events.map((event, i) => (
                    <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className="group overflow-hidden hover:border-primary/30 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/admin/events/${event.id}`)}>
                        {/* Banner */}
                        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                          {event.thumbnailUrl ? (
                            <img src={event.thumbnailUrl} alt={event.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <CalendarDays className="h-12 w-12 text-primary/30" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <StatusBadge status={event.status} />
                          </div>
                          {event.isFeatured && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">⭐ Featured</Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                              {event.category?.emoji && <span className="mr-1">{event.category.emoji}</span>}
                              {event.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{event.festival?.name}</p>
                          </div>
                          {event.category && (
                            <Badge variant="outline" style={{ backgroundColor: event.category.color + "20", color: event.category.color, borderColor: event.category.color + "40" }} className="text-xs">
                              {event.category.name}
                            </Badge>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.startDate)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(event.startDate)}</span>
                            <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{getDuration(event.startDate, event.endDate)}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event._count?.rsvps || 0}{event.capacity ? `/${event.capacity}` : ""}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1" onClick={e => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.includes(event.id)} onCheckedChange={() => handleSelectEvent(event.id)} />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/events/${event.id}`)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/events/${event.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {event.status === "DRAFT" && <DropdownMenuItem onClick={() => { setSelectedEvent(event); setPublishDialogOpen(true); }}><CheckCircle2 className="mr-2 h-4 w-4" />Publish</DropdownMenuItem>}
                                {event.status === "PUBLISHED" && <DropdownMenuItem onClick={() => { setSelectedEvent(event); setPublishDialogOpen(true); }}><XCircle className="mr-2 h-4 w-4" />Unpublish</DropdownMenuItem>}
                                {event.status !== "LIVE" && event.status !== "ARCHIVED" && <DropdownMenuItem onClick={() => bulkUpdateEventStatus([event.id], "LIVE").then(() => { fetchEvents(); fetchStats(); })}><Radio className="mr-2 h-4 w-4" />Set Live</DropdownMenuItem>}
                                {event.status === "LIVE" && <DropdownMenuItem onClick={() => bulkUpdateEventStatus([event.id], "COMPLETED").then(() => { fetchEvents(); fetchStats(); })}><CheckCircle2 className="mr-2 h-4 w-4" />End Event</DropdownMenuItem>}
                                {event.status !== "ARCHIVED" && <DropdownMenuItem onClick={() => handleArchive(event.id)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>}
                                {event.status === "ARCHIVED" && <DropdownMenuItem onClick={() => handleRestore(event.id)}><RotateCcw className="mr-2 h-4 w-4" />Restore</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => { setSelectedEvent(event); setDuplicateDialogOpen(true); }}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedEvent(event); setDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* Table View */
              <div className="space-y-2">
                <div className="hidden md:flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2 text-sm font-medium">
                  <Checkbox checked={selectedIds.length === events.length && events.length > 0} onCheckedChange={handleSelectAll} />
                  <span className="flex-1">Event</span>
                  <span className="w-[120px]">Category</span>
                  <span className="w-[160px]">Date & Time</span>
                  <span className="w-[80px]">Duration</span>
                  <span className="w-[140px]">Status</span>
                  <span className="w-[70px] text-center">RSVPs</span>
                  <span className="w-8" />
                </div>
                <AnimatePresence>
                  {events.map((event, i) => (
                    <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}
                      className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                      <Checkbox checked={selectedIds.includes(event.id)} onCheckedChange={() => handleSelectEvent(event.id)} className="hidden md:flex" />
                      <div className="flex-1 min-w-0">
                        <button className="font-medium text-sm hover:text-primary transition-colors text-left" onClick={() => router.push(`/dashboard/admin/events/${event.id}`)}>
                          {event.category?.emoji && <span className="mr-1">{event.category.emoji}</span>}
                          {event.title}
                        </button>
                        <p className="text-xs text-muted-foreground">{event.festival?.name} · {event.shortDescription?.slice(0, 50) || event.slug}</p>
                      </div>
                      <div className="w-[120px]">
                        {event.category && (
                          <Badge variant="outline" style={{ backgroundColor: event.category.color + "20", color: event.category.color, borderColor: event.category.color + "40" }} className="text-xs">
                            {event.category.name}
                          </Badge>
                        )}
                      </div>
                      <div className="w-[160px] text-xs text-muted-foreground">
                        <div>{formatDate(event.startDate)}</div>
                        <div>{formatTime(event.startDate)} – {formatTime(event.endDate)}</div>
                      </div>
                      <div className="w-[80px] text-xs text-muted-foreground">{getDuration(event.startDate, event.endDate)}</div>
                      <div className="w-[140px]"><StatusBadge status={event.status} /></div>
                      <div className="w-[70px] text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />{event._count?.rsvps || 0}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/events/${event.id}`)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/events/${event.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {event.status === "DRAFT" && <DropdownMenuItem onClick={() => { setSelectedEvent(event); setPublishDialogOpen(true); }}><CheckCircle2 className="mr-2 h-4 w-4" />Publish</DropdownMenuItem>}
                          {event.status === "PUBLISHED" && <DropdownMenuItem onClick={() => { setSelectedEvent(event); setPublishDialogOpen(true); }}><XCircle className="mr-2 h-4 w-4" />Unpublish</DropdownMenuItem>}
                          {event.status !== "LIVE" && event.status !== "ARCHIVED" && <DropdownMenuItem onClick={() => bulkUpdateEventStatus([event.id], "LIVE").then(() => { fetchEvents(); fetchStats(); })}><Radio className="mr-2 h-4 w-4" />Set Live</DropdownMenuItem>}
                          {event.status === "LIVE" && <DropdownMenuItem onClick={() => bulkUpdateEventStatus([event.id], "COMPLETED").then(() => { fetchEvents(); fetchStats(); })}><CheckCircle2 className="mr-2 h-4 w-4" />End Event</DropdownMenuItem>}
                          {event.status !== "ARCHIVED" && <DropdownMenuItem onClick={() => handleArchive(event.id)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>}
                          {event.status === "ARCHIVED" && <DropdownMenuItem onClick={() => handleRestore(event.id)}><RotateCcw className="mr-2 h-4 w-4" />Restore</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => { setSelectedEvent(event); setDuplicateDialogOpen(true); }}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedEvent(event); setDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && viewMode !== "calendar" && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.perPage + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} events
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedEvent && (
        <>
          <DeleteEventDialog eventTitle={selectedEvent.title} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={() => handleDelete(selectedEvent.id)} isPending={isPending} />
          <DuplicateEventDialog event={selectedEvent as any} open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen} />
          <PublishEventDialog eventTitle={selectedEvent.title} isPublished={selectedEvent.status === "PUBLISHED"} open={publishDialogOpen} onOpenChange={setPublishDialogOpen}
            onConfirm={() => selectedEvent.status === "PUBLISHED" ? handleUnpublish(selectedEvent.id) : handlePublish(selectedEvent.id)} isPending={isPending} />
        </>
      )}
    </div>
  );
}
