import { Organization } from "./organizations";

export type DelayType = "Po prosledovaniyu" | "Po otpravleniyu";

// Station names - can be extended as needed
export type Station = string;

// Delay type options for select dropdowns
export const DELAY_TYPE_OPTIONS: Array<{ value: DelayType; label: string }> = [
  { value: "Po prosledovaniyu", label: "Po prosledovaniyu" },
  { value: "Po otpravleniyu", label: "Po otpravleniyu" },
];

// Station options - can be extended with more stations
export const STATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "Tashkent", label: "Tashkent" },
  { value: "Sariosiyo", label: "Sariosiyo" },
  // Add more stations as needed
];

export interface ResponsibleOrgDetail {
  id: number;
  name: string;
  organization: Organization;
}

export interface DelayEntry {
  id: number;
  delay_type: DelayType;
  train_number: string;
  station: string;
  delay_time: string; // ISO time string
  reason: string;
  damage_amount: number;
  responsible_org: number;
  responsible_org_detail?: ResponsibleOrgDetail;
  responsible_org_name?: string;
  report?: string;
  report_filename?: string;
  incident_date: string; // YYYY-MM-DD
  status: boolean;
  status_display?: string;
  created_at?: string; // ISO datetime string
}

export interface DelayCreatePayload {
  delay_type: DelayType;
  train_number: string;
  station: string;
  delay_time: string; // Format: "HH:mm" or "H:m" or ISO time string
  reason: string;
  damage_amount: number;
  responsible_org: number;
  report?: File | null;
  incident_date: string; // YYYY-MM-DD
  status: boolean;
}

export interface DelayUpdatePayload {
  delay_type?: DelayType;
  train_number?: string;
  station?: string;
  delay_time?: string;
  reason?: string;
  damage_amount?: number;
  responsible_org?: number;
  report?: File | null;
  incident_date?: string;
  status?: boolean;
}

export interface DelayListParams {
  page?: number;
  page_size?: number;
  search?: string;
  delay_type?: DelayType;
  station?: string;
  responsible_org?: number | string;
  status?: boolean;
  incident_date?: string; // YYYY-MM-DD format
}
