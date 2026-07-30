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
  staff?: string;
  // IDs returned by API for pre-populating edit form
  locomotive_id?: number;
  section_id?: number;
  component_id?: number;
  inspection_id?: number;
  organization_id?: number;
}

export interface ComponentRegistryParams {
  page?: number;
  page_size?: number;
  search?: string;
  organization?: number;
  locomotive_id?: number;
  no_page?: boolean;
  defect_date_start?: string;
  defect_date_end?: string;
}

/** A component group ("Механическое оборудование" and friends). */
export interface ComponentGroup {
  id: number;
  name: string;
}

export interface ComponentGroupParams {
  page?: number;
  page_size?: number;
  search?: string;
}

/** One defect row as returned by `/component-registry/by-group-details/`. */
export interface ComponentGroupRegistry {
  id: number;
  defect_date: string;
  locomotive_id: number;
  locomotive: string;
  locomotive_model: string;
  section_id: number;
  section: string;
  reason: string;
  staff: string;
  removed_manufacture_year: string;
  installed_manufacture_year: string;
  installed_manufacture_factory: string;
  removed_manufacture_factory: string;
}

export interface ComponentGroupComponent {
  id: number;
  name: string;
  count: number;
  registries: ComponentGroupRegistry[];
}

export interface ComponentGroupDetails {
  group: ComponentGroup;
  total_count: number;
  components: ComponentGroupComponent[];
}

export interface ComponentGroupDetailsParams {
  group_id: number;
  start_date?: string;
  end_date?: string;
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
