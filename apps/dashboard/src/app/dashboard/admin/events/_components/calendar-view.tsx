"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, Clock, CalendarDays, LayoutGrid, CalendarRange,  } from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Badge } from "@gameverse/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@gameverse/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@gameverse/ui/popover";

import { getCalendarEvents } from "../_actions/event";
import type { CalendarEvent, EventStatus } from "@gameverse/types";
import { EVENT_STATUS_LABELS } from "@gameverse/types";

interface CalendarViewProps {
  festivalId?: string;
}

const STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: "bg-slate-500",
  PUBLISHED: "bg-emerald-500",
  LIVE: "bg-green-500",
  COMPLETED: "bg-purple-500",
  CANCELLED: "bg-red-500",
  ARCHIVED: "bg-zinc-500",
};

type ViewMode = "month" | "week" | "day";

export function CalendarView({ festivalId }: CalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    let startDate: Date, endDate: Date;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === "month") {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
    } else if (viewMode === "week") {
      const day = currentDate.getDay();
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - day);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const result = await getCalendarEvents(startDate.toISOString(), endDate.toISOString(), festivalId);
    if (result.success && result.data) setEvents(result.data);
    setIsLoading(false);
  }, [currentDate, festivalId, viewMode]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const navigate = (dir: "prev" | "next") => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === "month") d.setMonth(d.getMonth() + (dir === "next" ? 1 : -1));
      else if (viewMode === "week") d.setDate(d.getDate() + (dir === "next" ? 7 : -7));
      else d.setDate(d.getDate() + (dir === "next" ? 1 : -1));
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    return events.filter(e => new Date(e.start) <= dayEnd && new Date(e.end) >= dayStart);
  };

  const isToday = (date: Date) => {
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  };

  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (d: Date) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // Month view days
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Date[] = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push(new Date(year, month, -i));
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push(new Date(year, month + 1, i));
    return days;
  };

  // Week view days
  const getWeekDays = () => {
    const day = currentDate.getDay();
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  };

  const headerLabel = () => {
    if (viewMode === "month") return currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (viewMode === "week") {
      const days = getWeekDays();
      return `${days[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const EventPill = ({ event }: { event: CalendarEvent }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          draggable
          onDragStart={() => setDraggedEvent(event)}
          onDragEnd={() => setDraggedEvent(null)}
          className="w-full rounded px-1.5 py-0.5 text-left text-xs font-medium truncate hover:opacity-80 transition-opacity cursor-grab active:cursor-grabbing"
          style={{ backgroundColor: event.color || "#5865F2", color: "white" }}
        >
          {event.categoryEmoji && <span className="mr-1">{event.categoryEmoji}</span>}
          {event.title}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{event.title}</h4>
            <Badge className={`${STATUS_COLORS[event.status]} text-white text-xs`}>{EVENT_STATUS_LABELS[event.status]}</Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(event.start)}</div>
            <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(event.start)} – {fmtTime(event.end)}</div>
            {event.categoryName && <div className="flex items-center gap-1"><span>{event.categoryEmoji}</span>{event.categoryName}</div>}
          </div>
          <Button size="sm" className="w-full h-7 text-xs" onClick={() => router.push(`/dashboard/admin/events/${event.id}`)}>
            View Details
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  const DayCell = ({ date, isCurrentMonth = true }: { date: Date; isCurrentMonth?: boolean }) => {
    const dayEvents = getEventsForDay(date);
    const today = isToday(date);
    const isDragOver = dragOverDate && date.toDateString() === dragOverDate.toDateString();

    return (
      <div
        className={`min-h-[100px] p-1 transition-colors ${!isCurrentMonth ? "opacity-40" : ""} ${today ? "bg-primary/5" : ""} ${isDragOver ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragOverDate(date); }}
        onDragLeave={() => setDragOverDate(null)}
        onDrop={() => { setDragOverDate(null); setDraggedEvent(null); }}
      >
        <div className={`mb-1 text-right text-sm ${today ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground ml-auto text-xs font-bold" : ""}`}>
          {date.getDate()}
        </div>
        <div className="space-y-0.5">
          {dayEvents.slice(0, 3).map(e => <EventPill key={e.id} event={e} />)}
          {dayEvents.length > 3 && (
            <p className="text-xs text-muted-foreground px-1">+{dayEvents.length - 3} more</p>
          )}
        </div>
      </div>
    );
  };

  const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">{headerLabel()}</CardTitle>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              {([
                { mode: "month" as ViewMode, icon: LayoutGrid, label: "Month" },
                { mode: "week" as ViewMode, icon: CalendarRange, label: "Week" },
                { mode: "day" as ViewMode, icon: CalendarDays, label: "Day" },
              ]).map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("next")}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Loading events...</div>
          ) : viewMode === "month" ? (
            /* Month View */
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {WEEK_DAYS.map(d => (
                <div key={d} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
              ))}
              {getMonthDays().map((date, i) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                return (
                  <div key={i} className="bg-background">
                    <DayCell date={date} isCurrentMonth={isCurrentMonth} />
                  </div>
                );
              })}
            </div>
          ) : viewMode === "week" ? (
            /* Week View */
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-8 gap-px bg-border rounded-t-lg overflow-hidden">
                  <div className="bg-muted p-2 text-xs font-semibold text-muted-foreground text-center">Time</div>
                  {getWeekDays().map((date, i) => (
                    <div key={i} className={`bg-muted p-2 text-center ${isToday(date) ? "bg-primary/10" : ""}`}>
                      <p className="text-xs font-semibold text-muted-foreground">{WEEK_DAYS[i]}</p>
                      <p className={`text-sm font-bold ${isToday(date) ? "text-primary" : ""}`}>{date.getDate()}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-8 gap-px bg-border max-h-[500px] overflow-y-auto">
                  {HOURS.map(hour => (
                    <React.Fragment key={hour}>
                      <div className="bg-background p-1 text-xs text-muted-foreground text-right pr-2 border-t border-border/30">
                        {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                      </div>
                      {getWeekDays().map((date, di) => {
                        const hourEvents = getEventsForDay(date).filter(e => new Date(e.start).getHours() === hour);
                        return (
                          <div key={`${hour}-${di}`} className={`bg-background min-h-[40px] p-0.5 border-t border-border/30 ${isToday(date) ? "bg-primary/5" : ""}`}>
                            {hourEvents.map(e => <EventPill key={e.id} event={e} />)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Day View */
            <div className="overflow-y-auto max-h-[600px]">
              <div className="space-y-0">
                {HOURS.map(hour => {
                  const hourEvents = getEventsForDay(currentDate).filter(e => new Date(e.start).getHours() === hour);
                  return (
                    <div key={hour} className="flex gap-3 border-t border-border/30 min-h-[60px]">
                      <div className="w-16 shrink-0 py-2 text-xs text-muted-foreground text-right pr-3">
                        {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                      </div>
                      <div className="flex-1 py-1 space-y-1">
                        {hourEvents.map(e => (
                          <div key={e.id} className="rounded-lg p-2 text-sm text-white cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: e.color || "#5865F2" }}
                            onClick={() => router.push(`/dashboard/admin/events/${e.id}`)}>
                            <p className="font-medium">{e.categoryEmoji} {e.title}</p>
                            <p className="text-xs opacity-80">{fmtTime(e.start)} – {fmtTime(e.end)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {EVENT_STATUS_LABELS[status as EventStatus]}
          </span>
        ))}
      </div>
    </div>
  );
}
