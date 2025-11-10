export interface Department {
  id: string;
  name: string;
  organization_id: string;
  organization: string;
  created: string;
  updated: string;
}

export interface DepartmentGetParams {
  page?: number;
  no_page?: boolean;
  search?: string;
}

export interface DepartmentCreateParams {
  name: string;
  organization_id: string;
}

export interface DepartmentUpdateParams {
  id: string;
  name: string;
  organization_id: string;
}
