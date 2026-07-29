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
 * One grid cell. The plan endpoint returns a bare number; the fact endpoint
 * returns `{ count, inspections }` — the count plus the inspections behind it.
 * Always read it through `cellCount()`.
 */
export type PlanCell = number | { count: number; inspections?: unknown[] };

/** Number behind a report cell, whichever shape the endpoint returned. */
export function cellCount(cell: PlanCell | null | undefined): number {
  if (typeof cell === "number") return cell;
  if (cell && typeof cell === "object") return Number(cell.count) || 0;
  return 0;
}

export interface AnnualPlanReportRow {
  locomotive_model: LocomotiveModelRef;
  /** keys "1".."12" */
  months: Record<string, PlanCell>;
  /** keys "1".."4" (Q1 = Jan–Mar, …) */
  quarters: Record<string, PlanCell>;
  yearly_count: PlanCell;
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
