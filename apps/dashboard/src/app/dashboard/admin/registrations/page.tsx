"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Eye, Download, CheckCircle2, XCircle, AlertCircle, Clock, UserCheck, Calendar, Filter, TrendingUp, TrendingDown, BarChart3, FileSpreadsheet, FileText, Trash2, RefreshCw, ArrowUpDown, Activity, ClipboardList,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@gameverse/ui/avatar";

import { getRegistrations, getRegistrationStats, approveRegistration, rejectRegistration, waitlistRegistration, bulkUpdateRegistrationStatus, bulkCheckInRegistrations, exportAllRegistrations, deleteRegistration, bulkDeleteRegistrations, getRegistrationAnalytics,  } from "./_actions/registration";
import { getEvents } from "../events/_actions/event";
import { getAllFestivals } from "../festivals/_actions/festival";
import { ApprovalDialog } from "./_components";
import type {
  RegistrationListItem,
  RegistrationStatus,
  RegistrationStats,
  CommunityEventListItem,
  FestivalListItem,
} from "@gameverse/types";
import { REGISTRATION_STATUS_LABELS,  } from "@gameverse/types";

const STATUS_OPTIONS: { value: RegistrationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WAITLISTED", label: "Waitlisted" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "COMPLETED", label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "pending", label: "Pending First" },
  { value: "approved", label: "Approved First" },
];

const STATUS_ICONS: Record<RegistrationStatus, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3" />,
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
  WAITLISTED: <AlertCircle className="h-3 w-3" />,
  CANCELLED: <XCircle className="h-3 w-3" />,
  CHECKED_IN: <UserCheck className="h-3 w-3" />,
  COMPLETED: <CheckCircle2 className="h-3 w-3" />,
};

const STATUS_BADGE_STYLES: Record<RegistrationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
  WAITLISTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
  CHECKED_IN: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  COMPLETED: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
};

