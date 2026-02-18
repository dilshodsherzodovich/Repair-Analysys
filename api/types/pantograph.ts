export interface PantographJournalEntry {
  id: number;
  locomotive: number;
  department: string;
  section: string;
  date: string;
  created_time: string;
  last_updated_time: string;
  damage: string;
  description: string;
  locomotive_info: {
    id: number;
    name: string;
    locomotive_model: string;
  };
  organization_info: {
    id: number;
    name: string;
  };
}

export interface PantographJournalParams {
  page?: number;
  page_size?: number;
  search?: string;
  tab?: string;
  no_page?: boolean;
  locomotive?: number;
  organization?: number;
  department?: string;
}

export interface CreatePantographJournalPayload {
  locomotive: number;
  department: string;
  section: string;
  date: string;
  damage: string;
  description: string;
}

export interface UpdatePantographJournalPayload {
  locomotive?: number;
  department?: string;
  section?: string;
  date?: string;
  damage?: string;
  description?: string;
}
