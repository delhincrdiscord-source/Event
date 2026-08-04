"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Search, Download, RefreshCw, ChevronLeft, ChevronRight, Eye, LogIn, LogOut, UserCheck, UserX, Clock, AlertCircle, CheckCircle2, XCircle, Activity, BarChart3, FileSpreadsheet, FileText, Printer, TrendingUp, Zap, Calendar, Filter, ArrowUpDown, Users, Timer, Wifi, WifiOff, MoreHorizontal,  } from "lucide-react";
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
  getAttendanceRecords,
  getAttendanceStats,
  getAttendanceAnalytics,
  getLiveEventAttendance,
  checkInParticipant,
  checkOutParticipant,
  updateAttendanceStatus,
  bulkAttendanceAction,
  exportAttendance,
  type AttendanceRecord,
  type AttendanceStats,
  type AttendanceFilters,
  type AttendanceStatus,
} from "./_actions/attendance";
import { getEvents } from "../events/_actions/event";
import { getAllFestivals } from "../festivals/_actions/festival";
import type { FestivalListItem } from "@gameverse/types";

// =====================================================
// Constants
// =====================================================

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  PRESENT: {
    label: "Present",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  LATE: {
    label: "Late",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: <Clock className="h-3 w-3" />,
  },
  ABSENT: {
    label: "Absent",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: <XCircle className="h-3 w-3" />,
  },
  EXCUSED: {
    label: "Excused",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  LEFT_EARLY: {
    label: "Left Early",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: <LogOut className="h-3 w-3" />,
  },
  DISCONNECTED: {
    label: "Disconnected",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: <WifiOff className="h-3 w-3" />,
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    icon: <Clock className="h-3 w-3" />,
  },
};

const STATUS_OPTIONS: { value: AttendanceStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED", label: "Excused" },
  { value: "LEFT_EARLY", label: "Left Early" },
  { value: "DISCONNECTED", label: "Disconnected" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "longestDuration", label: "Longest Duration" },
  { value: "highestAttendance", label: "Highest Attendance" },
];

// =====================================================
// Helpers
// =====================================================

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// =====================================================
// Stat Card
// =====================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  delay?: number;
}

