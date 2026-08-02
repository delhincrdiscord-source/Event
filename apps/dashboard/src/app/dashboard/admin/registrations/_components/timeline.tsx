"use client";

import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  UserCheck,
  UserX,
  XCircle,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { motion } from "framer-motion";

import type { RegistrationTimeline as TimelineType } from "@gameverse/types";
import { REGISTRATION_TIMELINE_ACTIONS } from "@gameverse/types";

interface RegistrationTimelineProps {
  timeline: TimelineType[];
}

const ACTION_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  CREATED: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900",
  },
  STATUS_CHANGED: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
  },
  NOTE_ADDED: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  CHECKED_IN: {
    icon: <LogIn className="h-4 w-4" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900",
  },
  CANCELLED: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  FORM_EDITED: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900",
  },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
  WAITLISTED: <AlertCircle className="h-3 w-3" />,
  CANCELLED: <UserX className="h-3 w-3" />,
  CHECKED_IN: <UserCheck className="h-3 w-3" />,
  PENDING: <Clock className="h-3 w-3" />,
};

function formatTimestamp(date: Date) {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RegistrationTimeline({ timeline }: RegistrationTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Clock className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No activity recorded yet
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {timeline.map((entry, index) => {
        const config = ACTION_CONFIG[entry.action] || {
          icon: <Clock className="h-4 w-4" />,
          color: "text-foreground",
          bgColor: "bg-muted",
        };
        const label =
          REGISTRATION_TIMELINE_ACTIONS[entry.action] || entry.action;
        const details = entry.details as Record<string, unknown> | undefined;
        const newStatus = details?.newStatus ? String(details.newStatus) : undefined;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="relative flex gap-4 pb-6"
          >
            {index < timeline.length - 1 && (
              <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
            )}

            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bgColor} ${config.color}`}
            >
              {entry.action === "STATUS_CHANGED" && newStatus
                ? STATUS_ICONS[newStatus] || config.icon
                : config.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{label}</span>
                {newStatus && entry.action === "STATUS_CHANGED" && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      newStatus === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : newStatus === "REJECTED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          : newStatus === "WAITLISTED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {newStatus}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatTimestamp(entry.createdAt)}</span>
                {entry.actorName && (
                  <>
                    <span>·</span>
                    <span>by {entry.actorName}</span>
                  </>
                )}
              </div>
              {Boolean(details?.reason) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Reason: {String(details?.reason)}
                </p>
              )}
              {Boolean(details?.method) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Method: {String(details?.method)}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
