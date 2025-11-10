// Login request interface
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserData {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number: string;
  tabel: number;
  email: string;
  branch: number | null;
}

export interface LoginResponse extends UserData {
  access: string;
  refresh: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
