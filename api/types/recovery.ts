import { DelayEntry } from "./delays";
import { Culprit, RecoveryStatus } from "./culprits";

// A Delay enriched with recovery/agreement fields for the изъятие flow
export interface RecoveryDelay extends DelayEntry {
  recovery_status: RecoveryStatus;
  recovery_status_display?: string;
  culprits: Culprit[];
  culprits_total_amount: number;
  culprits_recovered_amount: number;
}

export interface RecoveryListParams {
  page?: number;
  page_size?: number;
  recovery_status?: RecoveryStatus | string;
  from_date?: string;
  end_date?: string;
  incident_date?: string;
  delay_type?: string;
  group_reason?: string;
  train_type?: string;
  train_number?: string;
  station?: string;
  responsible_org?: number | string;
  search?: string;
  ordering?: string;
}

// Step 1 — payroll (ОТЗ) confirmation. culprit_ids optional → applies to all.
export interface PayrollConfirmPayload {
  culprit_ids?: number[];
  confirmed: boolean;
}

// Step 2 — accountant recovery mark. culprit_ids optional → applies to all.
export interface RecoverPayload {
  culprit_ids?: number[];
  recovered: boolean;
}
