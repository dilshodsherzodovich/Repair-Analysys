import { Organization } from "./organizations";
import { UserData } from "./user";

export interface QuarterlyDeadline {
  quarter: number;
  month: number;
  day: number;
}

export interface BulletinDeadline {
  id?: number;
  period_type: string;
  day_of_week: number | null;
  day_of_month: number | null;
  quarterly_deadlines: QuarterlyDeadline[] | null;
  year_interval?: number | null;
  current_deadline: string | null;
}

export interface BulletinColumn {
  id: string;
  name: string;
  type: "number" | "text" | "date" | "classificator";
  journal?: string;
  order: number;
  classificator?: string | null;
  classificatorId?: string;
  classificatorName?: string;
}

export interface Bulletin {
  id: string;
  name: string;
  created: string;
  updated: string;
  description: string;
  deadline: BulletinDeadline;
  columns: BulletinColumn[];
  main_organizations_list: Pick<
    Organization,
    "id" | "name" | "secondary_organizations"
  >[];
  employees_list: Pick<UserData, "id" | "first_name" | "last_name">[];
  user_info: {
    id: string;
    username: string;
    full_name: string;
  };
  rows: BulletinRow[];
  upload_history: BulletinFile[];
  type_of_journal_display?: string;
}

export interface BulletinCreateBody {
  name: string;
  description: string;
  deadline: BulletinDeadline;
  columns: BulletinColumn[];
  organizations: string[];
  main_organizations: string[];
  responsible_employees: string[];
  type_of_journal_display?: string;
}

// Updated to match the actual bulletinDetail API response
export interface BulletinRow {
  id: string;
  order: number;
  values: Record<string, string | number | Date>;
}

// For individual cell data (used in create requests)
export interface BulletinRowCell {
  column: string;
  value: string | number | Date;
}

export interface BulletinCreateRow {
  journal: string;
  values: BulletinRowCell[];
}

export interface BulletinFileStatus {
  id: string;
  status_display: "Actual" | "Not Actual";
  created: string;
  description: string;
  upload_file: string;
  upload_file_name: string;
}

export interface BulletinFile {
  id: string;
  status: "on_time" | "late" | "not_submitted";
  created: string;
  deadline: string;
  editable: boolean;
  uploaded_files: BulletinFileStatus[];

  user_info: {
    id: string;
    username: string;
    full_name: string;
  };
}

export interface BulletinFileUpdateRequest {
  editable: boolean;
  journal?: string;
  upload_file?: File;
}

export interface BulletinFileStatusHistoryCreateRequest {
  j_upload_history_id: string;
  upload_file: File;
  description: string;
}
