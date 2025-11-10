// User Types based on the API schema
export interface User {
  id?: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  username: string;
  is_active: boolean;
  profile: ProfileModel;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = "admin" | "manager" | "employee" | "guest";

export interface ProfileModel {
  department: string;
  position?: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  date_of_birth?: string;
  hire_date?: string;
  salary?: number;
  manager_id?: string;
  team_id?: string;
  skills?: string[];
  certifications?: string[];
  emergency_contact?: EmergencyContact;
  preferences?: UserPreferences;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: "light" | "dark" | "auto";
}

// Create User Request Types
export interface CreateUserRequest {
  role: UserRole;
  first_name: string;
  last_name: string;
  username: string;
  is_active: boolean;
  profile: ProfileModel;
}

// Update User Request Types
export interface UpdateUserRequest {
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  username?: string;
  is_active?: boolean;
  profile?: Partial<ProfileModel>;
}

// User List Response
export interface UserListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: User[];
}

// User Filters
export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  department?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}
