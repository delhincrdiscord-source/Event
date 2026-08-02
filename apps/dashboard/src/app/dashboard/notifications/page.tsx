"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, ChevronRight, Plus, Search, MoreHorizontal, Archive, Trash2, Eye, MailOpen, CheckCheck, Inbox, Mail, ArchiveIcon,  } from "lucide-react";
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
  getNotifications,
  getNotificationStats,
  markAsRead,
  archiveNotification,
  deleteNotification,
  bulkArchiveNotifications,
  bulkDeleteNotifications,
} from "./_actions/notification";
import { DeleteNotificationDialog } from "./_components";
import type { NotificationListItem, NotificationType, NotificationStats,  } from "@gameverse/types";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_COLORS,
} from "@gameverse/types";

const TYPE_OPTIONS: { value: NotificationType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "SYSTEM", label: "System" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "APPROVAL", label: "Approval" },
  { value: "REMINDER", label: "Reminder" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "EVENT", label: "Event" },
  { value: "CUSTOM", label: "Custom" },
];

const READ_OPTIONS: { value: "ALL" | "READ" | "UNREAD"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "READ", label: "Read" },
  { value: "UNREAD", label: "Unread" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    type: "ALL\" as NotificationType | \"ALL",
    readFilter: "ALL\" as \"ALL\" | \"READ\" | \"UNREAD",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationListItem | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      let result = await getNotifications({
        search: filters.search || undefined,
        type: filters.type === "ALL" ? undefined : filters.type,
        isRead:
          filters.readFilter === "ALL"
            ? undefined
            : filters.readFilter === "READ",
        isArchived: false,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: pagination.page,
        perPage: pagination.perPage,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (result.success && result.data) {
        const data = result.data as { notifications: NotificationListItem[]; total: number; totalPages: number };
        setNotifications(data.notifications);
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
    let result = await getNotificationStats();
    if (result.success && result.data) {
      setStats(result.data as NotificationStats);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTypeFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      type: value as NotificationType | "ALL",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleReadFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      readFilter: value as "ALL" | "READ" | "UNREAD",
    }));
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
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (!selectedIds.length) return;

    startTransition(async () => {
      let result;
      switch (action) {
        case "read":
          for (const id of selectedIds) {
            await markAsRead(id);
          }
          result = { success: true };
          break;
        case "archive":
          result = await bulkArchiveNotifications({
            notificationIds: selectedIds,
          });
          break;
        case "delete":
          result = await bulkDeleteNotifications({
            notificationIds: selectedIds,
          });
          break;
      }

      if (result?.success) {
        setSelectedIds([]);
        fetchNotifications();
        fetchStats();
      }
    });
  };

  const handleMarkAsRead = async (id: string) => {
    startTransition(async () => {
      let result = await markAsRead(id);
      if (result.success) {
        fetchNotifications();
        fetchStats();
      }
    });
  };

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      let result = await archiveNotification(id);
      if (result.success) {
        fetchNotifications();
        fetchStats();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      let result = await deleteNotification(id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedNotification(null);
        fetchNotifications();
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

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Manage and send notifications to your community
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/notifications/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notification
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
              <CardTitle className="text-sm font-medium text-foreground">
                Total
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalNotifications}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Unread
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.unreadNotifications}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Read
              </CardTitle>
              <MailOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.readNotifications}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Archived
              </CardTitle>
              <ArchiveIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.archivedNotifications}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Notification List</CardTitle>
          <CardDescription>
            View and manage all your notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filters Row 1: Search and Dropdowns */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filters.type}
                onValueChange={handleTypeFilter}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.readFilter}
                onValueChange={handleReadFilter}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {READ_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters Row 2: Date Range */}
            <div className="flex flex-col gap-4 sm:flex-row">
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
                  className="flex items-center gap-2 rounded-lg border bg-[#fafafa] p-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selected
                  </span>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkAction("read")}
                    disabled={isPending}
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark Read
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
                    className="flex items-center space-x-4 rounded-lg border border-[#ebebeb] p-4"
                  >
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-4 w-[90px]" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#ebebeb] p-8 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No notifications found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filters.search ||
                  filters.type !== "ALL" ||
                  filters.readFilter !== "ALL" ||
                  filters.dateFrom ||
                  filters.dateTo
                    ? "Try adjusting your search or filter criteria" :"Create your first notification to get started"}
                </p>
                {!filters.search &&
                  filters.type === "ALL" &&
                  filters.readFilter === "ALL" &&
                  !filters.dateFrom &&
                  !filters.dateTo && (
                    <Button
                      className="mt-4"
                      onClick={() =>
                        router.push("/dashboard/notifications/new")
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Notification
                    </Button>
                  )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All Header */}
                <div className="flex items-center space-x-4 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-4 py-2">
                  <Checkbox
                    checked={
                      selectedIds.length === notifications.length &&
                      notifications.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium text-foreground w-[220px]">
                    Title
                  </span>
                  <span className="text-sm font-medium text-foreground w-[110px]">
                    Type
                  </span>
                  <span className="text-sm font-medium text-foreground w-[180px]">
                    Message
                  </span>
                  <span className="text-sm font-medium text-foreground w-[100px]">
                    User
                  </span>
                  <span className="text-sm font-medium text-foreground w-[80px]">
                    Read
                  </span>
                  <span className="text-sm font-medium text-foreground w-[100px]">
                    Created
                  </span>
                  <span className="ml-auto text-sm font-medium text-foreground">
                    Actions
                  </span>
                </div>

                {/* Notification Items */}
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-center space-x-4 rounded-lg border border-[#ebebeb] p-4 transition-colors hover:bg-[#fafafa] ${
                        !notification.isRead ? "bg-[#fafafa]" : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedIds.includes(notification.id)}
                        onCheckedChange={() =>
                          handleSelectNotification(notification.id)
                        }
                      />
                      <div className="flex-1 min-w-0 w-[220px]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/notifications/${notification.id}`
                              )
                            }
                            className={`font-medium hover:underline truncate ${
                              !notification.isRead
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {notification.title}
                          </button>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-[#0070f3] shrink-0" />
                          )}
                        </div>
                      </div>
                      <div className="w-[110px]">
                        <Badge
                          className={`${NOTIFICATION_TYPE_COLORS[notification.type]} flex items-center gap-1`}
                        >
                          {NOTIFICATION_TYPE_LABELS[notification.type]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground w-[180px] truncate">
                        {truncateMessage(notification.message)}
                      </div>
                      <div className="text-sm text-muted-foreground w-[100px] truncate">
                        {notification.userId.slice(0, 8)}...
                      </div>
                      <div className="w-[80px]">
                        <Badge
                          variant={notification.isRead ? "default" : "info"}
                        >
                          {notification.isRead ? "Read" : "Unread"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground w-[100px]">
                        {formatDate(notification.createdAt)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/dashboard/notifications/${notification.id}`
                              )
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {!notification.isRead && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <MailOpen className="mr-2 h-4 w-4" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleArchive(notification.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedNotification(notification);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-[#ee0000]"
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
                  Showing {(pagination.page - 1) * pagination.perPage + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.perPage,
                    pagination.total
                  )}{" "}
                  of {pagination.total} notifications
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
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

      {/* Delete Dialog */}
      {selectedNotification && (
        <DeleteNotificationDialog
          notificationTitle={selectedNotification.title}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={() => handleDelete(selectedNotification.id)}
          isPending={isPending}
        />
      )}
    </div>
  );
}
