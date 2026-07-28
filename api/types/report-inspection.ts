import { InspectionType } from "./inspection";

/**
 * The inspection shape the report exporters consume. It is the same
 * `/inspections/` resource as `./inspections`, but the reports read a richer
 * projection of it (delay reasons, sign-off trail, section as a code rather
 * than a free string).
 *
 * Nested objects are inlined rather than imported from this project's
 * locomotive/organization/user types: only a handful of fields are read, and
 * declaring them here keeps the reports independent of shapes that are shaped
 * around other screens.
 */

export type InspectionStatus = "ok" | "warning" | "critical";

export type DelayReason =
  | "ADDITIONAL_WORKS_FOUND"
  | "SPARE_PARTS_SHORTAGE"
  | "LABOR_SHORTAGE"
  | "OTHER";

export type InspectionSection = "A" | "B" | "V" | "Cabin 1" | "Cabin 2";

export interface ReportUserRef {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface ReportBranchRef {
  id: number;
  name: string;
  organization?: { id: number; name: string };
}

export interface ReportLocationRef {
  id: number;
  name: string;
}

export interface ReportLocomotiveRef {
  id: number;
  name: string;
  locomotive_model?: { id: number; name: string } | null;
  location?: ReportLocationRef | null;
}

export interface InspectionResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Inspection[];
}

export interface InspectionAcceptance {
  id: number;
  factory_id: number;
  factory_name: string;
  accepted_by_name: string;
  accepted_at: string;
}

export interface Inspection {
  id: number;
  locomotive: ReportLocomotiveRef;
  external_locomotive?: string;
  author: ReportUserRef;
  inspection_type: InspectionType;
  branch: ReportBranchRef;
  is_closed: boolean;
  is_closed_time: string;
  comment: string;
  created_time: string;
  entry_time: string;
  kanava_entry_time?: string | null;
  last_updated_time: string;
  is_cancelled: boolean;
  is_cancelled_time: string;
  section: InspectionSection;
  inspection_start_mileage?: number;
  mileage_interval?: number | null;
  hour_interval?: number | null;
  inspection_remaining_time?: number | null;
  duration?: number | null;
  /** Extra maneuver (shunting) time allowance in minutes, added to `duration`. */
  maneuver_time?: number | null;
  delay_reason_code?: DelayReason | null;
  delay_reason_details?: string | null;
  payroll_signed_at?: string | null;
  payroll_signed_by?: ReportUserRef | null;
  repair_staff_signed_at?: string | null;
  repair_staff_signed_by?: ReportUserRef | null;
  rb_signed_at?: string | null;
  rb_signed_by: ReportUserRef | null;
  repair_engineer_signed_at?: string | null;
  repair_engineer_signed_by?: ReportUserRef | string | null;
  reports?: InspectionAcceptance[];
}
