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

export interface RevisionJournalGroup {
  id: number;
  name: string;
  created_time: string;
  last_updated_time: string;
}

export interface RevisionJournalGroupParams {
  search?: string;
  ordering?: string;
  page?: number;
  no_page?: boolean;
}

export interface EchRemarkGroup {
  id: number;
  name: string;
  order: number;
  is_active: boolean;
}

export interface EchRemarkGroupParams {
  only_active?: boolean;
  is_active?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
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
  group_ech?: number | null;
  ech_remark_group?: number | null;
  created_time: string;
  last_updated_time: string;
  locomotive_info: LocomotiveInfo;
  inspection_type_info: InspectionTypeInfo;
  organization_info: Organization;
  remark_group_info?: RevisionRemarkGroupInfo | null;
  remark_info?: RevisionRemarkInfo | null;
  group_ech_info?: RevisionJournalGroup | null;
  ech_remark_group_info?: EchRemarkGroup | null;
  user_info: string;
}

export interface DefectiveWorkCreatePayload {
  group_ech?: number;
  ech_remark_group?: number;
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
  group_ech?: number | null;
  ech_remark_group?: number | null;
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
  group_ech?: number | string;
  ech_remark_group?: number | string;
  createdFrom?: string;
  createdTo?: string;
  ordering?: string;
  fromDate?: string;
  toDate?: string;
}
