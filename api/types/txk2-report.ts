import { InspectionType } from "./inspection";

/**
 * `next_inspection_type` is the follow-up inspection: an InspectionType
 * object, a plain type-name string, or an empty string / null when there is
 * none.
 */
export type NextInspectionType = InspectionType | string | null;

export interface Txk2ReportRow {
  locomotive: string;
  branch: string;
  inspection_type: string;
  entry_time: string | null;
  fixed_maneuver_time: number | null;
  kanava_entry_time: string | null;
  standard_duration: number | null;
  technical_service_hours: number | null;
  kanava_exit_time: string | null;
  total_time_hours: number | null;
  time_except_inspection: number | null;
  next_inspection_type: NextInspectionType;
  next_entry_time: string | null;
  next_exit_time: string | null;
  delay_reason_code: string | null;
  delay_reason_details: string | null;
}

export interface Txk2ReportResponse {
  count: number;
  organization_id: number;
  organization_name: string;
  date_from: string;
  date_to: string;
  data: Txk2ReportRow[];
}

export interface Txk2ReportParams {
  organization_id?: number | null;
  date_from?: string;
  date_to?: string;
}
