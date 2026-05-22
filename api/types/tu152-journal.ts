export type EnergyTypeOfJournal = "FUEL" | "ELECTRICITY" | "NONE_TYPE";
export type StampAuthorizedBy = "KIP" | "ERB";

export interface CombinedJournalLocomotiveInfo {
  id: number;
  name: string;
  model_name?: string;
  code?: string;
}

export interface EnergyTypeBlock {
  type_of_journal: EnergyTypeOfJournal;
  weight_of_fuel?: number | null;
  kv_electricity?: number | null;
  date_of_receipt?: string | null;
  receiver?: string | null;
  sender?: string | null;
}

export interface FireExtinguisherBlock {
  name?: string | null;
  count?: number | null;
  receiver?: string | null;
  sender?: string | null;
}

export interface CameraReceiptBlock {
  name?: string | null;
  count?: number | null;
  receiver?: string | null;
  sender?: string | null;
}

export interface StampBlock {
  red_stamp?: boolean | null;
  green_stamp?: boolean | null;
  stamp_applied_at?: string | null;
  authorized_by?: StampAuthorizedBy | null;
}

export interface RevisionJournalBlock {
  inspection_type?: number | null;
  train_driver?: string | null;
  table_number?: string | null;
  issue?: string | null;
  code?: string | null;
  date?: string | null;
  organization_id?: number | null;
}

export interface CombinedJournalEntry {
  id: number;
  locomotive_id: number;
  locomotive_info?: CombinedJournalLocomotiveInfo | null;
  energy_type?: (EnergyTypeBlock & { id?: number }) | null;
  fire_extinguisher?: (FireExtinguisherBlock & { id?: number }) | null;
  camera_receipt?: (CameraReceiptBlock & { id?: number }) | null;
  stamp?: (StampBlock & { id?: number }) | null;
  revision_journal?: (RevisionJournalBlock & { id?: number }) | null;
  created_time?: string;
  last_updated_time?: string;
}

export interface CombinedJournalListParams {
  page?: number;
  page_size?: number;
  search?: string;
  locomotive_id?: number;
  organization?: number;
  date_from?: string;
  date_to?: string;
  no_page?: boolean;
}

export interface CombinedJournalPayload {
  locomotive_id: number;
  energy_type?: EnergyTypeBlock | null;
  fire_extinguisher?: FireExtinguisherBlock | null;
  camera_receipt?: CameraReceiptBlock | null;
  stamp?: StampBlock | null;
  revision_journal?: RevisionJournalBlock | null;
}
