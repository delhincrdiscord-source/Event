"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MailOpen,
  Archive,
  Trash2,
  ExternalLink,
  Clock,
  User,
  Tag,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Send,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Separator } from "@gameverse/ui/separator";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  getNotificationById,
  markAsRead,
  archiveNotification,
  deleteNotification,
} from "../_actions/notification";
import { DeleteNotificationDialog } from "../_components/delete-dialog";
import type { NotificationWithRelations } from "@gameverse/types";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_COLORS,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  NOTIFICATION_CHANNEL_LABELS,
} from "@gameverse/types";

export default function NotificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] =
    useState<NotificationWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchNotification = async () => {
      setIsLoading(true);
      try {
        const result = await getNotificationById(id);
        if (result.success && result.data) {
          setNotification(result.data as NotificationWithRelations);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotification();
  }, [id]);

  const handleMarkAsRead = async () => {
    if (!notification) return;
    startTransition(async () => {
      const result = await markAsRead(notification.id);
      if (result.success) {
        setNotification((prev) =>
          prev
            ? { ...prev, isRead: true, readAt: new Date() }
            : prev
        );
      }
    });
  };

  const handleArchive = async () => {
    if (!notification) return;
    startTransition(async () => {
      const result = await archiveNotification(notification.id);
      if (result.success) {
        router.push("/dashboard/notifications");
      }
    });
  };

  const handleDelete = async () => {
    if (!notification) return;
    startTransition(async () => {
      const result = await deleteNotification(notification.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        router.push("/dashboard/notifications");
      }
    });
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#ebebeb] p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Notification not found
        </h3>
        <p className="text-sm text-[#4d4d4d]">
          The notification you are looking for does not exist or has been
          deleted.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/notifications")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notifications
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/notifications")}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Notifications
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {notification.title}
            </h1>
            <Badge
              className={`${NOTIFICATION_TYPE_COLORS[notification.type]} flex items-center gap-1`}
            >
              {NOTIFICATION_TYPE_LABELS[notification.type]}
            </Badge>
            {!notification.isRead && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#0070f3]" />
            )}
          </div>
          <p className="text-[#4d4d4d]">
            Created {formatDate(notification.createdAt)}
            {notification.readAt && (
              <> · Read {formatDate(notification.readAt)}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <Button
              variant="secondary"
              onClick={handleMarkAsRead}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MailOpen className="mr-2 h-4 w-4" />
              )}
              Mark as Read
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleArchive}
            disabled={isPending}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Notification Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Notification Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Title
                </label>
                <p className="mt-1 text-foreground">{notification.title}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Message
                </label>
                <p className="mt-1 whitespace-pre-wrap text-foreground">
                  {notification.message}
                </p>
              </div>
              {notification.link && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Link
                    </label>
                    <a
                      href={notification.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {notification.link}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={notification.isRead ? "default" : "info"}>
                    {notification.isRead ? "Read" : "Unread"}
                  </Badge>
                  {notification.isArchived && (
                    <Badge variant="warning">Archived</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Recipient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {notification.user?.avatarUrl ? (
                  <img
                    src={notification.user.avatarUrl}
                    alt={notification.user.username}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fafafa]">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {notification.user?.username || "Unknown User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.userId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Metadata */}
      {notification.metadata &&
        Object.keys(notification.metadata).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-[#fafafa] p-4 text-sm text-foreground">
                  {JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}

      {/* Delivery Status */}
      {notification.deliveries && notification.deliveries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                Delivery Status
              </CardTitle>
              <CardDescription>
                Notification delivery across channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notification.deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between rounded-lg border border-[#ebebeb] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fafafa]">
                        {delivery.status === "SENT" ? (
                          <CheckCircle2 className="h-4 w-4 text-[#0070f3]" />
                        ) : delivery.status === "FAILED" ? (
                          <AlertCircle className="h-4 w-4 text-[#ee0000]" />
                        ) : delivery.status === "RETRYING" ? (
                          <RotateCw className="h-4 w-4 text-[#f5a623]" />
                        ) : (
                          <Send className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {NOTIFICATION_CHANNEL_LABELS[delivery.channel]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.sentAt
                            ? `Sent ${formatDate(delivery.sentAt)}`
                            : delivery.failedAt
                            ? `Failed ${formatDate(delivery.failedAt)}`
                            : `Created ${formatDate(delivery.createdAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {delivery.errorMessage && (
                        <p
                          className="max-w-[200px] truncate text-xs text-[#ee0000]"
                          title={delivery.errorMessage}
                        >
                          {delivery.errorMessage}
                        </p>
                      )}
                      {delivery.retryCount > 0 && (
                        <Badge variant="outline">
                          {delivery.retryCount} retries
                        </Badge>
                      )}
                      <Badge
                        className={`${DELIVERY_STATUS_COLORS[delivery.status]} flex items-center gap-1`}
                      >
                        {DELIVERY_STATUS_LABELS[delivery.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Delete Dialog */}
      <DeleteNotificationDialog
        notificationTitle={notification.title}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
