/**
 * Locomotives that were taken into inspection *late*, over a date range, with
 * the exact inspections where the delay happened.
 *
 * Distinct from the two neighbouring reports, and easy to confuse with them:
 *  - `delayed-locomotives-report`      → overdue to enter *right now* (a snapshot)
 *  - `delayed-repair-duration-report`  → the repair itself ran past its norm
 *
 * This one is about *entering* late, historically.
 */

/** Which dimension the delay was measured on. */
export type DelayDimension = "hour" | "mileage" | "both";

export type DelayedInspectionsDateField = "created" | "closed";

export type DelayedInspectionsDelayType = "any" | "hour" | "mileage" | "both";

/**
 * One dimension (hours or mileage) of a single inspection.
 *
 * `interval === null` means the dimension is not tracked for that locomotive
 * model + inspection type pair — it can never cause a delay, so always
 * null-check before rendering rather than treating it as 0.
 */
export interface DelayedInspectionMetric {
  /** Hours elapsed / km run since the previous inspection of the same type. */
  actual: number | null;
  interval: number | null;
  /** `actual - interval`. Anything above 0 is a delay; there is no tolerance. */
  overrun: number | null;
  overrun_percent: number | null;
  is_delayed: boolean;
}

export interface DelayedInspectionRow {
  inspection_id: number;
  inspection_type_id: number;
  inspection_type_name: string;
  branch_id: number;
  branch_name: string;
  organization_id: number;
  organization_name: string;
  /**
   * Pre-formatted local time, "YYYY-MM-DD HH:MM" — not ISO. Display as-is;
   * re-parsing it as UTC shifts the clock.
   */
  created_time: string;
  kanava_entry_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  delay_type: DelayDimension;
  hours: DelayedInspectionMetric;
  mileage: DelayedInspectionMetric;
  delay_reason_code: string | null;
  delay_reason_details: string;
}

export interface DelayedInspectionsLocomotive {
  locomotive_id: number;
  locomotive_name: string;
  locomotive_model_id: number;
  locomotive_model_name: string;
  operating_organization_id: number;
  operating_organization_name: string;
  delayed_inspections_count: number;
  /** Ordered by `created_time` ascending. */
  inspections: DelayedInspectionRow[];
}

/**
 * Counts over the *filtered* result set. With `delay_type=hour` the mileage
 * count is still non-zero — those are the rows delayed on both dimensions, which
 * are counted in `hour_delayed_count` and `mileage_delayed_count` alike.
 */
export interface DelayedInspectionsSummary {
  /** Equals `data.length`. */
  delayed_locomotives_count: number;
  delayed_inspections_count: number;
  hour_delayed_count: number;
  mileage_delayed_count: number;
  both_delayed_count: number;
}

export interface DelayedInspectionsReportResponse {
  status: number;
  from_date: string;
  to_date: string;
  date_field: string;
  delay_type: string;
  summary: DelayedInspectionsSummary;
  /** Sorted by `locomotive_name`. */
  data: DelayedInspectionsLocomotive[];
}

export interface DelayedInspectionsReportParams {
  /** YYYY-MM-DD, inclusive. Required by the endpoint. */
  fromDate: string;
  toDate: string;
  /** `created` = when the inspection was opened (default), `closed` = closed. */
  date_field?: DelayedInspectionsDateField;
  delay_type?: DelayedInspectionsDelayType;
  organization?: number;
  branch?: number;
  locomotive?: number;
  locomotive_model?: number;
  inspection_type?: number;
  /** true = closed only, false = still-open only, undefined = both. */
  is_closed?: boolean;
}
