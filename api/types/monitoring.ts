import { Bulletin } from "./bulleten";
import { UserData } from "./user";

export interface MonitoringOrganization {
  id: string;
  name: string;
  total_count: number;
  on_time_count: number;
  late_count: number;
  missed_count: number;
  near_due_date_count: number;
  on_time_percentage: number;
  late_percentage: number;
  missed_percentage: number;
}

export interface MonitoringTotalStats {
  total_count: number;
  on_time_count: number;
  late_count: number;
  missed_count: number;
  on_time_percentage: number;
  late_percentage: number;
  missed_percentage: number;
}

export interface MonitoringResults {
  total_stats: MonitoringTotalStats;
  organizations: MonitoringOrganization[];
}

export interface MonitoringApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MonitoringResults;
}

export interface MonitoringNearDeadlineRes {
  id: string;
  name: string;
  sec_org_journals: {
    id: string;
    type_of_journal: "journal" | "bulleten";
    name: string;
    employees_list: UserData[];
  }[];
}
