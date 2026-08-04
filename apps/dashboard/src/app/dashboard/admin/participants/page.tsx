"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Download, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Shield, ShieldOff, Ban, Trophy, TrendingUp, TrendingDown, Activity, BarChart3, FileSpreadsheet, FileText, Printer, Crown, Zap, Calendar, Award, UserCheck, UserX,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@gameverse/ui/card";
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
import { Checkbox } from "@gameverse/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@gameverse/ui/avatar";
import { Separator } from "@gameverse/ui/separator";

import {
  getParticipants,
  getParticipantStats,
  suspendParticipant,
  unsuspendParticipant,
  blacklistParticipant,
  bulkParticipantAction,
  exportParticipants,
  getParticipantAnalytics,
  type ParticipantListItem,
  type ParticipantStats,
  type ParticipantFilters,
} from "./_actions/participant";
import { getFestivals } from "../festivals/_actions/festival";
import type { FestivalListItem } from "@gameverse/types";

// =====================================================
// Helpers
// =====================================================

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  BLACKLISTED: {
    label: "Blacklisted",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
};

// =====================================================
// Stat Card
// =====================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, subtitle, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} shrink-0 ml-3`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Action Modal
// =====================================================

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  placeholder?: string;
  requireReason?: boolean;
  onConfirm: (reason: string) => void;
  loading?: boolean;
  variant?: "danger" | "warning" | "default";
}

