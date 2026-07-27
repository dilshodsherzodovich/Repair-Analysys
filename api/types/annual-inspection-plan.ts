export interface OrganizationRef {
  id: number;
  name: string;
}

export interface InspectionTypeRef {
  id: number;
  name: string;
  name_uz?: string;
  name_ru?: string;
  is_interval?: boolean;
}

export interface LocomotiveModelRef {
  id: number;
  name: string;
}

/** A single plan cell: (year, month, org, inspection type, model) → count. */
export interface AnnualInspectionPlan {
  id: number;
  year: number;
  month: number;
  organization: number;
  organization_detail: OrganizationRef;
  inspection_type: number;
  inspection_type_detail: InspectionTypeRef;
  locomotive_model: number;
  locomotive_model_detail: LocomotiveModelRef;
  count: number;
}

/** Payload for POST/PUT/PATCH — ids only, `*_detail` fields are read-only. */
export interface AnnualInspectionPlanWrite {
  year: number;
  month: number;
  organization: number;
  inspection_type: number;
  locomotive_model: number;
  count: number;
}

// ── Report ("grafik raboti" grid) shapes ──────────────────────────────────

/**
 * One performed inspection listed inside a `fact` cell. The backend decides
 * which fields it sends, so everything is optional and the UI renders whatever
 * is actually present (see `inspectionFields` in plan-grid-shared).
 */
export interface AnnualPlanFactInspection {
  id?: number;
  [key: string]: unknown;
}

/**
 * A month/quarter cell. The `report` (plan) endpoint returns a bare number;
 * the `fact` endpoint returns `{ count, inspections }`. Read it through
 * `cellCount` / `cellInspections` rather than touching it directly.
 */
export type AnnualPlanCell =
  | number
  | { count: number; inspections?: AnnualPlanFactInspection[] };

export interface AnnualPlanReportRow {
  locomotive_model: LocomotiveModelRef;
  /** keys "1".."12" */
  months: Record<string, AnnualPlanCell>;
  /** keys "1".."4" (Q1 = Jan–Mar, …) */
  quarters: Record<string, AnnualPlanCell>;
  yearly_count: number;
}

export interface AnnualPlanReportType {
  inspection_type: InspectionTypeRef;
  locomotive_models: AnnualPlanReportRow[];
}

export interface AnnualPlanReportOrganization {
  organization: OrganizationRef;
  inspection_types: AnnualPlanReportType[];
}

export interface AnnualPlanReport {
  year: number;
  organizations: AnnualPlanReportOrganization[];
}
