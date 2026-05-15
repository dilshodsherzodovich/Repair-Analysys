export interface Txk13Inspection {
  type_id: number;
  type: string;
  last_date: string;
  mileage_since_repair: number;
  norm: number;
  difference: number;
  next_repair_date: string;
}

export interface Txk13Locomotive {
  index: number;
  series: string;
  number: string;
  depo: string;
  manufactured_date: string;
  bandaj_thickness: number | null;
  total_mileage: number;
  average_monthly_mileage: number;
  inspections: Txk13Inspection[];
}

export interface Txk13Organization {
  organization_name: string;
  locomotives: Txk13Locomotive[];
}

export interface Txk13ReportResponse {
  status: number;
  data: Txk13Organization[];
}

export interface Txk13ReportParams {
  organization: number;
}
