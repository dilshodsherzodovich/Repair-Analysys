import { LocomotiveData } from "./locomotive";
import { Organization } from "./organizations";
import { InspectionType } from "./inspection";

export interface RevisionJournalEntry {
  id: number;
  locomotive: number;
  inspection_type: number;
  train_driver: string;
  table_number: string | null;
  group_ech: number | null;
  ech_remark_group: number | null;
  issue: string;
  code: string;
  date: string;
  created_time: string;
  last_updated_time: string;
  locomotive_info: LocomotiveData;
  inspection_type_info: InspectionType;
  organization_info: Organization;
  group_ech_info: { id: number; name: string } | null;
  ech_remark_group_info: { id: number; name: string } | null;
  user_info: {
    id: number;
    username: string;
    full_name: string;
  } | null;
}

export interface RevisionJournalParams {
  page?: number;
  page_size?: number;
  search?: string;
  no_page?: boolean;
  organization?: number;
  locomotive?: number | string;
  group_ech?: number | string;
  ech_remark_group?: number | string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateRevisionJournalPayload {
  group_ech?: number;
  code: string;
  date: string;
  inspection_type: number;
  issue: string;
  locomotive: number;
  table_number?: string;
  train_driver: string;
  organization_id: number;
}

export interface UpdateRevisionJournalPayload {
  group_ech?: number | null;
  code?: string;
  date?: string;
  inspection_type?: number;
  issue?: string;
  locomotive?: number;
  table_number?: string;
  train_driver?: string;
  organization_id?: number;
}
