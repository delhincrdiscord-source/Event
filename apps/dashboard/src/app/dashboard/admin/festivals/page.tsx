"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, MoreHorizontal, Archive, Trash2, Copy, Eye, RefreshCw, CheckCircle2, FileText, Clock, Users, Zap, Trophy, Play, Pause, Filter, SortAsc, Star, AlertTriangle, RotateCcw, Pencil,  } from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Badge } from "@gameverse/ui/badge";
import { Card, CardContent,  } from "@gameverse/ui/card";
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


import { getFestivals, getFestivalStats, deleteFestival, archiveFestival, restoreFestival, updateFestival,  } from "./_actions/festival";
import {
  ArchiveFestivalDialog,
  DeleteFestivalDialog,
  DuplicateFestivalDialog,
  RestoreFestivalDialog,
} from "./_components";
import type { FestivalListItem, FestivalStatus, FestivalStats, Festival } from "@gameverse/types";


// =====================================================
// Extended status types for UI (beyond DB schema)
// =====================================================

const EXTENDED_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; dot: string }> = {
  DRAFT: {
    label: "Draft",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: <FileText className="h-3 w-3" />,
    dot: "bg-slate-400",
  },
  UPCOMING: {
    label: "Upcoming",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: <Clock className="h-3 w-3" />,
    dot: "bg-blue-400",
  },
  REGISTRATION_OPEN: {
    label: "Registration Open",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: <CheckCircle2 className="h-3 w-3" />,
    dot: "bg-emerald-400 animate-pulse",
  },
  REGISTRATION_CLOSED: {
    label: "Registration Closed",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: <AlertTriangle className="h-3 w-3" />,
    dot: "bg-amber-400",
  },
  LIVE: {
    label: "Active",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    icon: <Play className="h-3 w-3" />,
    dot: "bg-green-400 animate-pulse",
  },
  PAUSED: {
    label: "Paused",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: <Pause className="h-3 w-3" />,
    dot: "bg-orange-400",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: <Trophy className="h-3 w-3" />,
    dot: "bg-purple-400",
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: <Archive className="h-3 w-3" />,
    dot: "bg-rose-400",
  },
};

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "LIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "createdAt_asc", label: "Oldest First" },
  { value: "startDate_asc", label: "Starting Soon" },
  { value: "name_asc", label: "Name A–Z" },
];

// =====================================================
// Stat Card Component
// =====================================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, gradient, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden border-border/50">
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors group">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Festival Status Badge
// =====================================================

