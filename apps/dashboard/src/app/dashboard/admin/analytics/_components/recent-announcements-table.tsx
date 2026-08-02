"use client";

import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Skeleton } from "@gameverse/ui/skeleton";
import type { RecentAnnouncement } from "@gameverse/types";

interface RecentAnnouncementsTableProps {
  data: RecentAnnouncement[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function RecentAnnouncementsTable({
  data,
  isLoading = false,
}: RecentAnnouncementsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recent Announcements
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
          Recent Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((announcement) => (
            <div
              key={announcement.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {announcement.title.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{announcement.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {announcement.author.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={
                    STATUS_COLORS[announcement.status] ??
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {announcement.status}
                </Badge>
                <Badge
                  className={
                    PRIORITY_COLORS[announcement.priority] ??
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {announcement.priority}
                </Badge>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent announcements
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
