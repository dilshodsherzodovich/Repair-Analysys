import type { LocomotiveData } from "./locomotive";

// Order data type based on API response
export type ConfirmStatus = "pending" | "confirmed" | "rejected";

export interface OrderData {
  id: number;
  train_number: string;
  confirm: boolean; // legacy: true only when confirm_status === "confirmed"
  confirm_status: ConfirmStatus;
  confirm_status_display?: string;
  responsible_department: string;
  responsible_person: string;
  damage_amount: string;
  locomotive: number;
  case_description: string;
  date: string; // ISO 8601 datetime format
  created_time: string;
  last_updated_time: string;
  organization_info: {
    id: number;
    name: string;
  };
  user_info: string;
  locomotive_info: LocomotiveData | null;
  type_of_journal: string;
  file: string | null;
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
  type_of_journal: string;
  file?: File | null;
  organization?: number;
  confirm?: boolean; // Defaults to false
}

export interface UpdateOrderPayload {
  train_number?: string;
  responsible_department?: string;
  responsible_person?: string;
  damage_amount?: string;
  locomotive?: number;
  case_description?: string;
  date?: string; // ISO 8601 datetime format
  type_of_journal?: string;
  file?: File | null;
  organization?: number;
  confirm?: boolean;
  confirm_status?: ConfirmStatus;
}

// Parameters for getting orders
export interface OrdersGetParams {
  page?: number;
  page_size?: number; // Optional: page size for pagination
  search?: string;
  tab?: string; // all, chinese, 3p9e, teplovoz, statistics
  no_page?: boolean;
  type_of_journal?: string;
  locomotive?: number | string;
  responsible_department?: string;
  date?: string; // Format: yyyy-MM-dd
  organization?: number | string;
  confirm_status?: string; // one or comma-separated ConfirmStatus values
}
