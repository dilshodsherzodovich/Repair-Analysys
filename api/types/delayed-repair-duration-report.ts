export interface DelayedRepairDurationRow {
  id: number;
  locomotive_id: number;
  locomotive_name: string;
  locomotive_model_id: number;
  locomotive_model_name: string;
  branch_id: number;
  branch_name: string;
  organization_id: number;
  organization_name: string;
  inspection_type_id: number;
  inspection_type_name: string;
  entry_time: string | null;
  kanava_entry_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  interval_hours: number | null;
  delayed_hours: number | null;
  delay_reason_code: string | null;
  delay_reason_details: string | null;
}

export interface DelayedRepairDurationResponse {
  count: number;
  from_date: string;
  to_date: string;
  data: DelayedRepairDurationRow[];
}

export interface DelayedRepairDurationParams {
  fromDate?: string;
  toDate?: string;
  organization?: number;
  branch?: number;
  inspection_type?: number;
  /** undefined → all, true → closed only, false → open only */
  is_closed?: boolean;
}
