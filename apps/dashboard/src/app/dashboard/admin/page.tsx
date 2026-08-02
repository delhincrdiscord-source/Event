"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  Ticket,
  Megaphone,
  Image,
  BarChart3,
  MessageCircle,
  FormInput,
  FolderOpen,
  ChevronRight,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react";
import { getCurrentUser } from "../_actions/user";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

interface AdminStat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

const adminSections: AdminStat[] = [
  { label: "Festivals", value: "Manage", icon: Calendar, href: "/dashboard/admin/festivals", color: "text-yellow-500" },
  { label: "Events", value: "Manage", icon: CalendarDays, href: "/dashboard/admin/events", color: "text-blue-500" },
  { label: "Registrations", value: "View All", icon: Ticket, href: "/dashboard/admin/registrations", color: "text-green-500" },
  { label: "Announcements", value: "Send", icon: Megaphone, href: "/dashboard/admin/announcements", color: "text-purple-500" },
  { label: "Categories", value: "Organize", icon: FolderOpen, href: "/dashboard/admin/categories", color: "text-orange-500" },
  { label: "Gallery", value: "Upload", icon: Image, href: "/dashboard/admin/gallery", color: "text-pink-500" },
  { label: "Analytics", value: "View", icon: BarChart3, href: "/dashboard/admin/analytics", color: "text-cyan-500" },
  { label: "Discord", value: "Configure", icon: MessageCircle, href: "/dashboard/admin/discord", color: "text-indigo-500" },
  { label: "Form Builder", value: "Create", icon: FormInput, href: "/dashboard/admin/form-builder", color: "text-teal-500" },
];

export default function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((res) => {
      if (res.success && res.data) setUsername(res.data.username);
    }).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-9 w-64 animate-pulse rounded bg-[var(--muted)]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Admin Panel 🛡️
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Welcome back, {username || "Admin"}. Manage your festival from here.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Users"
          value="—"
          description="Registered participants"
          color="text-blue-500"
        />
        <StatCard
          icon={Activity}
          label="Active Events"
          value="—"
          description="Currently running"
          color="text-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Registrations"
          value="—"
          description="Total signups"
          color="text-purple-500"
        />
      </motion.div>

      {/* Admin Sections Grid */}
      <motion.div variants={item}>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Management Sections</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)] hover:bg-[var(--background)]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--muted)] ${section.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                    {section.label}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">{section.value}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--muted)] ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}
