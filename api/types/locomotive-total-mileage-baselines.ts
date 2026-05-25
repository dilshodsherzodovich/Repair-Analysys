export interface TotalMileageBaseline {
  id: number;
  locomotive: number;
  locomotive_name: string;
  baseline_date: string;
  baseline_km: number;
  last_updated_at: string;
  last_mileage: number;
}

export interface TotalMileageBaselineResponse {
  locomotive: number;
  locomotive_name: string;
  baseline: TotalMileageBaseline | null;
}

export interface TotalMileageBaselineCreatePayload {
  locomotive: number;
  baseline_date: string;
  baseline_km: number;
}

export interface TotalMileageBaselinePatchPayload {
  baseline_date: string;
  baseline_km: number;
}
