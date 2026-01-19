export interface TU152Entry {
  id: number;
  comments: string;
  status_id: number;
  group_id: number;
  emm_id: number;
  depo_id: number;
  lokomotiv_id: number;
  mashinist_id: number;
  create_user: number;
  change_user: number;
  create_date: string;
  change_date: string;
  answer: string;
  removed: boolean;
  depo_name: string;
  group_name: string;
  lokomotiv_number: string;
  lokomotiv_seriya_name: string;
  mashinist_fio: string;
  create_user_fio: string;
  change_user_fio: string;
  status_name: string;
  organization_name: string;
  records_filtered: number;
}

export interface TU152ListResponse {
  data: TU152Entry[];
  code: number;
  message: string | null;
  errors: any[];
  isValid: boolean;
}

export interface TU152ListParams {
  p_create_date_from?: string;
  p_create_date_to?: string;
  p_lokomotiv_id?: number | string;
  p_lokomotiv_seriya_id?: number | string;
  p_status_id?: number | string;
}

export interface TU152LocomotiveOption {
  disabled: boolean;
  selected: boolean;
  text: string;
  value: string;
}

export interface TU152LocomotiveListResponse {
  data: TU152LocomotiveOption[];
  code: number;
  message: string | null;
  errors: any[];
  isValid: boolean;
}

export interface TU152LocomotiveModelOption {
  disabled: boolean;
  selected: boolean;
  text: string;
  value: string;
}

export interface TU152LocomotiveModelListResponse {
  data: TU152LocomotiveModelOption[];
  code: number;
  message: string | null;
  errors: any[];
  isValid: boolean;
}

export const TU152_STATUSES = [
  { id: 21, name: "Tasdiqlanmagan" },
  { id: 22, name: "Ehtiyot qism mavjud emas" },
  { id: 23, name: "Hal qilib bo'lmaydi" },
  { id: 24, name: "Bartaraf etildi" },
] as const;

export interface TU152UpdatePayload {
  status_id: number;
  answer: string;
}

