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
 * One grid cell. Cells may arrive as a bare number, or as an object carrying
 * the count plus extras: `id` (the plan row, so the edit grid can PATCH/DELETE
 * it) and `inspections` (what the fact endpoint counted). Always read them
 * through `cellCount()` / `cellId()`.
 */
export type PlanCell =
  | number
  | {
      id?: number | null;
      plan_id?: number | null;
      count: number;
      inspections?: unknown[];
    };

/** Number behind a report cell, whichever shape the endpoint returned. */
export function cellCount(cell: PlanCell | null | undefined): number {
  if (typeof cell === "number") return cell;
  if (cell && typeof cell === "object") return Number(cell.count) || 0;
  return 0;
}

/** Plan row id behind a report cell, or null when the cell is just a number. */
export function cellId(cell: PlanCell | null | undefined): number | null {
  if (cell && typeof cell === "object") {
    const raw = cell.id ?? cell.plan_id;
    return typeof raw === "number" ? raw : null;
  }
  return null;
}

/** One report cell flattened for the edit grid: a (type, model, month) count. */
export interface AnnualPlanEditRow {
  id: number | null;
  month: number;
  inspection_type: number;
  locomotive_model: number;
  count: number;
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
