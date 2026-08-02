"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Clock, ChevronRight, Search,  } from "lucide-react";

import {
  Card,
  CardContent,
} from "@gameverse/ui/card";
import { Badge } from "@gameverse/ui/badge";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  getParticipantEvents,
  type ParticipantEvent,
} from "@/app/dashboard/_actions/events";

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
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventStatus(event: ParticipantEvent): {
  label: string;
  color: string;
  icon: string;
} {
  const now = new Date();
  const start = new Date(event.startDate);

  if (event.isRegistered) {
    return {
      label: "Registered",
      color: "bg-green-500/15 text-green-600 border-green-500/30",
      icon: "✅",
    };
  }

  if (event.capacity && event.currentParticipants >= event.capacity) {
    return {
      label: "Full",
      color: "bg-red-500/15 text-red-600 border-red-500/30",
      icon: "🚫",
    };
  }

  if (start < now) {
    return {
      label: "Live",
      color: "bg-purple-500/15 text-purple-600 border-purple-500/30",
      icon: "🔴",
    };
  }

  return {
    label: "Open",
    color: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    icon: "🎮",
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<ParticipantEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "registered">("all");

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getParticipantEvents();
        if (!result.success) {
          if (result.code === "UNAUTHORIZED") {
            window.location.href = "/login";
            return;
          }
          setError(result.error ?? "Failed to load events");
          return;
        }
        setEvents(result.data);
      } catch {
        setError("Something went wrong loading events");
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const now = new Date();

  const filtered = events.filter((ev) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !ev.title.toLowerCase().includes(q) &&
        !(ev.category ?? "").toLowerCase().includes(q) &&
        !(ev.location ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filter === "upcoming") {
      return new Date(ev.startDate) > now;
    }
    if (filter === "registered") {
      return ev.isRegistered;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📅 Events</h1>
        <p className="text-muted-foreground">
          Browse and register for upcoming events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "upcoming", "registered"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-36 w-full rounded-t-lg" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                  </div>
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <span className="text-5xl">🎮</span>
            <h3 className="mt-4 text-lg font-semibold">
              {search || filter !== "all" ? "No matching events" : "No events yet"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {search || filter !== "all" ?"Try adjusting your search or filters" :"Events will appear here once they are published"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((ev) => {
            const status = getEventStatus(ev);
            return (
              <motion.div key={ev.id} variants={item}>
                <Card className="group overflow-hidden transition-all hover:border-[var(--primary)]/20 hover:shadow-md">
                  <CardContent className="p-0">
                    {/* Banner */}
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5">
                      {ev.bannerUrl ? (
                        <img
                          src={ev.bannerUrl}
                          alt={ev.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-5xl opacity-40">🎮</span>
                        </div>
                      )}
                      {/* Status badge */}
                      <div className="absolute right-3 top-3">
                        <Badge
                          variant="outline"
                          className={`${status.color} backdrop-blur-sm`}
                        >
                          {status.icon} {status.label}
                        </Badge>
                      </div>
                      {/* Category */}
                      {ev.category && (
                        <div className="absolute bottom-3 left-3">
                          <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                            {ev.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3 p-4">
                      <h3 className="font-semibold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                        {ev.title}
                      </h3>

                      {ev.shortDescription && (
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                          {ev.shortDescription}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(ev.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(ev.startDate)}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {ev.location}
                          </span>
                        )}
                        {ev.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {ev.currentParticipants}/{ev.capacity}
                          </span>
                        )}
                      </div>

                      {/* Action */}
                      <div className="pt-1">
                        {ev.isRegistered ? (
                          <Link
                            href="/dashboard/my-registrations"
                            className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-500/20"
                          >
                            ✅ View Registration
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/events/${ev.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
                          >
                            🎮 View Details
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
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