function StatCard({ title, value, icon, color, subtitle, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                {title}
              </p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color} ml-3`}
            >
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Status Badge
// =====================================================

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// =====================================================
// Live Event Panel
// =====================================================

interface LiveEvent {
  id: string;
  title: string;
  startDate: Date;
  capacity: number | null;
  totalRegistered: number;
  checkedIn: number;
  remaining: number;
  attendancePct: number;
  elapsedMinutes: number;
}

function LiveEventPanel({ events }: { events: LiveEvent[] }) {
  const [elapsed, setElapsed] = useState<Record<string, number>>({});

  useEffect(() => {
    const init: Record<string, number> = {};
    events.forEach((e) => {
      init[e.id] = e.elapsedMinutes;
    });
    setElapsed(init);

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = { ...prev };
        events.forEach((e) => {
          next[e.id] = (next[e.id] ?? 0) + 1;
        });
        return next;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [events]);

  if (events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="mb-6"
    >
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <CardTitle className="text-sm font-semibold text-red-400">
              Live Event Attendance
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg border border-red-500/20 bg-background/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight line-clamp-2">{ev.title}</p>
                  <span className="shrink-0 flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-500/30">
                    <Wifi className="h-3 w-3" />
                    LIVE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Checked In</p>
                    <p className="font-bold text-emerald-400 text-base">{ev.checkedIn}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-bold text-amber-400 text-base">{ev.remaining}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Total Registered</p>
                    <p className="font-semibold">{ev.totalRegistered}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">Attendance %</p>
                    <p className="font-bold text-primary">{ev.attendancePct}%</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{ev.attendancePct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${ev.attendancePct}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span>
                    Elapsed:{" "}
                    {elapsed[ev.id] !== undefined
                      ? formatDuration(elapsed[ev.id])
                      : formatDuration(ev.elapsedMinutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Analytics Panel
// =====================================================

function AnalyticsPanel({
  data,
}: {
  data: {
    dailyAttendance: { date: string; present: number; absent: number }[];
    topParticipants: {
      id: string;
      username: string;
      globalName: string | null;
      avatarUrl: string | null;
      _count: { registrations: number };
    }[];
  } | null;
}) {
  if (!data) return null;

  const maxVal = Math.max(...data.dailyAttendance.map((d) => d.present + d.absent), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="mb-6 grid gap-4 lg:grid-cols-3"
    >
      {/* Daily Attendance Chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Daily Attendance (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {data.dailyAttendance.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: "96px" }}>
                  <div
                    className="w-full rounded-sm bg-red-500/60 transition-all duration-500"
                    style={{ height: `${(d.absent / maxVal) * 96}px` }}
                    title={`Absent: ${d.absent}`}
                  />
                  <div
                    className="w-full rounded-sm bg-emerald-500/80 transition-all duration-500"
                    style={{ height: `${(d.present / maxVal) * 96}px` }}
                    title={`Present: ${d.present}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-emerald-500/80" />
              Present
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-red-500/60" />
              Absent
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Most Active Participants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Most Active Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topParticipants.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No data available</p>
            )}
            {data.topParticipants.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={p.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(p.globalName ?? p.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {p.globalName ?? p.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {p._count.registrations} events
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Main Page
// =====================================================

export default function AttendancePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<AttendanceFilters>({
    search: "",
    status: "ALL",
    festivalId: "ALL",
    eventId: "ALL",
    dateFrom: "",
    dateTo: "",
    sortBy: "newest",
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // =====================================================
  // Fetch
  // =====================================================

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAttendanceRecords({
        ...filters,
        page: pagination.page,
        perPage: pagination.perPage,
      });
      if (result.success && result.data) {
        setRecords(result.data.records);
        setPagination((prev) => ({
          ...prev,
          total: result.data!.total,
          totalPages: result.data!.totalPages,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage]);

  const fetchStats = useCallback(async () => {
    const result = await getAttendanceStats();
    if (result.success && result.data) setStats(result.data);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const result = await getAttendanceAnalytics();
    if (result.success && result.data) setAnalytics(result.data);
  }, []);

  const fetchLive = useCallback(async () => {
    const result = await getLiveEventAttendance();
    if (result.success && result.data) setLiveEvents(result.data as LiveEvent[]);
  }, []);

  const fetchFestivals = useCallback(async () => {
    const result = await getAllFestivals();
    if (result.success && result.data) setFestivals(result.data);
  }, []);

  const fetchEvents = useCallback(async () => {
    const result = await getEvents({ page: 1, perPage: 100, sortBy: "startDate", sortOrder: "asc" });
    if (result.success && result.data) setEvents(result.data.events);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchFestivals();
    fetchEvents();
    fetchAnalytics();
    fetchLive();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Auto-refresh live events every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLive();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLive, fetchStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchRecords(), fetchStats(), fetchLive()]);
    setIsRefreshing(false);
  };

  // =====================================================
  // Actions
  // =====================================================

  const handleCheckIn = async (id: string) => {
    startTransition(async () => {
      await checkInParticipant(id);
      fetchRecords();
      fetchStats();
    });
  };

  const handleCheckOut = async (id: string) => {
    startTransition(async () => {
      await checkOutParticipant(id);
      fetchRecords();
      fetchStats();
    });
  };

  const handleStatusUpdate = async (id: string, status: AttendanceStatus) => {
    startTransition(async () => {
      await updateAttendanceStatus(id, status);
      fetchRecords();
      fetchStats();
    });
  };

  const handleBulkAction = async (action: "MARK_PRESENT" | "MARK_ABSENT" | "MARK_EXCUSED") => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      await bulkAttendanceAction(selectedIds, action);
      setSelectedIds([]);
      fetchRecords();
      fetchStats();
    });
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    const result = await exportAttendance(filters);
    if (!result.success || !result.data) return;
    const data = result.data;

    if (format === "csv" || format === "excel") {
      const headers = [
        "Name",
        "Discord Username",
        "Festival",
        "Event",
        "Check-In Time",
        "Check-Out Time",
        "Duration",
        "Status",
        "Verified By",
      ];
      const rows = data.map((r) => [
        r.globalName ?? r.username,
        r.discordUsername ?? "",
        r.festivalName,
        r.eventTitle ?? "",
        r.checkInTime ? formatTime(r.checkInTime) : "",
        r.checkOutTime ? formatTime(r.checkOutTime) : "",
        formatDuration(r.durationMinutes),
        STATUS_CONFIG[r.status]?.label ?? r.status,
        r.verifiedByName ?? "",
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${Date.now()}.${format === "excel" ? "xls" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      window.print();
    }
  };

  // =====================================================
  // Selection
  // =====================================================

  const allSelected = records.length > 0 && selectedIds.length === records.length;
  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : records.map((r) => r.id));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // =====================================================
  // Filter helpers
  // =====================================================

  const setFilter = (key: keyof AttendanceFilters, value: string) => {
    setPagination((p) => ({ ...p, page: 1 }));
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track, verify and manage participant attendance for every event.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalytics((v) => !v)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
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
                <FileText className="mr-2 h-4 w-4" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <Printer className="mr-2 h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        {isLoading && !stats ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl col-span-1" />
          ))
        ) : (
          <>
            <div className="col-span-2 sm:col-span-2">
              <StatCard
                title="Total Records"
                value={stats?.totalRecords ?? 0}
                icon={<CheckSquare className="h-5 w-5 text-white" />}
                color="bg-primary"
                delay={0}
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <StatCard
                title="Present Today"
                value={stats?.presentToday ?? 0}
                icon={<UserCheck className="h-5 w-5 text-white" />}
                color="bg-emerald-500"
                delay={0.05}
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <StatCard
                title="Absent Today"
                value={stats?.absentToday ?? 0}
                icon={<UserX className="h-5 w-5 text-white" />}
                color="bg-red-500"
                delay={0.1}
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <StatCard
                title="Late Check-ins"
                value={stats?.lateCheckIns ?? 0}
                icon={<Clock className="h-5 w-5 text-white" />}
                color="bg-amber-500"
                delay={0.15}
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <StatCard
                title="Excused"
                value={stats?.excusedParticipants ?? 0}
                icon={<AlertCircle className="h-5 w-5 text-white" />}
                color="bg-blue-500"
                delay={0.2}
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <StatCard
                title="Avg Attendance Rate"
                value={`${stats?.averageAttendanceRate ?? 0}%`}
                icon={<TrendingUp className="h-5 w-5 text-white" />}
                color="bg-violet-500"
                delay={0.25}
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <StatCard
                title="Streak Leader"
                value={stats?.streakLeader ?? "—"}
                icon={<Zap className="h-5 w-5 text-white" />}
                color="bg-yellow-500"
                subtitle="Most active participant"
                delay={0.3}
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <StatCard
                title="Live Attendance"
                value={stats?.currentLiveAttendance ?? 0}
                icon={<Activity className="h-5 w-5 text-white" />}
                color="bg-rose-500"
                subtitle="Currently checked in"
                delay={0.35}
              />
            </div>
          </>
        )}
      </div>

      {/* Live Events Panel */}
      {liveEvents.length > 0 && <LiveEventPanel events={liveEvents} />}

      {/* Analytics Panel */}
      <AnimatePresence>
        {showAnalytics && <AnalyticsPanel data={analytics} />}
      </AnimatePresence>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search participant, Discord, festival, event..."
              value={filters.search ?? ""}
              onChange={(e) => setFilter("search", e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={filters.status ?? "ALL"}
              onValueChange={(v) => setFilter("status", v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.sortBy ?? "newest"}
              onValueChange={(v) => setFilter("sortBy", v)}
            >
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className={`gap-2 ${showFilters ? "bg-accent" : ""}`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-3">
                <Select
                  value={filters.festivalId ?? "ALL"}
                  onValueChange={(v) => setFilter("festivalId", v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Festival" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Festivals</SelectItem>
                    {festivals.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.eventId ?? "ALL"}
                  onValueChange={(v) => setFilter("eventId", v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Events</SelectItem>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={filters.dateFrom ?? ""}
                  onChange={(e) => setFilter("dateFrom", e.target.value)}
                  className="w-[160px]"
                  placeholder="From date"
                />
                <Input
                  type="date"
                  value={filters.dateTo ?? ""}
                  onChange={(e) => setFilter("dateTo", e.target.value)}
                  className="w-[160px]"
                  placeholder="To date"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      search: "",
                      status: "ALL",
                      festivalId: "ALL",
                      eventId: "ALL",
                      dateFrom: "",
                      dateTo: "",
                      sortBy: "newest",
                    });
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5"
          >
            <span className="text-sm font-medium text-primary">
              {selectedIds.length} selected
            </span>
            <Separator orientation="vertical" className="h-4" />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
              onClick={() => handleBulkAction("MARK_PRESENT")}
              disabled={isPending}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Mark Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10"
              onClick={() => handleBulkAction("MARK_ABSENT")}
              disabled={isPending}
            >
              <UserX className="h-3.5 w-3.5" />
              Mark Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
              onClick={() => handleBulkAction("MARK_EXCUSED")}
              disabled={isPending}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Mark Excused
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => handleExport("csv")}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Participant
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Discord
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                    Festival
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">
                    Check-in
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">
                    Check-out
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Verified By
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                      <CheckSquare className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      <p className="text-sm">No attendance records found</p>
                    </td>
                  </tr>
                ) : (
                  records.map((record, i) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.includes(record.id)}
                          onCheckedChange={() => toggleOne(record.id)}
                          aria-label={`Select ${record.username}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={record.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(record.globalName ?? record.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[120px]">
                              {record.globalName ?? record.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                              @{record.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {record.discordUsername ? `@${record.discordUsername}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs truncate max-w-[120px] block">
                          {record.festivalName || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs truncate max-w-[140px] block">
                          {record.eventTitle || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(record.checkInTime)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(record.checkOutTime)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs font-medium">
                          {formatDuration(record.durationMinutes)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {record.verifiedByName ?? (record.verifiedBy ? "Staff" : "—")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              router.push(`/dashboard/admin/attendance/${record.id}`)
                            }
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {record.status === "PENDING_VERIFICATION" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-500"
                              onClick={() => handleCheckIn(record.id)}
                              disabled={isPending}
                              title="Check In"
                            >
                              <LogIn className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {record.status === "PRESENT" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-amber-500"
                              onClick={() => handleCheckOut(record.id)}
                              disabled={isPending}
                              title="Check Out"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/admin/attendance/${record.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(record.id, "PRESENT")}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                Mark Present
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(record.id, "LATE")}
                              >
                                <Clock className="mr-2 h-4 w-4 text-amber-500" />
                                Mark Late
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(record.id, "ABSENT")}
                              >
                                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                Mark Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(record.id, "EXCUSED")}
                              >
                                <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                                Mark Excused
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(record.id, "LEFT_EARLY")}
                              >
                                <LogOut className="mr-2 h-4 w-4 text-orange-500" />
                                Mark Left Early
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(record.id, "DISCONNECTED")}
                              >
                                <WifiOff className="mr-2 h-4 w-4 text-purple-500" />
                                Mark Disconnected
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/admin/participants/${record.userId}`)
                                }
                              >
                                <Users className="mr-2 h-4 w-4" />
                                View Participant
                              </DropdownMenuItem>
                              {record.eventId && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/dashboard/admin/events/${record.eventId}`)
                                  }
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  View Event
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                {Math.min((pagination.page - 1) * pagination.perPage + 1, pagination.total)}–
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{" "}
                {pagination.total} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                  }
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      page: Math.min(p.totalPages, p.page + 1),
                    }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
