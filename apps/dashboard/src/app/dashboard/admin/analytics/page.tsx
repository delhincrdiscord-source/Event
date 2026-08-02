"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Calendar, Users, Bell, MessageSquare, Activity, CheckCircle2, Clock, AlertCircle,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@gameverse/ui/button";
import { Skeleton } from "@gameverse/ui/skeleton";

import { StatCard } from "./_components/stat-card";
import { RegistrationTrendChart } from "./_components/registration-trend-chart";
import { DailyActivityChart } from "./_components/daily-activity-chart";
import { EventAttendanceChart } from "./_components/event-attendance-chart";
import { ApprovalRateChart } from "./_components/approval-rate-chart";
import { PopularEventsChart } from "./_components/popular-events-chart";
import { ActiveDaysChart } from "./_components/active-days-chart";
import { RegistrationSourcesChart } from "./_components/registration-sources-chart";
import { DiscordGrowthChart } from "./_components/discord-growth-chart";
import { RecentRegistrationsTable } from "./_components/recent-registrations-table";
import { RecentEventsTable } from "./_components/recent-events-table";
import { RecentAnnouncementsTable } from "./_components/recent-announcements-table";
import { RecentNotificationsTable } from "./_components/recent-notifications-table";
import { WebhookFailuresTable } from "./_components/webhook-failures-table";
import { AnalyticsFiltersComponent } from "./_components/analytics-filters";
import { ExportButton } from "./_components/export-button";
import { getAnalyticsDashboard } from "./_actions/analytics";
import type { AnalyticsDashboardData, AnalyticsFilters } from "@gameverse/types";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAnalyticsDashboard(filters);
      if (result.success && result.data) {
        setData(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Real-time insights for your festival
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnalyticsFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
          <ExportButton filters={filters} disabled={isLoading || !data} />
          <Button variant="outline" size="sm" onClick={fetchData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[350px] w-full" />
              <Skeleton className="h-[350px] w-full" />
            </div>
          </motion.div>
        ) : data ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Active Festival"
                value={data.overview.activeFestival?.name ?? "None"}
                description={
                  data.overview.activeFestival
                    ? `${new Date(data.overview.activeFestival.startDate).toLocaleDateString()} - ${new Date(data.overview.activeFestival.endDate).toLocaleDateString()}`
                    : "No active festival"
                }
                icon={Calendar}
              />
              <StatCard
                title="Upcoming Events"
                value={data.overview.upcomingEvents}
                description="Events scheduled"
                icon={BarChart3}
              />
              <StatCard
                title="Today's Events"
                value={data.overview.todayEvents}
                description="Events today"
                icon={Clock}
              />
              <StatCard
                title="Total Members"
                value={data.overview.totalMembers}
                description="Registered users"
                icon={Users}
              />
              <StatCard
                title="Pending Registrations"
                value={data.overview.pendingRegistrations}
                description="Awaiting approval"
                icon={AlertCircle}
                className="border-yellow-200"
              />
              <StatCard
                title="Approved Registrations"
                value={data.overview.approvedRegistrations}
                description={`${data.overview.totalRegistrations} total`}
                icon={CheckCircle2}
                className="border-green-200"
              />
              <StatCard
                title="Rejected Registrations"
                value={data.overview.rejectedRegistrations}
                description="Declined"
                icon={AlertCircle}
                className="border-red-200"
              />
              <StatCard
                title="Waitlisted"
                value={data.overview.waitlistedRegistrations}
                description="On waitlist"
                icon={Clock}
                className="border-blue-200"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Discord Bot"
                value={data.overview.discordStatus.botOnline ? "Online" : "Offline"}
                description="Bot status"
                icon={MessageSquare}
                className={
                  data.overview.discordStatus.botOnline
                    ? "border-green-200" :"border-red-200"
                }
              />
              <StatCard
                title="Active Webhooks"
                value={data.overview.discordStatus.totalWebhooks}
                description="Configured webhooks"
                icon={Bell}
              />
              <StatCard
                title="Active Automations"
                value={data.overview.discordStatus.activeAutomations}
                description="Running automations"
                icon={Activity}
              />
              <StatCard
                title="Webhook Failures"
                value={data.overview.discordStatus.webhookFailures}
                description="Last 24 hours"
                icon={AlertCircle}
                className={
                  data.overview.discordStatus.webhookFailures > 0
                    ? "border-red-200" :""
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <RegistrationTrendChart data={data.registrationTrend} />
              <DailyActivityChart data={data.dailyActivity} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ApprovalRateChart data={data.approvalRate} />
              <RegistrationSourcesChart data={data.registrationSources} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <PopularEventsChart data={data.popularEvents} />
              <ActiveDaysChart data={data.activeDays} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <EventAttendanceChart data={data.eventAttendance} />
              <DiscordGrowthChart data={data.discordGrowth} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <RecentRegistrationsTable data={data.recentRegistrations} />
              <RecentEventsTable data={data.recentEvents} />
              <RecentAnnouncementsTable data={data.recentAnnouncements} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <RecentNotificationsTable data={data.recentNotifications} />
              <WebhookFailuresTable data={data.webhookFailures} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No analytics data available</p>
            <p className="text-sm text-muted-foreground">
              Create some events and registrations to see analytics
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
