"use client";

import { motion } from "framer-motion";
import {
  Users,
  CalendarDays,
  Ticket,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "Total Registrations",
    value: "4,823",
    change: "+12.5%",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "Total Events",
    value: "47",
    change: "+3",
    trend: "up" as const,
    icon: CalendarDays,
  },
  {
    title: "Total RSVPs",
    value: "12,450",
    change: "+8.2%",
    trend: "up" as const,
    icon: Ticket,
  },
  {
    title: "Engagement Rate",
    value: "78.3%",
    change: "-2.1%",
    trend: "down" as const,
    icon: TrendingUp,
  },
];

const recentActivity = [
  {
    id: "1",
    user: "Gamer XYZ",
    action: "registered for the festival",
    time: "2 min ago",
    badge: "New",
  },
  {
    id: "2",
    user: "Pro Player",
    action: "RSVPed to Valorant Customs Night",
    time: "15 min ago",
    badge: "Event",
  },
  {
    id: "3",
    user: "Art Creator",
    action: "submitted a gallery item",
    time: "1 hour ago",
    badge: "Gallery",
  },
  {
    id: "4",
    user: "Moderator",
    action: "approved 5 gallery submissions",
    time: "2 hours ago",
    badge: "Moderation",
  },
  {
    id: "5",
    user: "Admin",
    action: "created a new event",
    time: "3 hours ago",
    badge: "Event",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function DashboardHome() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Delhi NCR Gameverse 2026 Festival Dashboard
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">from last week</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {activity.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.badge}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
