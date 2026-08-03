export interface LocomotiveData {
  id: number;
  name: string;
  model_name: string;
}

export interface LocomotiveInfo {
  id: number;
  name: string;
  locomotive_model: string;
}

export interface SpecialComponentSection {
  id: number;
  name: string;
}

export type SpecialComponent = {
  id: number;
  year_of_manufacture: string;
  factory_number: string;
  section?: SpecialComponentSection | null;
} & Record<string, string | number | SpecialComponentSection | null | undefined>;

export interface SortedLocomotiveData {
  id: number;
  name: string;
  model_name: string;
  model_id: string;
  sections: { id: number; name: string }[];
  special_components: SpecialComponent[];
}

export interface LokomotiveDataGetParams {
  no_page?: boolean;
  locomotive_model?: number;
  search?: string;
  organization?: number;
  registered_organization?: number;
}

export interface LocomotiveModelData {
  id: number;
  code: number;
  locomotive_type: string;
  image: string;
  name: string;
}

export interface LocomotiveModelGetParams {
  page?: number;
  no_page?: boolean;
}

export interface OrganizationRef {
  id: number;
  name: string;
  name_uz: string;
  name_ru: string;
  code: number;
}

export interface LocalizedRef {
  id: number;
  name: string;
  name_uz: string;
  name_ru: string;
}

// Canonical locomotive metadata from `/locomotives/{id}/` — state, service/
// locomotive type, GPS IMEI, on-assignment flag, etc.
export interface LocomotiveFullDetail {
  id: number;
  name: string;
  locomotive_model: {
    id: number;
    name: string;
    image?: string | null;
    code: number;
    locomotive_type: string;
    razvarot_interval_hour: number;
    razvarot_interval_mileage: number;
    locomotive_sections: { id: number; name: string; order: number }[];
  };
  operating_organization?: OrganizationRef | null;
  registered_organization?: OrganizationRef | null;
  location_category?: LocalizedRef | null;
  location?: LocalizedRef | null;
  state: string;
  is_active: boolean;
  is_rented: boolean;
  on_assignment: boolean;
  manufacture_date: string | null;
  mileage: number;
  gps_imei_code: string;
  gps_status: string;
  gps_status_detail?: string;
  data_recorder_type: string;
  service_type: string;
  instructor?: string;
  current_inspection_type?: string | null;
}
