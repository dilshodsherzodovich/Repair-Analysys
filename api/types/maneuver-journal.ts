import { LocomotiveInfo } from "./locomotive";
import { Organization } from "./organizations";

export interface ManeuverJournalEntry {
  id: number | string;
  from_section: string;
  to_section: string;
  organization: number;
  author: number;
  locomotive: number;
  station: string;
  date: string;
  created_time: string;
  last_updated_time: string;
  organization_info: Organization | null;
  locomotive_info: LocomotiveInfo;
  author_info: {
    id: number;
    username: string;
    full_name: string;
  };
}

export interface ManeuverJournalParams {
  page?: number;
  page_size?: number;
  search?: string;
  date_after?: string;
  date_before?: string;
  locomotive?: number | string;
  organization?: number | string;
}

export interface ManeuverJournalResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ManeuverJournalEntry[];
}

export interface ManeuverJournalCreateData {
  from_section: string;
  to_section: string;
  author: number;
  organization: number;
  locomotive: number;
  station: string;
  date: string;
}

export type ManeuverJournalUpdateData = Partial<ManeuverJournalCreateData>;
