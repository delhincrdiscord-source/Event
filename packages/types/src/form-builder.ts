// =====================================================
// Form Builder Types
// =====================================================

export type FormFieldType =
  | "SHORT_TEXT" |"LONG_TEXT" |"EMAIL" |"NUMBER" |"PHONE" |"DISCORD_USERNAME" |"DISCORD_USER_ID" |"GAME_UID" |"IGN" |"SELECT" |"MULTI_SELECT" |"CHECKBOX" |"RADIO" |"DATE" |"TIME" |"COUNTRY" |"FILE_UPLOAD" |"URL" |"SECTION_HEADER" |"DIVIDER" |"PARAGRAPH";

export type FormStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldConfig {
  id: string;
  fieldName: string;
  label: string;
  fieldType: FormFieldType;
  description?: string | null;
  placeholder?: string | null;
  isRequired: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: string | null;
  defaultValue?: string | null;
  helpText?: string | null;
  validationMessage?: string | null;
  displayOrder: number;
  options?: FormFieldOption[] | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  festivalId?: string | null;
  eventId?: string | null;
}

export interface FormFieldListItem {
  id: string;
  fieldName: string;
  label: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface FormVersion {
  id: string;
  eventId: string;
  version: number;
  status: FormStatus;
  fieldsJson: FormFieldConfig[];
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormVersionListItem {
  id: string;
  version: number;
  status: FormStatus;
  publishedAt?: Date | null;
  createdAt: Date;
  _count?: {
    responses: number;
  };
}

export interface FormResponse {
  id: string;
  registrationId?: string | null;
  eventId?: string | null;
  formFieldId: string;
  responseValue: string;
  version: number;
  submittedAt: Date;
  createdAt: Date;
}

export interface FormResponseWithField extends FormResponse {
  formField: {
    id: string;
    label: string;
    fieldType: FormFieldType;
    fieldName: string;
  };
}

export interface FormSubmission {
  id: string;
  eventId: string;
  responses: FormResponseWithField[];
  submittedAt: Date;
}

export interface CreateFormFieldInput {
  fieldName: string;
  label: string;
  fieldType: FormFieldType;
  description?: string;
  placeholder?: string;
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  defaultValue?: string;
  helpText?: string;
  validationMessage?: string;
  displayOrder?: number;
  options?: FormFieldOption[];
}

export interface UpdateFormFieldInput {
  fieldName?: string;
  label?: string;
  fieldType?: FormFieldType;
  description?: string;
  placeholder?: string;
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  defaultValue?: string;
  helpText?: string;
  validationMessage?: string;
  displayOrder?: number;
  options?: FormFieldOption[];
  isActive?: boolean;
}

export interface ReorderFieldsInput {
  fieldOrders: { id: string; displayOrder: number }[];
}

export interface SaveFormVersionInput {
  eventId: string;
  fields: CreateFormFieldInput[];
}

export interface SubmitFormResponseInput {
  eventId: string;
  responses: { fieldName: string; value: string }[];
}

export interface FormResponseFilters {
  eventId?: string;
  formFieldId?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface PaginatedFormResponses {
  responses: FormResponse[];
  submissions: FormSubmission[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface FormStats {
  totalFields: number;
  activeFields: number;
  totalResponses: number;
  totalSubmissions: number;
  publishedVersions: number;
}

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  SHORT_TEXT: "Short Text",
  LONG_TEXT: "Long Text",
  EMAIL: "Email",
  NUMBER: "Number",
  PHONE: "Phone",
  DISCORD_USERNAME: "Discord Username",
  DISCORD_USER_ID: "Discord User ID",
  GAME_UID: "Game UID",
  IGN: "IGN",
  SELECT: "Select",
  MULTI_SELECT: "Multi Select",
  CHECKBOX: "Checkbox",
  RADIO: "Radio",
  DATE: "Date",
  TIME: "Time",
  COUNTRY: "Country",
  FILE_UPLOAD: "File Upload",
  URL: "URL",
  SECTION_HEADER: "Section Header",
  DIVIDER: "Divider",
  PARAGRAPH: "Paragraph",
};

export const FORM_FIELD_TYPE_ICONS: Record<FormFieldType, string> = {
  SHORT_TEXT: "Type",
  LONG_TEXT: "AlignLeft",
  EMAIL: "Mail",
  NUMBER: "Hash",
  PHONE: "Phone",
  DISCORD_USERNAME: "MessageSquare",
  DISCORD_USER_ID: "Hash",
  GAME_UID: "Gamepad2",
  IGN: "User",
  SELECT: "ChevronDown",
  MULTI_SELECT: "CheckSquare",
  CHECKBOX: "Check",
  RADIO: "Circle",
  DATE: "Calendar",
  TIME: "Clock",
  COUNTRY: "Globe",
  FILE_UPLOAD: "Upload",
  URL: "Link",
  SECTION_HEADER: "Heading",
  DIVIDER: "Minus",
  PARAGRAPH: "FileText",
};

export const INPUT_FIELD_TYPES: FormFieldType[] = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "EMAIL",
  "NUMBER",
  "PHONE",
  "DISCORD_USERNAME",
  "DISCORD_USER_ID",
  "GAME_UID",
  "IGN",
  "URL",
];

export const CHOICE_FIELD_TYPES: FormFieldType[] = [
  "SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
  "RADIO",
];

export const LAYOUT_FIELD_TYPES: FormFieldType[] = [
  "SECTION_HEADER",
  "DIVIDER",
  "PARAGRAPH",
];

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const FORM_STATUS_COLORS: Record<FormStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  ARCHIVED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

export const DEFAULT_COUNTRY_OPTIONS: FormFieldOption[] = [
  { label: "India", value: "IN" },
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "GB" },
  { label: "Canada", value: "CA" },
  { label: "Australia", value: "AU" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Japan", value: "JP" },
  { label: "South Korea", value: "KR" },
  { label: "Brazil", value: "BR" },
];
