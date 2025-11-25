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
  locomotive_info: string;
  inspection_type_info: string;
  organization_info: string;
  user_info: string;
}

export interface DefectiveWorkCreatePayload {
  locomotive: number;
  inspection_type: number;
  train_driver: string;
  table_number: string;
  issue: string;
  code: string;
  date: string;
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
