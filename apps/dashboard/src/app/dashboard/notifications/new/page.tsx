"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Loader2,
  Send,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Badge } from "@gameverse/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";
import { Checkbox } from "@gameverse/ui/checkbox";
import { Separator } from "@gameverse/ui/separator";

import { createNotification } from "../_actions/notification";
import type { NotificationType, NotificationChannel } from "@gameverse/types";
import { NOTIFICATION_TYPE_LABELS } from "@gameverse/types";

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "SYSTEM", label: "System" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "APPROVAL", label: "Approval" },
  { value: "REMINDER", label: "Reminder" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "EVENT", label: "Event" },
  { value: "CUSTOM", label: "Custom" },
];

interface ChannelOption {
  value: NotificationChannel;
  label: string;
  comingSoon?: boolean;
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  { value: "IN_APP", label: "In-App" },
  { value: "DISCORD", label: "Discord", comingSoon: true },
  { value: "EMAIL", label: "Email", comingSoon: true },
  { value: "PUSH", label: "Push", comingSoon: true },
];

export default function CreateNotificationPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    userId: "",
    type: "" as NotificationType | "",
    title: "",
    message: "",
    link: "",
    metadata: "",
    channels: ["IN_APP"] as NotificationChannel[],
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleChannel = (channel: NotificationChannel) => {
    setForm((prev) => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.userId.trim()) {
      newErrors.userId = "User ID is required";
    } else if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        form.userId.trim()
      )
    ) {
      newErrors.userId = "Invalid UUID format";
    }

    if (!form.type) {
      newErrors.type = "Type is required";
    }

    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.length > 256) {
      newErrors.title = "Title must be at most 256 characters";
    }

    if (!form.message.trim()) {
      newErrors.message = "Message is required";
    }

    if (form.link && form.link.trim()) {
      try {
        new URL(form.link);
      } catch {
        newErrors.link = "Invalid URL format";
      }
    }

    if (form.metadata.trim()) {
      try {
        JSON.parse(form.metadata);
      } catch {
        newErrors.metadata = "Invalid JSON format";
      }
    }

    if (form.channels.length === 0) {
      newErrors.channels = "At least one channel is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      let metadata: Record<string, unknown> | undefined;
      if (form.metadata.trim()) {
        try {
          metadata = JSON.parse(form.metadata);
        } catch {
          return;
        }
      }

      const result = await createNotification({
        userId: form.userId.trim(),
        type: form.type as NotificationType,
        title: form.title.trim(),
        message: form.message.trim(),
        link: form.link.trim() || undefined,
        metadata,
        channels: form.channels,
      });

      if (result.success) {
        router.push("/dashboard/notifications");
      }
    });
  };

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#171717]">
          Create Notification
        </h1>
        <p className="text-[#4d4d4d]">
          Send a new notification to a user
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#171717]">
                    Notification Content
                  </CardTitle>
                  <CardDescription>
                    Define the notification details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* User ID */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1.5">
                      User ID <span className="text-[#ee0000]">*</span>
                    </label>
                    <Input
                      placeholder="Enter user UUID"
                      value={form.userId}
                      onChange={(e) => updateField("userId", e.target.value)}
                      className={errors.userId ? "border-[#ee0000]" : ""}
                    />
                    {errors.userId && (
                      <p className="mt-1 text-sm text-[#ee0000]">
                        {errors.userId}
                      </p>
                    )}
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1.5">
                      Type <span className="text-[#ee0000]">*</span>
                    </label>
                    <Select
                      value={form.type}
                      onValueChange={(value) => updateField("type", value)}
                    >
                      <SelectTrigger
                        className={errors.type ? "border-[#ee0000]" : ""}
                      >
                        <SelectValue placeholder="Select notification type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-[#ee0000]">
                        {errors.type}
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1.5">
                      Title <span className="text-[#ee0000]">*</span>
                    </label>
                    <Input
                      placeholder="Notification title"
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      className={errors.title ? "border-[#ee0000]" : ""}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-[#ee0000]">
                        {errors.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[#888888]">
                      {form.title.length}/256 characters
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1.5">
                      Message <span className="text-[#ee0000]">*</span>
                    </label>
                    <textarea
                      placeholder="Notification message content"
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      rows={4}
                      className={`w-full px-3 py-2 text-sm bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-[#171717] focus:border-transparent resize-none ${
                        errors.message
                          ? "border-[#ee0000]"
                          : "border-[#ebebeb]"
                      }`}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-[#ee0000]">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Link */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1.5">
                      Link
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={form.link}
                      onChange={(e) => updateField("link", e.target.value)}
                      className={errors.link ? "border-[#ee0000]" : ""}
                    />
                    {errors.link && (
                      <p className="mt-1 text-sm text-[#ee0000]">
                        {errors.link}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[#888888]">
                      Optional URL to open when notification is clicked
                    </p>
                  </div>

                  {/* Metadata */}
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1.5">
                      Metadata
                    </label>
                    <textarea
                      placeholder='{"key": "value"}'
                      value={form.metadata}
                      onChange={(e) => updateField("metadata", e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 text-sm bg-white border rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#171717] focus:border-transparent resize-none ${
                        errors.metadata
                          ? "border-[#ee0000]"
                          : "border-[#ebebeb]"
                      }`}
                    />
                    {errors.metadata && (
                      <p className="mt-1 text-sm text-[#ee0000]">
                        {errors.metadata}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[#888888]">
                      Optional JSON data to attach to the notification
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Channels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#171717]">Channels</CardTitle>
                  <CardDescription>
                    Select delivery channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {CHANNEL_OPTIONS.map((channel) => (
                    <div
                      key={channel.value}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={form.channels.includes(channel.value)}
                          onCheckedChange={() => toggleChannel(channel.value)}
                          disabled={channel.comingSoon}
                        />
                        <span
                          className={`text-sm ${
                            channel.comingSoon
                              ? "text-[#888888]"
                              : "text-[#171717]"
                          }`}
                        >
                          {channel.label}
                        </span>
                      </div>
                      {channel.comingSoon && (
                        <Badge variant="default" className="text-[10px]">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  ))}
                  {errors.channels && (
                    <p className="text-sm text-[#ee0000]">
                      {errors.channels}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Notification
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() =>
                        router.push("/dashboard/notifications")
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Notifications are delivered immediately to the selected
                      channels. Discord, Email, and Push delivery channels are
                      coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}
