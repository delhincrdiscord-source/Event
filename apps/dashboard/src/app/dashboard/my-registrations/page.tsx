"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { Card, CardContent,  } from "@gameverse/ui/card";
import { Badge } from "@gameverse/ui/badge";
import { Button } from "@gameverse/ui/button";
import { Skeleton } from "@gameverse/ui/skeleton";

import { getMyRegistrations } from "@/app/dashboard/_actions/gamification";

type Registration = {
  id: string;
  passNumber: string;
  status: string;
  registeredAt: Date;
  event: { title: string; startDate: Date } | null;
  festival: { name: string };
};

const STATUS_STYLES: Record<string, { color: string; icon: string }> = {
  PENDING: {
    color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    icon: "⏳",
  },
  APPROVED: {
    color: "bg-green-500/15 text-green-600 border-green-500/30",
    icon: "✅",
  },
  REJECTED: {
    color: "bg-red-500/15 text-red-600 border-red-500/30",
    icon: "❌",
  },
  WAITLISTED: {
    color: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    icon: "📋",
  },
  CHECKED_IN: {
    color: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    icon: "🎟️",
  },
  COMPLETED: {
    color: "bg-green-500/15 text-green-600 border-green-500/30",
    icon: "🏁",
  },
  CANCELLED: {
    color: "bg-gray-500/15 text-gray-500 border-gray-500/30",
    icon: "🚫",
  },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRegistrations() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getMyRegistrations();
        if (!result.success) {
          if (result.code === "UNAUTHORIZED") {
            window.location.href = "/login";
            return;
          }
          setError(result.error ?? "Failed to load registrations");
          return;
        }
        setRegistrations(result.data);
      } catch {
        setError("Something went wrong loading your registrations");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRegistrations();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          📝 My Registrations
        </h1>
        <p className="text-muted-foreground">
          Track your event registrations and their status
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-6 w-[80px] rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[160px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <span className="text-4xl">⚠️</span>
            <h3 className="mt-4 text-lg font-semibold">Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : registrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <span className="text-5xl">📭</span>
            <h3 className="mt-4 text-lg font-semibold">
              No registrations yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              You haven&apos;t registered for any events yet. Browse available
              events and sign up to get started!
            </p>
            <Button className="mt-6 rounded-full">
              <Link href="/dashboard/events">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2"
        >
          {registrations.map((reg) => {
            const statusStyle =
              STATUS_STYLES[reg.status] ?? { color: "bg-gray-500/15 text-gray-500 border-gray-500/30", icon: "📋" };

            return (
              <motion.div key={reg.id} variants={item}>
                <Card className="transition-all hover:border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">
                          {reg.event?.title || "Event unavailable"}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {reg.festival.name}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${statusStyle.color}`}
                      >
                        {statusStyle.icon} {reg.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>🎟️</span>
                        <span className="font-mono text-xs">
                          {reg.passNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                          Registered {formatDateTime(reg.registeredAt)}
                        </span>
                      </div>
                      {reg.event?.startDate && (
                        <div className="flex items-center gap-2">
                          <span>⏰</span>
                          <span>
                            Event starts {formatDateTime(reg.event.startDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
