import { LocomotiveInfo } from "./locomotive";
import { InspectionTypeInfo } from "./inspectionTypes";
import { Organization } from "./organizations";

export interface DefectiveWorkEntry {
  id: number;
  locomotive: number;
  inspection_type: number;
  train_driver: string;
  table_number: string;
  issue: string;
  code: string;
  date: string;
  created_time: string;
  last_updated_time: string;
  locomotive_info: LocomotiveInfo;
  inspection_type_info: InspectionTypeInfo;
  organization_info: Organization;
  user_info: string;
}

export interface DefectiveWorkCreatePayload {
  locomotive: number;
  inspection_type?: number;
  train_driver?: string;
  table_number?: string;
  organization_id?: number;
  issue: string;
  code?: string;
  date?: string;
}

export interface DefectiveWorkUpdatePayload {
  locomotive?: number;
  inspection_type?: number;
  train_driver?: string;
  table_number?: string;
  issue?: string;
  code?: string;
  date?: string;
}

export interface DefectiveWorkListParams {
  page?: number;
  page_size?: number;
  search?: string;
  tab?: string;
  no_page?: boolean;
}
