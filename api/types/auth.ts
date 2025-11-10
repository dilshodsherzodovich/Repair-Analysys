// Login request interface
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserData {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
  username: string;
  is_active: boolean;
  profile: any;
}

export interface LoginResponse {
  user_data: UserData;
  access: string;
  refresh: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
