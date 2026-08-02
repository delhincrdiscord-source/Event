"use client";

import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Skeleton } from "@gameverse/ui/skeleton";
import type { RecentRegistration } from "@gameverse/types";

interface RecentRegistrationsTableProps {
  data: RecentRegistration[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WAITLISTED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  CHECKED_IN: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export function RecentRegistrationsTable({
  data,
  isLoading = false,
}: RecentRegistrationsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recent Registrations
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
          Recent Registrations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((reg) => (
            <div
              key={reg.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {reg.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{reg.user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {reg.passNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm">{reg.event?.title ?? "N/A"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(reg.registeredAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={
                    STATUS_COLORS[reg.status] ?? "bg-gray-100 text-gray-800"
                  }
                >
                  {reg.status}
                </Badge>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent registrations
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