interface AnalyticsData {
  todayRegistrations: number;
  yesterdayRegistrations: number;
  dailyGrowth: number;
  approvalRate: number;
  totalRegistrations: number;
  pendingRegistrations: number;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  title,
  value,
  icon,
  iconColor,
  trend,
  trendLabel,
  delay = 0,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {trend !== undefined && (
                <div className="flex items-center gap-1">
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {trend >= 0 ? "+" : ""}{trend}%
                  </span>
                  {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
                </div>
              )}
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function RegistrationsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [events, setEvents] = useState<CommunityEventListItem[]>([]);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL\" as RegistrationStatus | \"ALL",
    eventId: "ALL",
    festivalId: "ALL",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "waitlist";
    registrationId: string;
    passNumber: string;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const getSortParams = (sort: string): { sortBy: "registeredAt" | "status" | "user" | "event"; sortOrder: "asc" | "desc" } => {
    switch (sort) {
      case "oldest": return { sortBy: "registeredAt", sortOrder: "asc" };
      case "pending": return { sortBy: "status", sortOrder: "asc" };
      case "approved": return { sortBy: "status", sortOrder: "desc" };
      default: return { sortBy: "registeredAt", sortOrder: "desc" };
    }
  };

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const sortParams = getSortParams(sortBy);
      let result = await getRegistrations({
        search: filters.search || undefined,
        status: filters.status === "ALL" ? undefined : (filters.status as RegistrationStatus),
        eventId: filters.eventId === "ALL" ? undefined : filters.eventId,
        festivalId: filters.festivalId === "ALL" ? undefined : filters.festivalId,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: pagination.page,
        perPage: pagination.perPage,
        sortBy: sortParams.sortBy,
        sortOrder: sortParams.sortOrder,
      });
      if (result.success && result.data) {
        const data = result.data as { registrations: RegistrationListItem[]; total: number; totalPages: number };
        setRegistrations(data.registrations);
        setPagination((prev) => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage, sortBy]);

  const fetchStats = useCallback(async () => {
    let result = await getRegistrationStats();
    if (result.success && result.data) {
      setStats(result.data as RegistrationStats);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    let result = await getRegistrationAnalytics();
    if (result.success && result.data) {
      setAnalytics(result.data as AnalyticsData);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    let result = await getEvents({ page: 1, perPage: 100, sortBy: "startDate", sortOrder: "asc" });
    if (result.success && result.data) {
      setEvents(result.data.events);
    }
  }, []);

  const fetchFestivals = useCallback(async () => {
    let result = await getAllFestivals();
    if (result.success && result.data) {
      setFestivals(result.data);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
    fetchEvents();
    fetchFestivals();
  }, [fetchStats, fetchAnalytics, fetchEvents, fetchFestivals]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchRegistrations(), fetchStats(), fetchAnalytics()]);
    setIsRefreshing(false);
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value as RegistrationStatus | "ALL" }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEventFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, eventId: value }));
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
    if (selectedIds.length === registrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(registrations.map((r) => r.id));
    }
  };

  const handleSelectRegistration = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    startTransition(async () => {
      let result = await exportAllRegistrations({
        status: filters.status !== "ALL" ? filters.status : undefined,
        festivalId: filters.festivalId !== "ALL" ? filters.festivalId : undefined,
        eventId: filters.eventId !== "ALL" ? filters.eventId : undefined,
      });

      if (result.success && result.data) {
        const exportData = result.data as { headers: string[]; rows: Record<string, string>[] };

        if (format === "csv" || format === "excel") {
          const escapeCsv = (value: string) => {
            const str = String(value ?? "");
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          };
          const csvContent = [
            exportData.headers.map(escapeCsv).join(","),
            ...exportData.rows.map((row) =>
              Object.values(row).map((val) => escapeCsv(String(val))).join(",")
            ),
          ].join("\n");
          const mimeType = format === "excel" ? "application/vnd.ms-excel" : "text/csv";
          const ext = format === "excel" ? "xls" : "csv";
          const blob = new Blob([csvContent], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `registrations-${new Date().toISOString().split("T")[0]}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
        } else if (format === "pdf") {
          // Build a simple HTML table and print it
          const htmlContent = `
            <html><head><title>Registrations Export</title>
            <style>
              body { font-family: Arial, sans-serif; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              th { background: #f5f5f5; font-weight: bold; }
              tr:nth-child(even) { background: #fafafa; }
              h1 { font-size: 18px; margin-bottom: 12px; }
            </style></head>
            <body>
              <h1>Registrations Export — ${new Date().toLocaleDateString()}</h1>
              <table>
                <thead><tr>${exportData.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
                <tbody>${exportData.rows.map((row) => `<tr>${Object.values(row).map((v) => `<td>${v ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
              </table>
            </body></html>
          `;
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.print();
          }
        }
      }
    });
  };

  const handleBulkAction = async (action: string) => {
    if (!selectedIds.length) return;

    startTransition(async () => {
      let result;
      switch (action) {
        case "approve":
          result = await bulkUpdateRegistrationStatus({ registrationIds: selectedIds }, "APPROVED");
          break;
        case "reject":
          result = await bulkUpdateRegistrationStatus({ registrationIds: selectedIds }, "REJECTED");
          break;
        case "waitlist":
          result = await bulkUpdateRegistrationStatus({ registrationIds: selectedIds }, "WAITLISTED");
          break;
        case "checkin":
          result = await bulkCheckInRegistrations({ registrationIds: selectedIds });
          break;
        case "delete":
          result = await bulkDeleteRegistrations({ registrationIds: selectedIds });
          break;
        case "export":
          await handleExport("csv");
          return;
      }

      if (result?.success) {
        setSelectedIds([]);
        fetchRegistrations();
        fetchStats();
        fetchAnalytics();
      }
    });
  };

  const handleApprovalConfirm = async () => {
    if (!approvalDialog) return;

    startTransition(async () => {
      let result;
      switch (approvalDialog.action) {
        case "approve":
          result = await approveRegistration(approvalDialog.registrationId);
          break;
        case "reject":
          result = await rejectRegistration(approvalDialog.registrationId);
          break;
        case "waitlist":
          result = await waitlistRegistration(approvalDialog.registrationId);
          break;
      }

      if (result?.success) {
        setApprovalDialog(null);
        fetchRegistrations();
        fetchStats();
        fetchAnalytics();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      let result = await deleteRegistration(id);
      if (result.success) {
        fetchRegistrations();
        fetchStats();
        fetchAnalytics();
      }
    });
  };

  const statCards = stats
    ? [
        {
          title: "Total Registrations",
          value: stats.totalRegistrations,
          icon: <ClipboardList className="h-5 w-5 text-white" />,
          iconColor: "bg-gradient-to-br from-violet-500 to-purple-600",
          delay: 0,
        },
        {
          title: "Pending",
          value: stats.pendingRegistrations,
          icon: <Clock className="h-5 w-5 text-white" />,
          iconColor: "bg-gradient-to-br from-amber-400 to-orange-500",
          delay: 0.05,
        },
        {
          title: "Approved",
          value: stats.approvedRegistrations,
          icon: <CheckCircle2 className="h-5 w-5 text-white" />,
          iconColor: "bg-gradient-to-br from-emerald-400 to-green-600",
          delay: 0.1,
        },
        {
          title: "Waitlisted",
          value: stats.waitlistedRegistrations,
          icon: <AlertCircle className="h-5 w-5 text-white" />,
          iconColor: "bg-gradient-to-br from-blue-400 to-cyan-500",
          delay: 0.15,
        },
        {
          title: "Rejected",
          value: stats.rejectedRegistrations,
          icon: <XCircle className="h-5 w-5 text-white" />,
          iconColor: "bg-gradient-to-br from-red-400 to-rose-600",
          delay: 0.2,
        },
        {
          title: "Cancelled",
          value: stats.cancelledRegistrations,
          icon: <XCircle className="h-5 w-5 text-white" />,
          iconColor: "bg-gradient-to-br from-gray-400 to-slate-600",
          delay: 0.25,
        },
        {
          title: "Today\'s Registrations",
          value: analytics?.todayRegistrations ?? "—",
          icon: <Activity className="h-5 w-5 text-white" />,
          iconColor: "bg-gradient-to-br from-pink-400 to-fuchsia-600",
          trend: analytics?.dailyGrowth,
          trendLabel: "vs yesterday",
          delay: 0.3,
        },
        {
          title: "Registration Growth",
          value: analytics ? `${analytics.approvalRate}%` : "—",
          icon: <TrendingUp className="h-5 w-5 text-white" />,
          iconColor: "bg-gradient-to-br from-teal-400 to-emerald-600",
          delay: 0.35,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span>📝</span> Registrations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage, approve and monitor all event registrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={isPending}>
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={isPending}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={isPending}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Analytics Section */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Analytics Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Registrations Today</p>
                  <p className="text-2xl font-bold">{analytics.todayRegistrations}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Daily Growth</p>
                  <div className="flex items-center justify-center gap-1">
                    {analytics.dailyGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <p className={`text-2xl font-bold ${analytics.dailyGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {analytics.dailyGrowth >= 0 ? "+" : ""}{analytics.dailyGrowth}%
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Approval Rate</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{analytics.approvalRate}%</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pending Review</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analytics.pendingRegistrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Registration Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registration List</CardTitle>
              <CardDescription>
                {pagination.total > 0
                  ? `${pagination.total} total registrations`
                  : "View and manage all event registrations"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {showFilters && <span className="ml-1 text-xs text-primary">▲</span>}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Search + Sort Row */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, Discord, pass number..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filters.status} onValueChange={handleStatusFilter}>
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
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPagination((p) => ({ ...p, page: 1 })); }}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort" />
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

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:flex-wrap">
                    <Select value={filters.festivalId} onValueChange={handleFestivalFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Festival" />
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
                    <Select value={filters.eventId} onValueChange={handleEventFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Events</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => { setFilters((p) => ({ ...p, dateFrom: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
                        className="w-full sm:w-[150px]"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => { setFilters((p) => ({ ...p, dateTo: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
                        className="w-full sm:w-[150px]"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilters({ search: "", status: "ALL", eventId: "ALL", festivalId: "ALL", dateFrom: "", dateTo: "" });
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3"
                >
                  <span className="text-sm font-medium text-primary">
                    {selectedIds.length} selected
                  </span>
                  <Separator orientation="vertical" className="h-5" />
                  <Button variant="ghost" size="sm" onClick={() => handleBulkAction("approve")} disabled={isPending}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-500" />
                    Approve
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleBulkAction("reject")} disabled={isPending}>
                    <XCircle className="mr-1.5 h-4 w-4 text-red-500" />
                    Reject
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleBulkAction("waitlist")} disabled={isPending}>
                    <AlertCircle className="mr-1.5 h-4 w-4 text-blue-500" />
                    Waitlist
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleBulkAction("export")} disabled={isPending}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleBulkAction("delete")} disabled={isPending} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="ml-auto">
                    Clear
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-[160px]" />
                      <Skeleton className="h-3 w-[120px]" />
                    </div>
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[80px] rounded-full" />
                    <Skeleton className="h-4 w-[90px]" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            ) : registrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No registrations found</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  {filters.search || filters.status !== "ALL"|| filters.eventId !== "ALL" || filters.festivalId !== "ALL" ?"Try adjusting your search or filter criteria." :"Registrations will appear here once users register for events."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left">
                        <Checkbox
                          checked={selectedIds.length === registrations.length && registrations.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Participant</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Discord</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Festival</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Event</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Reg. Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Attendance</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <AnimatePresence>
                      {registrations.map((registration, index) => {
                        const displayName = registration.user?.globalName || registration.user?.username || "Unknown";
                        const username = registration.user?.username || "";
                        const avatarUrl = registration.user?.avatarUrl;
                        const initials = displayName.charAt(0).toUpperCase();
                        const attendanceStatus = registration.checkedInAt ? "Checked In" : "Not Checked In";

                        return (
                          <motion.tr
                            key={registration.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, delay: index * 0.02 }}
                            className="group hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedIds.includes(registration.id)}
                                onCheckedChange={() => handleSelectRegistration(registration.id)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-[180px]">
                                <Avatar className="h-8 w-8 shrink-0">
                                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium truncate max-w-[140px]">{displayName}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                                    {registration.user?.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground font-mono">
                                {username ? `@${username}` : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm truncate max-w-[120px] block">
                                {registration.festival?.name || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm truncate max-w-[140px] block">
                                {registration.event?.title || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(registration.registeredAt)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[registration.status]}`}>
                                {STATUS_ICONS[registration.status]}
                                {REGISTRATION_STATUS_LABELS[registration.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                registration.checkedInAt
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" :"bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}>
                                {registration.checkedInAt ? <UserCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {attendanceStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="View Details"
                                  onClick={() => router.push(`/dashboard/admin/registrations/${registration.id}`)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {registration.status === "PENDING" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                      title="Approve"
                                      onClick={() => setApprovalDialog({ open: true, action: "approve", registrationId: registration.id, passNumber: registration.passNumber })}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                      title="Reject"
                                      onClick={() => setApprovalDialog({ open: true, action: "reject", registrationId: registration.id, passNumber: registration.passNumber })}
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                      title="Waitlist"
                                      onClick={() => setApprovalDialog({ open: true, action: "waitlist", registrationId: registration.id, passNumber: registration.passNumber })}
                                    >
                                      <AlertCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                                {registration.status === "APPROVED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                    title="Move to Waitlist"
                                    onClick={() => setApprovalDialog({ open: true, action: "waitlist", registrationId: registration.id, passNumber: registration.passNumber })}
                                  >
                                    <AlertCircle className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950"
                                  title="Delete"
                                  onClick={() => handleDelete(registration.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.perPage + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} registrations
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
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let page = i + 1;
                      if (pagination.totalPages > 5) {
                        if (pagination.page <= 3) page = i + 1;
                        else if (pagination.page >= pagination.totalPages - 2) page = pagination.totalPages - 4 + i;
                        else page = pagination.page - 2 + i;
                      }
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
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

      {/* Approval Dialog */}
      {approvalDialog && (
        <ApprovalDialog
          open={approvalDialog.open}
          onOpenChange={(open) => setApprovalDialog(open ? approvalDialog : null)}
          action={approvalDialog.action}
          registrationPassNumber={approvalDialog.passNumber}
          onConfirm={handleApprovalConfirm}
          isPending={isPending}
        />
      )}
    </div>
  );
}
