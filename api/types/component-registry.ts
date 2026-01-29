export interface ComponentRegistryEntry {
  id: number;
  organization: string;
  inspection: string;
  locomotive: string;
  component: string;
  loc_model_name: string;
  section?: string;
  reason: string;
  created_time: string;
  defect_date: string;
  removed_manufacture_year: string;
  installed_manufacture_year: string;
  installed_manufacture_factory: string;
  removed_manufacture_factory: string;
}

export interface ComponentRegistryParams {
  page?: number;
  page_size?: number;
  search?: string;
  organization?: number;
  no_page?: boolean;
}

export interface CreateComponentRegistryPayload {
  organization_id: number;
  locomotive_id: number;
  section_id: number;
  component_id: number;
  inspection_id: number;
  reason: string;
  defect_date: string;
  removed_manufacture_year: string;
  installed_manufacture_year: string;
  installed_manufacture_factory: string;
  removed_manufacture_factory: string;
}
