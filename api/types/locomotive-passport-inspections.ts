export interface LocomotivePassportInspection {
  id: number;
  locomotive_id: number;
  locomotive_name: string;
  locomotive_model: string | null;
  section_id: number;
  section_name: string;
  run_km: number;
  buksa_bearing_date: string | null;
  buksa_bearing_km: number | null;
  ted_bearing_date: string | null;
  ted_bearing_km: number | null;
  compressor_oil_date: string | null;
  compressor_oil_km: number | null;
  air_filter_date: string | null;
  air_filter_km: number | null;
  oil_filter_date: string | null;
  oil_filter_km: number | null;
  lubrication_date: string | null;
  lubrication_km: number | null;
  kozh_oil_date: string | null;
  kozh_oil_km: number | null;
  brake_rti_date: string | null;
  brake_rti_km?: number | null;
}

export interface LocomotivePassportInspectionParams {
  page?: number;
  page_size?: number;
  search?: string;
  locomotive?: number;
  section?: number;
  organization?: number;
  no_page?: boolean;
}

export interface CreateLocomotivePassportInspectionPayload {
  locomotive_id: number;
  section_id: number;
  run_km: number;
  buksa_bearing_date?: string | null;
  buksa_bearing_km?: number | null;
  ted_bearing_date?: string | null;
  ted_bearing_km?: number | null;
  compressor_oil_date?: string | null;
  compressor_oil_km?: number | null;
  air_filter_date?: string | null;
  air_filter_km?: number | null;
  oil_filter_date?: string | null;
  oil_filter_km?: number | null;
  lubrication_date?: string | null;
  lubrication_km?: number | null;
  kozh_oil_date?: string | null;
  kozh_oil_km?: number | null;
  brake_rti_date?: string | null;
  brake_rti_km?: number | null;
}

export type UpdateLocomotivePassportInspectionPayload = Partial<CreateLocomotivePassportInspectionPayload>;