function ActionModal({ open, onClose, title, description, placeholder, requireReason = false, onConfirm, loading, variant = "default" }: ActionModalProps) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  const btnClass =
    variant === "danger" ?"bg-red-600 hover:bg-red-700 text-white"
      : variant === "warning" ?"bg-amber-600 hover:bg-amber-700 text-white" :"bg-primary hover:bg-primary/90 text-primary-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {requireReason && (
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-4"
            rows={3}
            placeholder={placeholder ?? "Enter reason..."}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${btnClass}`}
            onClick={() => onConfirm(reason)}
            disabled={loading || (requireReason && !reason.trim())}
          >
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================
// Points Modal
// =====================================================

interface PointsModalProps {
  open: boolean;
  onClose: () => void;
  mode: "award" | "deduct";
  onConfirm: (points: number, reason: string) => void;
  loading?: boolean;
}

function PointsModal({ open, onClose, mode, onConfirm, loading }: PointsModalProps) {
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {mode === "award" ? "Award Bonus Points" : "Deduct Points"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {mode === "award" ? "Award bonus points to this participant." : "Deduct points from this participant."}
        </p>
        <div className="space-y-3 mb-4">
          <Input
            type="number"
            placeholder="Points amount"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            min={1}
          />
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={2}
            placeholder="Reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${mode === "award" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
            onClick={() => onConfirm(Number(points), reason)}
            disabled={loading || !points || !reason.trim() || Number(points) <= 0}
          >
            {loading ? "Processing..." : mode === "award" ? "Award Points" : "Deduct Points"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================
// Analytics Panel
// =====================================================

interface AnalyticsPanelProps {
  data: {
    mostActive: { id: string; username: string; globalName: string | null; avatarUrl: string | null; _count: { registrations: number } }[];
    topPointEarners: { id: string; username: string; globalName: string | null; avatarUrl: string | null; totalPoints: number }[];
    mostWins: { id: string; username: string; globalName: string | null; avatarUrl: string | null; _count: { userAchievements: number } }[];
  } | null;
  loading: boolean;
}

function AnalyticsPanel({ data, loading }: AnalyticsPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardHeader className="pb-3"><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => <Skeleton key={j} className="h-10 w-full" />)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const renderList = (
    items: { id: string; username: string; globalName: string | null; avatarUrl: string | null; value: number; label: string }[]
  ) => (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
          <Avatar className="h-7 w-7">
            <AvatarImage src={item.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(item.globalName ?? item.username)}</AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm font-medium text-foreground truncate">{item.globalName ?? item.username}</span>
          <span className="text-xs font-semibold text-primary">{item.value} {item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" /> Most Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderList(data.mostActive.map((u) => ({ ...u, value: u._count.registrations, label: "events" })))}
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" /> Top Point Earners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderList(data.topPointEarners.map((u) => ({ ...u, value: u.totalPoints, label: "pts" })))}
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" /> Most Wins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderList(data.mostWins.map((u) => ({ ...u, value: u._count.userAchievements, label: "wins" })))}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// Main Page
// =====================================================

export default function ParticipantsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Data
  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPanelProps["data"] | null>(null);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Loading
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [festivalFilter, setFestivalFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: "suspend" | "unsuspend" | "blacklist" | "removeFromFestival" | null;
    userId: string | null;
    title: string;
    description: string;
    variant: "danger" | "warning" | "default";
  }>({ open: false, type: null, userId: null, title: "", description: "", variant: "default" });
  const [pointsModal, setPointsModal] = useState<{ open: boolean; mode: "award" | "deduct"; userId: string | null }>({
    open: false,
    mode: "award",
    userId: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Show analytics
  const [showAnalytics, setShowAnalytics] = useState(false);

  // =====================================================
  // Data Fetching
  // =====================================================

  const fetchParticipants = useCallback(async () => {
    setLoadingParticipants(true);
    try {
      const filters: ParticipantFilters = {
        search: search || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as ParticipantFilters["status"]) : "ALL",
        festivalId: festivalFilter !== "ALL" ? festivalFilter : undefined,
        sortBy: sortBy as ParticipantFilters["sortBy"],
        page,
        perPage,
      };
      const result = await getParticipants(filters);
      if (result.success && result.data) {
        setParticipants(result.data.participants);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
    } finally {
      setLoadingParticipants(false);
    }
  }, [search, statusFilter, festivalFilter, sortBy, page]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const result = await getParticipantStats();
      if (result.success && result.data) setStats(result.data);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const result = await getParticipantAnalytics();
      if (result.success && result.data) setAnalytics(result.data as AnalyticsPanelProps["data"]);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const fetchFestivals = useCallback(async () => {
    const result = await getFestivals({ page: 1, perPage: 100 });
    if (result.success && result.data) setFestivals((result.data as { festivals: FestivalListItem[] }).festivals ?? []);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchFestivals();
    fetchAnalytics();
  }, [fetchStats, fetchFestivals, fetchAnalytics]);

  useEffect(() => {
    const timer = setTimeout(() => fetchParticipants(), 300);
    return () => clearTimeout(timer);
  }, [fetchParticipants]);

  // =====================================================
  // Actions
  // =====================================================

  const handleActionConfirm = async (reason: string) => {
    if (!actionModal.userId || !actionModal.type) return;
    setActionLoading(true);
    try {
      if (actionModal.type === "suspend") {
        await suspendParticipant(actionModal.userId, reason);
      } else if (actionModal.type === "unsuspend") {
        await unsuspendParticipant(actionModal.userId);
      } else if (actionModal.type === "blacklist") {
        await blacklistParticipant(actionModal.userId, reason);
      }
      setActionModal({ open: false, type: null, userId: null, title: "", description: "", variant: "default" });
      fetchParticipants();
      fetchStats();
    } finally {
      setActionLoading(false);
    }
  };

  const handlePointsConfirm = async (points: number, reason: string) => {
    if (!pointsModal.userId) return;
    setActionLoading(true);
    try {
      const { awardBonusPoints, deductPoints } = await import("./_actions/participant");
      if (pointsModal.mode === "award") {
        await awardBonusPoints(pointsModal.userId, points, reason);
      } else {
        await deductPoints(pointsModal.userId, points, reason);
      }
      setPointsModal({ open: false, mode: "award", userId: null });
      fetchParticipants();
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: "SUSPEND" | "UNSUSPEND" | "BLACKLIST") => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      await bulkParticipantAction(Array.from(selectedIds), action);
      setSelectedIds(new Set());
      fetchParticipants();
      fetchStats();
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    const result = await exportParticipants({
      search: search || undefined,
      status: statusFilter !== "ALL" ? (statusFilter as ParticipantFilters["status"]) : "ALL",
    });
    if (!result.success || !result.data) return;

    const data = result.data as ParticipantListItem[];

    if (format === "pdf") {
      window.print();
      return;
    }

    const headers = ["Username", "Display Name", "Email", "Discord ID", "Status", "Points", "Registrations", "Joined"];
    const rows = data.map((p) => [
      p.username,
      p.globalName ?? "",
      p.email,
      p.discordAccount?.discordUserId ?? "",
      p.status,
      p.totalPoints,
      p.totalRegistrations,
      formatDate(p.createdAt),
    ]);

    if (format === "csv") {
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "participants.csv";
      a.click();
    } else {
      const tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
      const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "participants.xls";
      a.click();
    }
  };

  // =====================================================
  // Selection
  // =====================================================

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === participants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(participants.map((p) => p.id)));
    }
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Participants
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage all participants, view profiles, statistics and participation history.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics((v) => !v)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showAnalytics ? "Hide" : "Show"} Analytics
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="h-4 w-4 mr-2" /> Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <Printer className="h-4 w-4 mr-2" /> Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => { fetchParticipants(); fetchStats(); }} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard title="Total" value={stats?.totalParticipants ?? 0} icon={<Users className="h-5 w-5 text-blue-400" />} color="bg-blue-500/10" loading={loadingStats} />
        <StatCard title="Active" value={stats?.activeParticipants ?? 0} icon={<UserCheck className="h-5 w-5 text-emerald-400" />} color="bg-emerald-500/10" loading={loadingStats} />
        <StatCard title="New This Week" value={stats?.newThisWeek ?? 0} icon={<TrendingUp className="h-5 w-5 text-violet-400" />} color="bg-violet-500/10" loading={loadingStats} />
        <StatCard title="Suspended" value={stats?.suspendedParticipants ?? 0} icon={<UserX className="h-5 w-5 text-amber-400" />} color="bg-amber-500/10" loading={loadingStats} />
        <StatCard title="Avg Attendance" value={stats?.avgAttendance ?? 0} icon={<Calendar className="h-5 w-5 text-cyan-400" />} color="bg-cyan-500/10" loading={loadingStats} />
        <StatCard title="Avg Points" value={stats?.avgPoints ?? 0} icon={<Zap className="h-5 w-5 text-yellow-400" />} color="bg-yellow-500/10" loading={loadingStats} />
        <StatCard title="Most Active" value={stats?.mostActiveParticipant ?? "—"} icon={<Crown className="h-5 w-5 text-orange-400" />} color="bg-orange-500/10" loading={loadingStats} />
        <StatCard title="Total Wins" value={stats?.totalWins ?? 0} icon={<Trophy className="h-5 w-5 text-pink-400" />} color="bg-pink-500/10" loading={loadingStats} />
      </div>

      {/* Analytics */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnalyticsPanel data={analytics} loading={loadingAnalytics} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, Discord, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={festivalFilter} onValueChange={(v) => { setFestivalFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Festival" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Festivals</SelectItem>
                {festivals.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highestPoints">Highest Points</SelectItem>
                <SelectItem value="lowestPoints">Lowest Points</SelectItem>
                <SelectItem value="mostActive">Most Active</SelectItem>
                <SelectItem value="highestAttendance">Highest Attendance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20"
          >
            <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
            <Separator orientation="vertical" className="h-5" />
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("SUSPEND")} disabled={actionLoading} className="gap-2">
              <Shield className="h-3.5 w-3.5" /> Suspend
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("UNSUSPEND")} disabled={actionLoading} className="gap-2">
              <ShieldOff className="h-3.5 w-3.5" /> Unsuspend
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("BLACKLIST")} disabled={actionLoading} className="gap-2 text-red-400 border-red-400/30 hover:bg-red-500/10">
              <Ban className="h-3.5 w-3.5" /> Blacklist
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="ml-auto">
              Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card className="border-border/50 bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left w-10">
                  <Checkbox
                    checked={selectedIds.size === participants.length && participants.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Participant</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Discord</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Festival</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Points</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Events</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingParticipants ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto rounded" /></td>
                  </tr>
                ))
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No participants found</p>
                    <p className="text-xs mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                participants.map((participant) => {
                  const statusCfg = STATUS_CONFIG[participant.status];
                  return (
                    <motion.tr
                      key={participant.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(participant.id)}
                          onCheckedChange={() => toggleSelect(participant.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={participant.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {getInitials(participant.globalName ?? participant.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {participant.globalName ?? participant.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">@{participant.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {participant.discordAccount ? (
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">
                              {participant.discordAccount.username ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {participant.discordAccount.discordUserId}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not linked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {participant.festivals.slice(0, 2).map((f) => (
                            <span key={f} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[120px]">{f}</span>
                          ))}
                          {participant.festivals.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{participant.festivals.length - 2}</span>
                          )}
                          {participant.festivals.length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="font-semibold text-foreground">{participant.totalPoints.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-foreground">{participant.totalRegistrations}</span>
                        <span className="text-xs text-muted-foreground ml-1">({participant.approvedRegistrations} ✓)</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{formatDate(participant.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/participants/${participant.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setPointsModal({ open: true, mode: "award", userId: participant.id });
                            }}>
                              <TrendingUp className="h-4 w-4 mr-2 text-emerald-400" /> Award Points
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setPointsModal({ open: true, mode: "deduct", userId: participant.id });
                            }}>
                              <TrendingDown className="h-4 w-4 mr-2 text-red-400" /> Deduct Points
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {participant.status === "ACTIVE" ? (
                              <DropdownMenuItem onClick={() => setActionModal({
                                open: true, type: "suspend", userId: participant.id,
                                title: "Suspend Participant",
                                description: `Suspend ${participant.globalName ?? participant.username}? They will be unable to participate.`,
                                variant: "warning",
                              })}>
                                <Shield className="h-4 w-4 mr-2 text-amber-400" /> Suspend
                              </DropdownMenuItem>
                            ) : participant.status === "SUSPENDED" ? (
                              <DropdownMenuItem onClick={() => setActionModal({
                                open: true, type: "unsuspend", userId: participant.id,
                                title: "Unsuspend Participant",
                                description: `Restore access for ${participant.globalName ?? participant.username}?`,
                                variant: "default",
                              })}>
                                <ShieldOff className="h-4 w-4 mr-2 text-emerald-400" /> Unsuspend
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400"
                              onClick={() => setActionModal({
                                open: true, type: "blacklist", userId: participant.id,
                                title: "Blacklist Participant",
                                description: `Permanently blacklist ${participant.globalName ?? participant.username}? This is a severe action.`,
                                variant: "danger",
                              })}
                            >
                              <Ban className="h-4 w-4 mr-2" /> Blacklist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total} participants
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <ActionModal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, type: null, userId: null, title: "", description: "", variant: "default" })}
        title={actionModal.title}
        description={actionModal.description}
        requireReason={actionModal.type === "suspend" || actionModal.type === "blacklist"}
        placeholder={actionModal.type === "blacklist" ? "Reason for blacklisting..." : "Reason for suspension..."}
        onConfirm={handleActionConfirm}
        loading={actionLoading}
        variant={actionModal.variant}
      />

      <PointsModal
        open={pointsModal.open}
        onClose={() => setPointsModal({ open: false, mode: "award", userId: null })}
        mode={pointsModal.mode}
        onConfirm={handlePointsConfirm}
        loading={actionLoading}
      />
    </div>
  );
}
