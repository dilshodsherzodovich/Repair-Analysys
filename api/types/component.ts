export interface ComponentValue {
  id: number;
  component: string;
  locomotive: number;
  factory_number: string | null;
  date_info: string | null;
}

export interface ComponentParams {
  locomotive?: number;
  section?: number;
  page?: number;
  page_size?: number;
  no_page?: boolean;
}
