"use client";

import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Skeleton } from "@gameverse/ui/skeleton";
import type { RecentNotification } from "@gameverse/types";

interface RecentNotificationsTableProps {
  data: RecentNotification[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  RETRYING: "bg-orange-100 text-orange-800",
};

const TYPE_COLORS: Record<string, string> = {
  SYSTEM: "bg-blue-100 text-blue-800",
  ANNOUNCEMENT: "bg-purple-100 text-purple-800",
  REGISTRATION: "bg-green-100 text-green-800",
  APPROVAL: "bg-teal-100 text-teal-800",
  REMINDER: "bg-yellow-100 text-yellow-800",
  FESTIVAL: "bg-pink-100 text-pink-800",
  EVENT: "bg-orange-100 text-orange-800",
  CUSTOM: "bg-gray-100 text-gray-800",
};

export function RecentNotificationsTable({
  data,
  isLoading = false,
}: RecentNotificationsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Recent Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {notification.title.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">
                    to {notification.user.username} via {notification.channel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={
                    TYPE_COLORS[notification.type] ??
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {notification.type}
                </Badge>
                <Badge
                  className={
                    STATUS_COLORS[notification.status] ??
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {notification.status}
                </Badge>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent notifications
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
