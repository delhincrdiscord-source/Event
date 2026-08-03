"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Calendar,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";
import { Skeleton } from "@gameverse/ui/skeleton";
import { Separator } from "@gameverse/ui/separator";
import { Checkbox } from "@gameverse/ui/checkbox";

import { getRegistrations, getRegistrationStats, approveRegistration, rejectRegistration, waitlistRegistration, bulkUpdateRegistrationStatus, bulkCheckInRegistrations, exportRegistrations, deleteRegistration,  } from "./_actions/registration";
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
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
} from "@gameverse/types";

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

const STATUS_ICONS: Record<RegistrationStatus, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3" />,
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
  WAITLISTED: <AlertCircle className="h-3 w-3" />,
  CANCELLED: <XCircle className="h-3 w-3" />,
  CHECKED_IN: <UserCheck className="h-3 w-3" />,
  COMPLETED: <CheckCircle2 className="h-3 w-3" />,
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RegistrationsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [events, setEvents] = useState<CommunityEventListItem[]>([]);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });
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
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "waitlist";
    registrationId: string;
    passNumber: string;
  } | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      let result = await getRegistrations({
        search: filters.search || undefined,
        status: filters.status === "ALL" ? undefined : (filters.status as "COMPLETED" | "CANCELLED" | "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED" | "CHECKED_IN" | undefined),
        eventId: filters.eventId === "ALL" ? undefined : filters.eventId,
        festivalId:
          filters.festivalId === "ALL" ? undefined : filters.festivalId,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: pagination.page,
        perPage: pagination.perPage,
        sortBy: "registeredAt",
        sortOrder: "desc",
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
  }, [filters, pagination.page, pagination.perPage]);

  const fetchStats = useCallback(async () => {
    let result = await getRegistrationStats();
    if (result.success && result.data) {
      setStats(result.data as RegistrationStats);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    let result = await getEvents({
      page: 1,
      perPage: 100,
      sortBy: "startDate",
      sortOrder: "asc",
    });
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
    fetchEvents();
    fetchFestivals();
  }, [fetchStats, fetchEvents, fetchFestivals]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as RegistrationStatus | "ALL",
    }));
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

  const handleDateFromChange = (value: string) => {
    setFilters((prev) => ({ ...prev, dateFrom: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDateToChange = (value: string) => {
    setFilters((prev) => ({ ...prev, dateTo: value }));
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

  const handleBulkAction = async (action: string) => {
    if (!selectedIds.length) return;

    startTransition(async () => {
      let result;
      switch (action) {
        case "approve":
          result = await bulkUpdateRegistrationStatus(
            { registrationIds: selectedIds },
            "APPROVED"
          );
          break;
        case "reject":
          result = await bulkUpdateRegistrationStatus(
            { registrationIds: selectedIds },
            "REJECTED"
          );
          break;
        case "waitlist":
          result = await bulkUpdateRegistrationStatus(
            { registrationIds: selectedIds },
            "WAITLISTED"
          );
          break;
        case "checkin":
          result = await bulkCheckInRegistrations({ registrationIds: selectedIds });
          break;
        case "export":
          if (filters.eventId && filters.eventId !== "ALL") {
            result = await exportRegistrations(filters.eventId);
            if (result.success && result.data) {
              const exportData = result.data as { headers: string[]; rows: Record<string, string>[] };
              const escapeCsv = (value: string) => {
                if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              };
              const csvContent = [
                exportData.headers.map(escapeCsv).join(","),
                ...exportData.rows.map((row: Record<string, string>) =>
                  Object.values(row).map((val) => escapeCsv(String(val))).join(",")
                ),
              ].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `registrations-${filters.eventId}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }
          }
          break;
      }

      if (result?.success) {
        setSelectedIds([]);
        fetchRegistrations();
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
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      let result = await deleteRegistration(id);
      if (result.success) {
        fetchRegistrations();
        fetchStats();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrations</h1>
          <p className="text-muted-foreground">
            Manage event registrations, approvals, and check-ins
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 md:grid-cols-3 lg:grid-cols-6"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRegistrations}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingRegistrations}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.approvedRegistrations}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.rejectedRegistrations}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waitlisted</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.waitlistedRegistrations}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.checkedInRegistrations}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registration List</CardTitle>
              <CardDescription>
                View and manage all event registrations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or pass number..."
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
                value={filters.eventId}
                onValueChange={handleEventFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by event" />
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
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="From date"
                  value={filters.dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full sm:w-[160px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="date"
                  placeholder="To date"
                  value={filters.dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full sm:w-[160px]"
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
                    onClick={() => handleBulkAction("approve")}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkAction("reject")}
                    disabled={isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Reject
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkAction("waitlist")}
                    disabled={isPending}
                  >
                    <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                    Waitlist
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkAction("checkin")}
                    disabled={isPending}
                  >
                    <UserCheck className="mr-2 h-4 w-4 text-purple-500" />
                    Check In
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkAction("export")}
                    disabled={isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Table */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 rounded-lg border p-4"
                  >
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : registrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No registrations found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filters.search ||
                  filters.status !== "ALL" ||
                  filters.eventId !== "ALL" ||
                  filters.festivalId !== "ALL" ||
                  filters.dateFrom ||
                  filters.dateTo
                    ? "Try adjusting your search or filter criteria" :"Registrations will appear here once users register for events"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All Header */}
                <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                  <Checkbox
                    checked={
                      selectedIds.length === registrations.length &&
                      registrations.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium w-[120px]">
                    Pass Number
                  </span>
                  <span className="text-sm font-medium w-[200px]">User</span>
                  <span className="text-sm font-medium w-[150px]">Event</span>
                  <span className="text-sm font-medium w-[100px]">Status</span>
                  <span className="text-sm font-medium w-[120px]">
                    Registered
                  </span>
                  <span className="ml-auto text-sm font-medium">Actions</span>
                </div>

                {/* Registration Items */}
                <AnimatePresence>
                  {registrations.map((registration) => (
                    <motion.div
                      key={registration.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedIds.includes(registration.id)}
                        onCheckedChange={() =>
                          handleSelectRegistration(registration.id)
                        }
                      />
                      <div className="w-[120px]">
                        <span className="font-mono text-sm font-medium">
                          {registration.passNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 w-[200px] min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {registration.user?.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {registration.user?.globalName ||
                              registration.user?.username ||
                              "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {registration.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="w-[150px] min-w-0">
                        <p className="text-sm truncate">
                          {registration.event?.title || "N/A"}
                        </p>
                      </div>
                      <div className="w-[100px]">
                        <Badge
                          className={`${REGISTRATION_STATUS_COLORS[registration.status]} flex items-center gap-1 w-fit`}
                        >
                          {STATUS_ICONS[registration.status]}
                          {REGISTRATION_STATUS_LABELS[registration.status]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground w-[120px]">
                        {formatDate(registration.registeredAt)}
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            router.push(
                              `/dashboard/registrations/${registration.id}`
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {registration.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              onClick={() =>
                                setApprovalDialog({
                                  open: true,
                                  action: "approve",
                                  registrationId: registration.id,
                                  passNumber: registration.passNumber,
                                })
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() =>
                                setApprovalDialog({
                                  open: true,
                                  action: "reject",
                                  registrationId: registration.id,
                                  passNumber: registration.passNumber,
                                })
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {registration.status === "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-purple-600 hover:text-purple-700"
                            onClick={() =>
                              setApprovalDialog({
                                open: true,
                                action: "waitlist",
                                registrationId: registration.id,
                                passNumber: registration.passNumber,
                              })
                            }
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        )}
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
                  of {pagination.total} registrations
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

      {/* Approval Dialog */}
      {approvalDialog && (
        <ApprovalDialog
          open={approvalDialog.open}
          onOpenChange={(open) =>
            setApprovalDialog(open ? approvalDialog : null)
          }
          action={approvalDialog.action}
          registrationPassNumber={approvalDialog.passNumber}
          onConfirm={handleApprovalConfirm}
          isPending={isPending}
        />
      )}
    </div>
  );
}
