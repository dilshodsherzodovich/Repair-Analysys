export interface BaselineData {
  id: number;
  baseline_date: string;
  baseline_km: number;
}

export interface LocomotiveMileageBaselineItem {
  inspection_type_id: number;
  inspection_type_name: string;
  last_inspection_date: string | null;
  baseline: BaselineData | null;
}

export interface LocomotiveMileageBaselinePayload {
  locomotive: number;
  inspection_type: number;
  last_inspection_date: string | null;
  baseline_date: string;
  baseline_km: number;
}
