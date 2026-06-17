import { DelayType } from "./delays";

export type RecoveryStatus =
  | "pending"
  | "payroll_confirmed"
  | "accountant_confirmed";

export const RECOVERY_STATUS_VALUES: RecoveryStatus[] = [
  "pending",
  "payroll_confirmed",
  "accountant_confirmed",
];

// Причастный к срыву — person + amount to recover, attached to a Delay
export interface Culprit {
  id: number;
  delay: number;
  full_name: string;
  amount: string; // decimal as string, e.g. "1500.00"
  payroll_confirmed: boolean;
  payroll_confirmed_by_name: string | null;
  payroll_confirmed_at: string | null;
  recovered: boolean;
  recovered_by_name: string | null;
  recovered_at: string | null;
  created_at: string;

  // Extra delay fields included on GET list/retrieve (read-only)
  train_number?: string;
  station?: string;
  incident_date?: string;
  delay_type?: DelayType;
  responsible_org?: number;
  responsible_org_name?: string;
  recovery_status?: RecoveryStatus;
  recovery_status_display?: string;
}

export interface CulpritCreatePayload {
  delay: number;
  full_name: string;
  amount: string;
}

export interface CulpritUpdatePayload {
  full_name?: string;
  amount?: string;
}

export interface CulpritListParams {
  page?: number;
  page_size?: number;
  delay?: number | string;
  organization?: number | string;
  from_date?: string;
  end_date?: string;
  full_name?: string;
  payroll_confirmed?: boolean;
  recovered?: boolean;
  search?: string;
  ordering?: string;
}
