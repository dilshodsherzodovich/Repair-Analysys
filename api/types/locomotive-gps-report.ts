/** One locomotive row inside a model group. */
export interface GpsReportLocomotive {
  id: number;
  name: string;
  integration_name: string;
  service_type: string;
  locomotive_type: string;
  has_gps: boolean;
  gps_imei_code: string;
  /** "valid" | "invalid" | "" (empty when the locomotive has no GPS at all) */
  gps_status: string;
  gps_status_detail: string;
}

/** Locomotives grouped by model, with per-model GPS totals. */
export interface GpsReportModel {
  model_id: number;
  model_name: string;
  model_code: number;
  locomotive_type: string;
  total_locomotives: number;
  with_gps: number;
  without_gps: number;
  valid_count: number;
  invalid_count: number;
  locomotives: GpsReportLocomotive[];
}

/** Top-level grouping is per organization, with org-wide GPS totals. */
export interface GpsReportOrganization {
  organization_id: number;
  organization_name: string;
  total_locomotives: number;
  with_gps: number;
  without_gps: number;
  valid_count: number;
  invalid_count: number;
  locomotive_models: GpsReportModel[];
}

export interface LocomotiveGpsReportResponse {
  status: number;
  data: GpsReportOrganization[];
}

export interface LocomotiveGpsReportParams {
  /** Only supply for non-admin users. Admins omit it to receive every org. */
  organization?: number;
  locomotive_model?: string;
  service_type?: string;
  locomotive_type?: string;
}
