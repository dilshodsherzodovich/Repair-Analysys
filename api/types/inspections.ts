/** Organization reference used in inspection nested objects */

import { InspectionType } from "./inspection";
import { Organization } from "./organizations";


export interface InspectionBranch {
  id: number;
  name: string;
  organization: Organization;
}

export interface InspectionLocationRef {
  id: number;
  name: string;
}

export interface InspectionLocationCategory {
  id: number;
  name: string;
}

export interface InspectionLocomotiveModel {
  id: number;
  name: string;
}

export interface InspectionLocomotive {
  id: number;
  name: string;
  locomotive_model: InspectionLocomotiveModel;
  location_category: InspectionLocationCategory | null;
  location: InspectionLocationRef | null;
  registered_organization: Organization;
  operating_organization: Organization | null;
}

export interface InspectionAuthor {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  branch: InspectionBranch;
  role: string;
  phone_number: string;
  tabel: number;
  is_active: boolean;
}

export interface Inspection {
  id: number;
  locomotive: InspectionLocomotive | null;
  external_locomotive: string;
  author: InspectionAuthor;
  inspection_type: InspectionType ;
  branch: InspectionBranch;
  inspection_start_mileage: number;
  inspection_remaining_time: number;
  mileage_interval: number;
  hour_interval: number;
  is_closed: boolean;
  is_cancelled: boolean;
  is_closed_time: string | null;
  is_cancelled_time: string | null;
  entry_time: string | null;
  comment: string;
  section: string;
  command_number: string;
  created_time: string;
  last_updated_time: string;
}

export interface InspectionsGetParams {
  organization?: number;
  is_closed?: boolean;
  locomotive_type?: string;
  inspection_type?: number;
  is_cancelled?: boolean;
  no_page?: boolean;
  page?: number;
  page_size?: number;
  search?: string;
}
