"use client";

import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Skeleton } from "@gameverse/ui/skeleton";
import type { WebhookFailure } from "@gameverse/types";

interface WebhookFailuresTableProps {
  data: WebhookFailure[];
  isLoading?: boolean;
}

export function WebhookFailuresTable({
  data,
  isLoading = false,
}: WebhookFailuresTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Webhook Failures
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
          Webhook Failures
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((failure) => (
            <div
              key={failure.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-medium text-red-800">
                  !
                </div>
                <div>
                  <p className="text-sm font-medium">{failure.webhook.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {failure.webhook.channel ?? "No channel"} - HTTP{" "}
                    {failure.httpStatus ?? "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {failure.attemptCount} attempts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(failure.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-red-100 text-red-800">FAILED</Badge>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No webhook failures
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
