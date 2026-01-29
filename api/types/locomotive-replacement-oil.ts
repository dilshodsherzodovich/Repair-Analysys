export interface LocomotiveReplacementOil {
  id: number;
  locomotive_id: number;
  locomotive_name: string;
  section_id: number;
  section_name: string;
  lubricant_type: LubricantType;
  maintenance_type: MaintenanceType;
  lubricant_type_name: string;
  maintenance_type_name: string;
  service_date: string;
  consumption: number;
}

export interface LocomotiveReplacementOilParams {
  page?: number;
  page_size?: number;
  search?: string;
  locomotive?: number;
  section?: number;
  organization?: number;
  no_page?: boolean;
}

export interface CreateLocomotiveReplacementOilPayload {
  locomotive_id: number;
  section_id: number;
  lubricant_type: LubricantType;
  maintenance_type: MaintenanceType;
  service_date: string;
  consumption: number;
}

export type UpdateLocomotiveReplacementOilPayload = Partial<CreateLocomotiveReplacementOilPayload>;

// Maintenance Type Enum
export enum MaintenanceType {
  BUKSA_BEARING = "BUKSA_BEARING",
  TED_BEARING = "TED_BEARING",
  COMPRESSOR_OIL = "COMPRESSOR_OIL",
  AIR_FILTER = "AIR_FILTER",
  OIL_FILTER = "OIL_FILTER",
  LUBRICATION = "LUBRICATION",
  KOZH_OIL = "KOZH_OIL",
  BRAKE_RTI = "BRAKE_RTI",
}

// Lubricant Type Enum
export enum LubricantType {
  ANDROL_3057M = "ANDROL_3057M",
  MOBIL_75W_90 = "MOBIL_75W_90",
  ARCANOL_MULTITOP = "ARCANOL_MULTITOP",
  GREAT_WALL_GREASE = "GREAT_WALL_GREASE",
  MOBIL_TEMP_SHC_32 = "MOBIL_TEMP_SHC_32",
}

// Maintenance Type Labels
export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  [MaintenanceType.BUKSA_BEARING]: "Подшипник буксы",
  [MaintenanceType.TED_BEARING]: "Подшипник ТЭД",
  [MaintenanceType.COMPRESSOR_OIL]: "Масло компрессора",
  [MaintenanceType.AIR_FILTER]: "Воздушный фильтр",
  [MaintenanceType.OIL_FILTER]: "Масляный фильтр компрессора",
  [MaintenanceType.LUBRICATION]: "Смазка (Букса, мотор, ось)",
  [MaintenanceType.KOZH_OIL]: "Масло КОЖХ",
  [MaintenanceType.BRAKE_RTI]: "РТИ тормозной системы",
};

// Lubricant Type Labels
export const LUBRICANT_TYPE_LABELS: Record<LubricantType, string> = {
  [LubricantType.ANDROL_3057M]: "Androl 3057M",
  [LubricantType.MOBIL_75W_90]: "Mobil 75W-90",
  [LubricantType.ARCANOL_MULTITOP]: "Arcanol Multitop",
  [LubricantType.GREAT_WALL_GREASE]: "Великая стена смазка",
  [LubricantType.MOBIL_TEMP_SHC_32]: "Mobil Temp SHC 32",
};

