export interface LocomotiveMileageBaseline {
  id: number;
  locomotive: number;
  locomotive_name: string;
  inspection_type: number;
  inspection_type_name: string;
  baseline_date: string;
  baseline_km: number;
}

export interface LocomotiveMileageBaselineListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LocomotiveMileageBaseline[];
}

export interface LocomotiveMileageBaselinePayload {
  locomotive: number;
  inspection_type: number;
  baseline_date: string;
  baseline_km: number;
}

export interface LocomotiveMileageBaselineParams {
  locomotive?: number;
  inspection_type?: number;
}
