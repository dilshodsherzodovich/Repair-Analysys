import { ReportLocomotiveRef, ReportUserRef } from "./report-inspection";

export type LogAction =
  | "opened"
  | "closed"
  | "location_changed"
  | "inspection_opened"
  | "inspection_closed"
  | "assignment_started"
  | "assignment_ended"
  | "rental_started"
  | "rental_ended"
  | "reserve_started"
  | "reserve_ended";

export interface LogEntry {
  id: number;
  author: ReportUserRef;
  locomotive: ReportLocomotiveRef;
  action: LogAction;
  message: string;
  created_time: string;
}

export interface LogEntriesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LogEntry[];
}

export interface LogEntriesParams {
  author?: number;
  locomotive?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  ordering?: string;
  no_page?: boolean;
  organization?: number;
}
