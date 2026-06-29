// Journal statistics types (MPR, Revision, Pantograph)
// See statistics_api_documentation for the source contract.

export const STAT_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type StatMonth = (typeof STAT_MONTHS)[number];

export interface JournalStatisticsParams {
  locomotive?: number;
  locomotive_id?: number;
  inspection_type?: number; // revision only
}

// --- MPR ---
export interface MprMonthStat {
  mpr: number;
  invalid: number;
  defect: number;
  damage_amount: number;
}

export interface MprOrgStatistics {
  organization_id: number;
  organization_name: string;
  months: Record<StatMonth, MprMonthStat>;
  total_mpr: number;
  total_invalid: number;
  total_defect: number;
  total_damage_amount: number;
  damage_amount: number;
}

// --- Revision ---
export interface RevisionMonthStat {
  table_number_null: number;
  table_number_not_null: number;
}

export interface RevisionOrgStatistics {
  organization_id: number;
  organization_name: string;
  months: Record<StatMonth, RevisionMonthStat>;
  total_table_number_null: number;
  total_table_number_not_null: number;
}

// --- Pantograph ---
export interface PantographMonthStat {
  damage: number;
}

export interface PantographOrgStatistics {
  organization_id: number;
  organization_name: string;
  months: Record<StatMonth, PantographMonthStat>;
  total_damage: number;
  damage: number;
}

// Generic shape the statistics panel consumes.
export interface GenericOrgStatistics {
  organization_id: number;
  organization_name: string;
  months: Record<string, Record<string, number>>;
  [total: string]: unknown;
}