function StatusBadge({ status }: { status: string }) {
  const config = EXTENDED_STATUS_CONFIG[status] ?? EXTENDED_STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.border} ${config.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// =====================================================
// Festival Card Component
// =====================================================

interface FestivalCardProps {
  festival: FestivalListItem;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onPause: () => void;
  onResume: () => void;
  isPending: boolean;
}

function FestivalCard({
  festival,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  onPause,
  onResume,
  isPending,
}: FestivalCardProps) {
  const startDate = new Date(festival.startDate);
  const endDate = new Date(festival.endDate);
  const now = new Date();
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const regStatus = festival.status === "LIVE" ? "REGISTRATION_OPEN" : festival.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden rounded-xl border border-border/50 bg-card hover:border-border hover:shadow-lg transition-all duration-300"
    >
      {/* Banner */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
        {(festival as any).bannerUrl ? (
          <img
            src={(festival as any).bannerUrl}
            alt={`${festival.name} banner`}
            className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${(festival as any).themeColor ?? "#5865F2"}33 0%, ${(festival as any).themeColor ?? "#5865F2"}11 100%)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Star className="h-24 w-24" />
            </div>
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={festival.status} />
        </div>
        {/* Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {festival.status === "LIVE" && (
                <DropdownMenuItem onClick={onPause}>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </DropdownMenuItem>
              )}
              {festival.status === "DRAFT" || festival.status === "UPCOMING" ? (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
              ) : null}
              {festival.status === "ARCHIVED" && (
                <DropdownMenuItem onClick={onRestore}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Restore
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Logo */}
        <div className="absolute -bottom-5 left-4">
          <div className="h-10 w-10 rounded-lg border-2 border-background bg-card overflow-hidden shadow-md">
            {(festival as any).logoUrl ? (
              <img src={(festival as any).logoUrl} alt={`${festival.name} logo`} className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: (festival as any).themeColor ?? "#5865F2" }}
              >
                {festival.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-7 px-4 pb-4 space-y-3">
        <div>
          <button onClick={onView} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1 text-left">
            {festival.name}
          </button>
          {(festival as any).shortDescription && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{(festival as any).shortDescription}</p>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{formatDate(festival.startDate)} – {formatDate(festival.endDate)}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{festival._count?.registrations ?? 0} participants</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>{festival._count?.events ?? 0} events</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: (festival as any).themeColor ?? "#5865F2" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================================
// Main Page
// =====================================================

export default function FestivalsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [stats, setStats] = useState<FestivalStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, perPage: 12, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortValue, setSortValue] = useState("createdAt_desc");
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Dialog state
  const [archiveTarget, setArchiveTarget] = useState<FestivalListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FestivalListItem | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Festival | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<FestivalListItem | null>(null);

  const [sortBy, sortOrder] = sortValue.split("_") as [string, "asc" | "desc"];

  const fetchFestivals = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getFestivals({
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : (statusFilter as FestivalStatus),
        page: pagination.page,
        perPage: pagination.perPage,
        sortBy: sortBy as "name" | "startDate" | "endDate" | "createdAt" | "status",
        sortOrder,
      });
      if (result.success && result.data) {
        setFestivals(result.data.festivals);
        setPagination((prev) => ({ ...prev, total: result.data.total, totalPages: result.data.totalPages }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.perPage, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const result = await getFestivalStats();
    if (result.success && result.data) setStats(result.data);
    setStatsLoading(false);
  }, []);

  useEffect(() => { fetchFestivals(); }, [fetchFestivals]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const refresh = () => { fetchFestivals(); fetchStats(); };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    startTransition(async () => {
      await archiveFestival(archiveTarget.id);
      setArchiveTarget(null);
      refresh();
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteFestival(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    });
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    startTransition(async () => {
      await restoreFestival(restoreTarget.id);
      setRestoreTarget(null);
      refresh();
    });
  };

  const handlePause = async (id: string) => {
    startTransition(async () => {
      await updateFestival(id, { status: "UPCOMING" });
      refresh();
    });
  };

  const handleResume = async (id: string) => {
    startTransition(async () => {
      await updateFestival(id, { status: "LIVE" });
      refresh();
    });
  };

  const statCards = [
    { title: "Total Festivals", value: stats?.totalFestivals ?? 0, icon: <Calendar className="h-4 w-4 text-blue-400" />, color: "bg-blue-500/10", gradient: "bg-gradient-to-br from-blue-500/5 to-transparent" },
    { title: "Active Festival", value: stats?.liveFestivals ?? 0, icon: <Play className="h-4 w-4 text-green-400" />, color: "bg-green-500/10", gradient: "bg-gradient-to-br from-green-500/5 to-transparent" },
    { title: "Upcoming", value: stats?.upcomingFestivals ?? 0, icon: <Clock className="h-4 w-4 text-sky-400" />, color: "bg-sky-500/10", gradient: "bg-gradient-to-br from-sky-500/5 to-transparent" },
    { title: "Completed", value: stats?.completedFestivals ?? 0, icon: <Trophy className="h-4 w-4 text-purple-400" />, color: "bg-purple-500/10", gradient: "bg-gradient-to-br from-purple-500/5 to-transparent" },
    { title: "Draft", value: stats?.draftFestivals ?? 0, icon: <FileText className="h-4 w-4 text-slate-400" />, color: "bg-slate-500/10", gradient: "bg-gradient-to-br from-slate-500/5 to-transparent" },
    { title: "Archived", value: stats?.archivedFestivals ?? 0, icon: <Archive className="h-4 w-4 text-rose-400" />, color: "bg-rose-500/10", gradient: "bg-gradient-to-br from-rose-500/5 to-transparent" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            🎉 Festivals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all GameVerse Festival seasons from one place.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/admin/festivals/new")}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Festival
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by festival name or season..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((p) => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-[160px] gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortValue} onValueChange={setSortValue}>
            <SelectTrigger className="w-[160px] gap-2">
              <SortAsc className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Festival Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : festivals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-20 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No festivals found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {search || statusFilter !== "ALL" ?"Try adjusting your search or filter criteria." :"Create your first GameVerse Festival season to get started."}
          </p>
          {!search && statusFilter === "ALL" && (
            <Button className="mt-5 gap-2" onClick={() => router.push("/dashboard/admin/festivals/new")}>
              <Plus className="h-4 w-4" /> Create Festival
            </Button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {festivals.map((festival) => (
              <FestivalCard
                key={festival.id}
                festival={festival}
                isPending={isPending}
                onView={() => router.push(`/dashboard/admin/festivals/${festival.id}`)}
                onEdit={() => router.push(`/dashboard/admin/festivals/${festival.id}/edit`)}
                onDuplicate={() => setDuplicateTarget(festival as unknown as Festival)}
                onArchive={() => setArchiveTarget(festival)}
                onRestore={() => setRestoreTarget(festival)}
                onDelete={() => setDeleteTarget(festival)}
                onPause={() => handlePause(festival.id)}
                onResume={() => handleResume(festival.id)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.perPage + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} festivals
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm tabular-nums">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ArchiveFestivalDialog
        festivalName={archiveTarget?.name ?? ""}
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        isPending={isPending}
      />
      <DeleteFestivalDialog
        festivalName={deleteTarget?.name ?? ""}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isPending={isPending}
      />
      {duplicateTarget && (
        <DuplicateFestivalDialog
          festival={duplicateTarget}
          open={!!duplicateTarget}
          onOpenChange={(open) => !open && setDuplicateTarget(null)}
        />
      )}
      <RestoreFestivalDialog
        festivalName={restoreTarget?.name ?? ""}
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        onConfirm={handleRestoreConfirm}
        isPending={isPending}
      />
    </div>
  );
}
