export interface Tu137Record {
  id: number;
  comments: string;
  status_id: number;
  group_id: number;
  organization_id: number;
  emm_id: number;
  depo_id: number;
  station_code: string;
  km_picket: string;
  mashinist_id: number;
  create_user: number;
  change_user: number;
  create_date: string;
  change_date: string;
  removed: boolean;
  peregon: boolean;
  station2_code: string;
  moment_date: string;
  lokomotiv_id: number;
  poezd_number: number;
  answer: string;
  depo_name: string;
  group_name: string;
  station_name: string;
  station2_name: string;
  lokomotiv_name: string;
  mashinist_fio: string;
  create_user_fio: string;
  change_user_fio: string;
  status_name: string;
  organization_name: string;
  records_filtered: number;
}

export interface Tu137Params {
  p_depo_id?: number | string;
  p_create_date_from?: string;
  p_create_date_to?: string;
}

export interface Tu137ApiResponse {
  data: Tu137Record[];
  code: number;
  message: string;
  errors: string[];
  isValid: boolean;
}
