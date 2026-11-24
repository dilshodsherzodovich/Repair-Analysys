export interface Tu137Record {
  id: number;
  emm_id: number;
  mashinist_id: number;
  depo_id: number;
  finished: boolean;
  finished_at: string | null;
  group_id: number;
  group_name: string;
  resp_organization: {
    id: number;
    name: string;
    emm_id: number;
  };
  resp_organization_parent: {
    id: number;
    name: string;
    emm_id: number;
  } | null;
  station_name: string;
  station2_name: string | null;
  station_code: string;
  station2_code: string | null;
  km_picket: string;
  peregon: boolean;
  lokomotiv_name: string;
  poezd_number: string;
  create_user_fio: string;
  comments: string;
  answer: string;
  image: string | null;
  file: string | null;
  created_at: string;
  updated_at: string;
  /** recurring (povtor) — set by the backend */
  is_repeat?: boolean;
  repeat_count?: number;
}

export interface Tu137Params {
  depo_id?: number | string;
  finished?: boolean;
  mashinist_id?: number;
  page?: number;
  page_size?: number;
  responsible_organization?: number | string;
  /** yyyy-MM-dd, by created_at; last day inclusive */
  fromDate?: string;
  toDate?: string;
  /** mashinist name */
  search?: string;
  is_repeat?: boolean;
  ordering?: string;
}

export interface Tu137RecurringParams {
  depo_id: number | string;
  responsible_organization?: number | string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  status?: string;
}

export interface Tu137RecurringGroup {
  group_id: number;
  group_name: string;
  station_name: string;
  station2_name: string | null;
  station_code: string;
  station2_code: string | null;
  count: number;
  open_count: number;
  records: Tu137Record[];
}

export interface Tu137ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tu137Record[];
}
