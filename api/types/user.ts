// User management types and interfaces

import { Organization } from "./organizations";

// User Roles
export type UserRole = "admin" | "tamir tehnik";

// Interface for the ProfileModel object
export interface ProfileModel {
  id: string;
  secondary_organization: {
    id: string;
    name: string;
    organization: Pick<Organization, "id" | "name">;
  };
}

// Interface for the User creation request body
export interface CreateUserRequest {
  role: UserRole;
  first_name: string;
  last_name: string;
  username: string;
  is_active: boolean;
  profile: {
    secondary_organization_id: string;
  };
}

// Interface for the User data returned in a response
export interface UserData {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
  username: string;
  is_active: boolean;
  profile: ProfileModel | null;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for the API response after user creation
export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: UserData;
}

// Interface for the API response when fetching a single user
export interface UserDetailResponse {
  success: boolean;
  message: string;
  data: UserData;
}
