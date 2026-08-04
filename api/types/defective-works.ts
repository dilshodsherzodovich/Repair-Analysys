import { LocomotiveInfo } from "./locomotive";
import { InspectionTypeInfo } from "./inspectionTypes";
import { Organization } from "./organizations";

// TU-152 remark groups (справочник типовых замечаний, привязан к типу локомотива).
export interface RevisionRemark {
  id: number;
  group: number;
  name: string;
  code?: string;
  order: number;
  is_active: boolean;
}

export interface RevisionRemarkGroup {
  id: number;
  locomotive_type: string;
  locomotive_type_display?: string;
  /** id of the model, or null for a group shared across the whole type */
  locomotive_model?: number | null;
  locomotive_model_name?: string | null;
  name: string;
  code?: string;
  order: number;
  is_active: boolean;
  remarks: RevisionRemark[];
  created_time?: string;
  last_updated_time?: string;
}

export interface RevisionRemarkGroupParams {
  locomotive?: number | string;
  locomotive_id?: number | string;
  locomotive_model?: number | string;
  locomotive_type?: string;
  is_active?: boolean;
  only_active?: boolean;
  search?: string;
  ordering?: string;
  no_page?: boolean;
}

export interface RevisionRemarkGroupInfo {
  id: number;
  name: string;
  code: string;
  locomotive_type: string;
}

export interface RevisionRemarkInfo {
  id: number;
  name: string;
  code: string;
  group_id: number;
}

export interface DefectiveWorkEntry {
  id: number;
  locomotive: number;
  inspection_type: number;
  train_driver: string;
  table_number: string;
  issue: string;
  code: string;
  date: string;
  remark_group?: number | null;
  remark?: number | null;
  created_time: string;
  last_updated_time: string;
  locomotive_info: LocomotiveInfo;
  inspection_type_info: InspectionTypeInfo;
  organization_info: Organization;
  remark_group_info?: RevisionRemarkGroupInfo | null;
  remark_info?: RevisionRemarkInfo | null;
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
  remark?: number;
  remark_group?: number;
}

export interface DefectiveWorkUpdatePayload {
  locomotive?: number;
  inspection_type?: number;
  train_driver?: string;
  table_number?: string;
  issue?: string;
  code?: string;
  date?: string;
  remark?: number;
  remark_group?: number;
}

export interface DefectiveWorkListParams {
  page?: number;
  page_size?: number;
  search?: string;
  tab?: string;
  no_page?: boolean;
  organization_id?: number | string;
  inspection_type?: number | string;
  locomotive?: number | string;
  locomotive_model?: number | string;
  locomotive_type?: string;
  remark_group?: number | string;
  remark?: number | string;
  fromDate?: string;
  toDate?: string;
}
