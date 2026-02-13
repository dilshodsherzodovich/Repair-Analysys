export type ReserveLocomotive = {
  id: number;
  name: string;
  locomotive_model: { id: number; name: string } | null;
  location_category: { id: number; name: string; name_uz: string; name_ru: string } | null;
  location: { id: number; name: string; name_uz: string; name_ru: string } | null;
  registered_organization: {
    id: number;
    name: string;
    name_uz: string;
    name_ru: string;
    code: number;
  } | null;
  operating_organization: {
    id: number;
    name: string;
    name_uz: string;
    name_ru: string;
    code: number;
  } | null;
};

export type ReserveItem = {
  id: number;
  author: number | null;
  locomotive: ReserveLocomotive;
  branch: number | null;
  location: number | null;
  location_category: number | null;
  start_date: string | null;
  end_date: string | null;
  command_number: string;
  is_active: boolean;
};

export type ReserveGetParams = {
  is_active: 0 | 1; // 0 = archive, 1 = current (jarayondagi)
  page?: number;
  page_size?: number;
};
