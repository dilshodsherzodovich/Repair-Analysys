import { Department } from "./deparments";

export type OrganizationType =
  | "hukumat"
  | "vazirlik"
  | "qo'mita"
  | "Quyi tashkilot"
  | "agentlik"
  | "byuro";

export interface Organization {
  id: string;
  name: string;
  legal_basis: string;
  attachment_file: string;
  type?: OrganizationType;
  parent: Organization;
  children: string[];
  created: string;
  is_active?: boolean;
  secondary_organizations: Department[];
}

export interface OrganizationsGetParams {
  page?: number;
  no_page?: boolean;
  search?: string;
}

export interface OrganizationCreateParams {
  name: string;
  legal_basis: string;
  attachment_file: File;
  parent_id?: string;
  children?: string[];
  is_active?: boolean;
  type?: OrganizationType;
}

export interface OrganizationUpdateParams {
  id: string;
  name?: string;
  legal_basis?: string;
  attachment_file?: File;
  parent_id?: string;
  children?: string[];
  is_active?: boolean;
}
