export interface LogUserInfo {
  id: string;
  username: string;
  full_name: string;
}

export type LogAction =
  | "get"
  | "post"
  | "update"
  | "delete"
  | "login"
  | "logout";

export type ContentType =
  | "CustomUser"
  | "Classificator"
  | "Element"
  | "Organization"
  | "SecondaryOrganization"
  | "Journal"
  | "Column"
  | "RowValue"
  | "UploadedFile"
  | "JournalUploadHistory"
  | "Profile";

export type ContentTypeVerbose =
  | "Foydalanuvchi"
  | "Classificator"
  | "Element"
  | "Tashkilot"
  | "Quyi tashkilot"
  | "Bulleten"
  | "Ustun"
  | "Qator qiymati"
  | "Fayl"
  | "Bulleten tarihi"
  | "Profile";

export interface LogItem {
  id?: string;
  action: string; // backend may return human text like "Login"
  user: string;
  content_type: number | string;
  content_type_verbose?: ContentTypeVerbose;
  object_id?: string | number;
  created: string; // ISO date string
  description?: string;
  extra_data?: unknown;
  user_info?: LogUserInfo;
}

export interface LogsGetParams {
  page?: number;
  action?: string;
  content_type?: string;
  user?: string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  search?: string;
  no_page?: boolean;
}
