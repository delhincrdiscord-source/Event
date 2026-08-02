"use client";

import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Skeleton } from "@gameverse/ui/skeleton";
import type { RecentEvent } from "@gameverse/types";

interface RecentEventsTableProps {
  data: RecentEvent[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-blue-100 text-blue-800",
  LIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

export function RecentEventsTable({
  data,
  isLoading = false,
}: RecentEventsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
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
        <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {event.title.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.category?.name ?? "Uncategorized"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm">
                    {event._count.registrations} registrations
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={
                    STATUS_COLORS[event.status] ?? "bg-gray-100 text-gray-800"
                  }
                >
                  {event.status}
                </Badge>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent events
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
