/**
 * Shapes for the reports dashboard — locomotives grouped by operational
 * category, by inspection type, by delay, and by reserve status.
 */

/** Every category maps organization name → locomotive names. */
export interface CategorizedLocomotivesResponse {
  active_locomotives: Record<string, string[]>;
  switcher_electric_locomotives: Record<string, string[]>;
  maintenance_locomotives: Record<string, string[]>;
  rented_locomotives: Record<string, string[]>;
}

export type LocomotiveCategory =
  | "active_locomotives"
  | "switcher_electric_locomotives"
  | "maintenance_locomotives"
  | "rented_locomotives";

export interface InspectionTypeLocomotive {
  id: number;
  name: string;
  inspection_started_time: string;
  inspection_closed_time: string;
}

export interface InspectionTypeGroup {
  name: string;
  locomotives: InspectionTypeLocomotive[];
}

export interface InspectionTypeLocomotivesResponse {
  electric_loco: InspectionTypeGroup[];
  diesel_loco: InspectionTypeGroup[];
}

export interface DelayedLocomotive {
  id: number;
  name: string;
  hour: number;
  mileage: number;
}

export interface DelayedInspectionType {
  name: string;
  locomotives: DelayedLocomotive[];
}

export interface DelayedLocomotivesResponse {
  name: string;
  inspection_types: DelayedInspectionType[];
}

export interface ReservedLocomotive {
  loco_id: number;
  loco_name: string;
  reserve_started_time: string;
  reserve_closed_time: string | null;
}

/** Keyed by organization name. */
export interface ReservedLocomotivesResponse {
  [organizationName: string]: ReservedLocomotive[];
}

/** Shared query window used by every reports endpoint. */
export interface ReportDateRangeParams {
  organization?: number;
  fromDate?: string;
  toDate?: string;
}
