import type { LocomotiveData } from "./locomotive";

// Order data type based on API response
export interface OrderData {
  id: number;
  train_number: string;
  responsible_department: string;
  responsible_person: string;
  damage_amount: string;
  locomotive: number;
  case_description: string;
  date: string; // ISO 8601 datetime format
  created_time: string;
  last_updated_time: string;
  organization_info: string;
  user_info: string;
  locomotive_info: LocomotiveData | null;
}

// Order create request payload
export interface CreateOrderPayload {
  train_number: string;
  responsible_department: string;
  responsible_person: string;
  damage_amount: string;
  locomotive: number;
  case_description: string;
  date: string; // ISO 8601 datetime format
}

export interface UpdateOrderPayload {
  train_number?: string;
  responsible_department?: string;
  responsible_person?: string;
  damage_amount?: string;
  locomotive?: number;
  case_description?: string;
  date?: string; // ISO 8601 datetime format
}

// Parameters for getting orders
export interface OrdersGetParams {
  page?: number;
  page_size?: number; // Optional: page size for pagination
  search?: string;
  tab?: string; // all, chinese, 3p9e, teplovoz, statistics
  no_page?: boolean;
}
