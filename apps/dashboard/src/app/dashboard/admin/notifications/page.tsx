"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, Send, Users, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Textarea } from "@gameverse/ui/textarea";
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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "SYSTEM" as string,
  });

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    setIsSending(true);
    // TODO: Implement send notification API
    setTimeout(() => {
      setIsSending(false);
      alert("Notification sent! (API integration pending)");
    }, 1000);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Send Notifications 📢
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Broadcast notifications to all participants
          </p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
        <Card
          className="cursor-pointer transition-colors hover:border-[var(--primary)]"
          onClick={() => router.push("/dashboard/admin/notifications/new")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send New Notification
            </CardTitle>
            <CardDescription>
              Create and send a custom notification to users
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:border-[var(--primary)]"
          onClick={() => router.push("/dashboard/notifications")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              View All Notifications
            </CardTitle>
            <CardDescription>
              Manage existing notifications and view history
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Quick Send Form */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Send</CardTitle>
            <CardDescription>
              Send a quick notification to all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Notification Title
              </label>
              <Input
                placeholder="Enter notification title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Message
              </label>
              <Textarea
                placeholder="Enter notification message..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Type
              </label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                  <SelectItem value="REMINDER">Reminder</SelectItem>
                  <SelectItem value="FESTIVAL">Festival</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSend}
              disabled={!form.title || !form.message || isSending}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to All Users
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Broadcast Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">—</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Total Recipients
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">—</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Sent Today
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">—</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Read Rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
