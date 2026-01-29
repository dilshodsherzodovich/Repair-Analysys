export interface LocomotiveData {
  id: number;
  name: string;
  model_name: string;
}

export interface LocomotiveInfo {
  id: number;
  name: string;
  locomotive_model: string;
}

export type SpecialComponent = {
  id: number;
  year_of_manufacture: string;
  factory_number: string;
} & Record<string, string | number | null>;

export interface SortedLocomotiveData {
  name: string;
  id: number;
  model_name: string;
  model_image: string;
  sections: { id: number; name: string }[];
  special_components: SpecialComponent[];
}

export interface LokomotiveDataGetParams {
  no_page?: boolean;
  locomotive_model?: number;
  search?: string;
  organization?: number;
  registered_organization?: number;
}

export interface LocomotiveModelData {
  id: number;
  code: number;
  locomotive_type: string;
  name: string;
}

export interface LocomotiveModelGetParams {
  page?: number;
  no_page?: boolean;
}