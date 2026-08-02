// =====================================================
// Registration Types
// =====================================================

export type RegistrationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WAITLISTED"
  | "CANCELLED"
  | "CHECKED_IN"
  | "COMPLETED";

export interface Registration {
  id: string;
  userId: string;
  festivalId: string;
  eventId?: string | null;
  formVersionId?: string | null;
  passNumber: string;
  status: RegistrationStatus;
  notes?: string | null;
  qrCode?: string | null;
  checkedInAt?: Date | null;
  checkedInBy?: string | null;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  rejectedAt?: Date | null;
  rejectedBy?: string | null;
  cancelReason?: string | null;
  registeredAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface RegistrationListItem {
  id: string;
  userId: string;
  festivalId: string;
  eventId?: string | null;
  passNumber: string;
  status: RegistrationStatus;
  qrCode?: string | null;
  checkedInAt?: Date | null;
  registeredAt: Date;
  user?: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
    globalName?: string | null;
  };
  event?: {
    id: string;
    title: string;
    slug: string;
  };
  festival?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    responses: number;
    notesList: number;
  };
}

export interface RegistrationWithRelations extends Registration {
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
    globalName?: string | null;
    bio?: string | null;
  };
  event?: {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date;
    location?: string | null;
  } | null;
  festival: {
    id: string;
    name: string;
    slug: string;
  };
  formVersion?: {
    id: string;
    version: number;
    fieldsJson: unknown;
  } | null;
  responses: {
    id: string;
    responseValue: string;
    formField: {
      id: string;
      label: string;
      fieldType: string;
      fieldName: string;
    };
  }[];
  notesList: RegistrationNote[];
  timeline: RegistrationTimeline[];
}

export interface RegistrationNote {
  id: string;
  registrationId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  author?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface RegistrationTimeline {
  id: string;
  registrationId: string;
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  details?: unknown;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface CreateRegistrationInput {
  userId: string;
  festivalId: string;
  eventId: string;
  fullName: string;
  email: string;
  interest: string;
  discordUsername?: string;
  responses: { fieldName: string; value: string }[];
}

export interface UpdateRegistrationInput {
  status?: RegistrationStatus;
  notes?: string;
  cancelReason?: string;
}

export interface RegistrationFilters {
  search?: string;
  festivalId?: string;
  eventId?: string;
  status?: RegistrationStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "registeredAt" | "status" | "user" | "event";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface RegistrationStats {
  totalRegistrations: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  waitlistedRegistrations: number;
  cancelledRegistrations: number;
  checkedInRegistrations: number;
  completedRegistrations: number;
}

export interface PaginatedRegistrations {
  registrations: RegistrationListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface BulkRegistrationAction {
  registrationIds: string[];
}

export interface RegistrationExportRow {
  passNumber: string;
  username: string;
  email: string;
  event: string;
  festival: string;
  status: string;
  registeredAt: string;
  checkedInAt: string;
}

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WAITLISTED: "Waitlisted",
  CANCELLED: "Cancelled",
  CHECKED_IN: "Checked In",
  COMPLETED: "Completed",
};

export const REGISTRATION_STATUS_COLORS: Record<RegistrationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  WAITLISTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  CHECKED_IN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
};

export const REGISTRATION_TIMELINE_ACTIONS: Record<string, string> = {
  CREATED: "Registration Submitted",
  STATUS_CHANGED: "Status Updated",
  NOTE_ADDED: "Note Added",
  CHECKED_IN: "Checked In",
  CANCELLED: "Registration Cancelled",
  FORM_EDITED: "Form Responses Updated",
};
