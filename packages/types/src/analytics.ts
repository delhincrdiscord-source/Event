// =====================================================
// Analytics Types
// =====================================================

export type AnalyticsGranularity = "hour" | "day" | "week" | "month";
export type AnalyticsExportFormat = "csv" | "excel" | "pdf";

export interface AnalyticsFilters {
  festivalId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  granularity?: AnalyticsGranularity;
}

export interface OverviewStats {
  activeFestival: {
    id: string;
    name: string;
    slug: string;
    startDate: Date;
    endDate: Date;
    status: string;
  } | null;
  upcomingEvents: number;
  todayEvents: number;
  totalEvents: number;
  totalRegistrations: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  waitlistedRegistrations: number;
  totalMembers: number;
  discordStatus: {
    botOnline: boolean;
    totalGuilds: number;
    totalWebhooks: number;
    activeAutomations: number;
    webhookFailures: number;
  };
}

export interface RegistrationTrendData {
  date: string;
  count: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface DailyActivityData {
  date: string;
  registrations: number;
  events: number;
  announcements: number;
  notifications: number;
}

export interface EventAttendanceData {
  eventId: string;
  eventTitle: string;
  registered: number;
  checkedIn: number;
  capacity: number | null;
  attendanceRate: number;
}

export interface ApprovalRateData {
  approved: number;
  rejected: number;
  pending: number;
  waitlisted: number;
  total: number;
  rate: number;
}

export interface PopularEventsData {
  eventId: string;
  eventTitle: string;
  registrationCount: number;
  categoryName: string | null;
}

export interface ActiveDaysData {
  day: string;
  count: number;
}

export interface RegistrationSourcesData {
  source: string;
  count: number;
  percentage: number;
}

export interface DiscordGrowthData {
  date: string;
  newMembers: number;
  totalMembers: number;
  activeMembers: number;
}

export interface RecentRegistration {
  id: string;
  passNumber: string;
  status: string;
  registeredAt: Date;
  user: {
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  event: {
    title: string;
  } | null;
  festival: {
    name: string;
  };
}

export interface RecentEvent {
  id: string;
  title: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  status: string;
  location: string | null;
  _count: {
    registrations: number;
  };
  category: {
    name: string;
  } | null;
}

export interface RecentAnnouncement {
  id: string;
  title: string;
  slug: string;
  status: string;
  priority: string;
  createdAt: Date;
  author: {
    username: string;
    avatarUrl: string | null;
  };
}

export interface RecentNotification {
  id: string;
  title: string;
  type: string;
  channel: string;
  status: string;
  createdAt: Date;
  user: {
    username: string;
  };
}

export interface WebhookFailure {
  id: string;
  webhookId: string;
  status: string;
  httpStatus: number | null;
  errorMessage: string | null;
  attemptCount: number;
  nextRetryAt: Date | null;
  createdAt: Date;
  webhook: {
    name: string;
    url: string;
    channel: string | null;
  };
}

export interface AnalyticsDashboardData {
  overview: OverviewStats;
  registrationTrend: RegistrationTrendData[];
  dailyActivity: DailyActivityData[];
  eventAttendance: EventAttendanceData[];
  approvalRate: ApprovalRateData;
  popularEvents: PopularEventsData[];
  activeDays: ActiveDaysData[];
  registrationSources: RegistrationSourcesData[];
  discordGrowth: DiscordGrowthData[];
  recentRegistrations: RecentRegistration[];
  recentEvents: RecentEvent[];
  recentAnnouncements: RecentAnnouncement[];
  recentNotifications: RecentNotification[];
  webhookFailures: WebhookFailure[];
}

export interface AnalyticsExportRow {
  [key: string]: string | number | boolean | Date | null;
}

export interface AnalyticsExportData {
  headers: string[];
  rows: AnalyticsExportRow[];
  filename: string;
}
