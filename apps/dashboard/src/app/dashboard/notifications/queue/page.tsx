"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Send, Clock, AlertCircle, RotateCw, Inbox,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import {  } from "@gameverse/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  getNotificationQueue,
  retryFailedDelivery,
} from "../_actions/notification";
import type {
  NotificationQueueItem,
  DeliveryStatus,
  NotificationChannel,
} from "@gameverse/types";
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  NOTIFICATION_CHANNEL_LABELS,
} from "@gameverse/types";

const STATUS_OPTIONS: { value: DeliveryStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
  { value: "RETRYING", label: "Retrying" },
];

const CHANNEL_OPTIONS: {
  value: NotificationChannel | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "All Channels" },
  { value: "IN_APP", label: "In-App" },
  { value: "DISCORD", label: "Discord" },
  { value: "EMAIL", label: "Email" },
  { value: "PUSH", label: "Push" },
];

interface QueueStats {
  pending: number;
  sent: number;
  failed: number;
  retrying: number;
}

export default function NotificationQueuePage() {
  const [isPending, startTransition] = useTransition();
  const [queueItems, setQueueItems] = useState<NotificationQueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    pending: 0,
    sent: 0,
    failed: 0,
    retrying: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "ALL\" as DeliveryStatus | \"ALL",
    channel: "ALL\" as NotificationChannel | \"ALL",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getNotificationQueue({
        status:
          filters.status === "ALL" ? undefined : filters.status,
        channel:
          filters.channel === "ALL" ? undefined : filters.channel,
        page: pagination.page,
        perPage: pagination.perPage,
      });
      if (result.success && result.data) {
        const data = result.data as { items?: NotificationQueueItem[]; total?: number };
        const itemsArray = Array.isArray(data.items) ? data.items : [];
        setQueueItems(itemsArray);
        setPagination((prev) => ({
          ...prev,
          total: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / prev.perPage),
        }));

        const stats: QueueStats = { pending: 0, sent: 0, failed: 0, retrying: 0 };
        for (const item of itemsArray) {
          if (item.status === "PENDING") stats.pending++;
          else if (item.status === "SENT") stats.sent++;
          else if (item.status === "FAILED") stats.failed++;
          else if (item.status === "RETRYING") stats.retrying++;
        }
        setQueueStats(stats);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as DeliveryStatus | "ALL",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleChannelFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      channel: value as NotificationChannel | "ALL",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleRetry = async (deliveryId: string) => {
    startTransition(async () => {
      const result = await retryFailedDelivery(deliveryId);
      if (result.success) {
        fetchQueue();
      }
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#171717]">
          Notification Queue
        </h1>
        <p className="text-[#4d4d4d]">
          Monitor notification delivery status and retry failed deliveries
        </p>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#171717]">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-[#888888]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#171717]">
              {queueStats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#171717]">
              Sent
            </CardTitle>
            <Send className="h-4 w-4 text-[#888888]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#171717]">
              {queueStats.sent}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#171717]">
              Failed
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-[#888888]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ee0000]">
              {queueStats.failed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#171717]">
              Retrying
            </CardTitle>
            <RotateCw className="h-4 w-4 text-[#888888]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#171717]">
              {queueStats.retrying}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#171717]">Delivery Queue</CardTitle>
          <CardDescription>
            Track and manage notification deliveries across all channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
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
                value={filters.channel}
                onValueChange={handleChannelFilter}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loading Skeletons */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 rounded-lg border border-[#ebebeb] p-4"
                  >
                    <Skeleton className="h-4 w-[180px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : queueItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#ebebeb] p-8 text-center">
                <Inbox className="h-12 w-12 text-[#888888]" />
                <h3 className="mt-4 text-lg font-semibold text-[#171717]">
                  No queue items found
                </h3>
                <p className="text-sm text-[#4d4d4d]">
                  {filters.status !== "ALL"|| filters.channel !== "ALL" ?"Try adjusting your filter criteria" :"The notification delivery queue is empty"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center space-x-4 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-4 py-2">
                  <span className="text-sm font-medium text-[#171717] w-[220px]">
                    Notification
                  </span>
                  <span className="text-sm font-medium text-[#171717] w-[90px]">
                    Channel
                  </span>
                  <span className="text-sm font-medium text-[#171717] w-[90px]">
                    Status
                  </span>
                  <span className="text-sm font-medium text-[#171717] w-[140px]">
                    Sent At
                  </span>
                  <span className="text-sm font-medium text-[#171717] w-[140px]">
                    Failed At
                  </span>
                  <span className="text-sm font-medium text-[#171717] w-[120px]">
                    Error
                  </span>
                  <span className="text-sm font-medium text-[#171717] w-[60px]">
                    Retries
                  </span>
                  <span className="ml-auto text-sm font-medium text-[#171717]">
                    Actions
                  </span>
                </div>

                {/* Queue Items */}
                <AnimatePresence>
                  {queueItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-4 rounded-lg border border-[#ebebeb] p-4 transition-colors hover:bg-[#fafafa]"
                    >
                      <div className="flex-1 min-w-0 w-[220px]">
                        <p className="font-medium text-[#171717] truncate">
                          {item.notification?.title || "Unknown"}
                        </p>
                        {item.notification?.user && (
                          <p className="text-xs text-[#888888] truncate">
                            {item.notification.user.username}
                          </p>
                        )}
                      </div>
                      <div className="w-[90px]">
                        <Badge variant="outline">
                          {NOTIFICATION_CHANNEL_LABELS[item.channel]}
                        </Badge>
                      </div>
                      <div className="w-[90px]">
                        <Badge
                          className={`${DELIVERY_STATUS_COLORS[item.status]} flex items-center gap-1`}
                        >
                          {DELIVERY_STATUS_LABELS[item.status]}
                        </Badge>
                      </div>
                      <div className="text-sm text-[#4d4d4d] w-[140px]">
                        {formatDate(item.sentAt ?? null)}
                      </div>
                      <div className="text-sm text-[#4d4d4d] w-[140px]">
                        {formatDate(item.failedAt ?? null)}
                      </div>
                      <div className="text-sm text-[#ee0000] w-[120px] truncate" title={item.errorMessage || undefined}>
                        {item.errorMessage || "—"}
                      </div>
                      <div className="text-sm text-[#4d4d4d] w-[60px] text-center">
                        {item.retryCount}
                      </div>
                      <div className="ml-auto">
                        {item.status === "FAILED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(item.id)}
                            disabled={isPending}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
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
                <p className="text-sm text-[#4d4d4d]">
                  Showing {(pagination.page - 1) * pagination.perPage + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.perPage,
                    pagination.total
                  )}{" "}
                  of {pagination.total} items
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
                  <span className="text-sm text-[#171717]">
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
    </div>
  );
}
