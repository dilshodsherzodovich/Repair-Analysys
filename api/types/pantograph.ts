import { LocomotiveData } from "./locomotive";
export interface PantographJournalEntry {
  id: number;
  title: string;
  locomotive: number;
  department: string;
  section: string;
  date: string;
  created_time: string;
  last_updated_time: string;
  damage: string;
  description: string;
  locomotive_info: LocomotiveData;
  organization_info: string;
}

export interface PantographJournalParams {
  page?: number;
  page_size?: number;
  search?: string;
  tab?: string;
  no_page?: boolean;
}

export interface CreatePantographJournalPayload {
  title: string;
  locomotive: number;
  department: string;
  section: string;
  date: string;
  damage: string;
  description: string;
}

export interface UpdatePantographJournalPayload {
  title?: string;
  locomotive?: number;
  department?: string;
  section?: string;
  date?: string;
  damage?: string;
  description?: string;
}
