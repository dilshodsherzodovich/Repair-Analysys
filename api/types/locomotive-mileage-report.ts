export type MileageReportInspectionEntry = {
  date: string | null;
  mileage: number;
};

export type MileageReportLocomotiveData = {
  txk2: MileageReportInspectionEntry;
  txk3: MileageReportInspectionEntry;
  jt1: MileageReportInspectionEntry;
  jt1k: MileageReportInspectionEntry;
  jt3: MileageReportInspectionEntry;
  kt1: MileageReportInspectionEntry;
  kt2: MileageReportInspectionEntry;
};

/** API response: { [modelName]: { [locNumber]: MileageReportLocomotiveData } } */
export type LocomotiveMileageReportResponse = Record<
  string,
  Record<string, MileageReportLocomotiveData>
>;

export type LocomotiveMileageReportParams = {
  organization: number;
  loc_number?: string;
};

export const MILEAGE_REPORT_INSPECTION_KEYS = [
  "txk2",
  "txk3",
  "jt1",
  "jt1k",
  "jt3",
  "kt1",
  "kt2",
] as const;

export type MileageReportInspectionKey =
  (typeof MILEAGE_REPORT_INSPECTION_KEYS)[number];

export const MILEAGE_REPORT_INSPECTION_LABELS: Record<
  MileageReportInspectionKey,
  string
> = {
  txk2: "TXK-2",
  txk3: "TXK-3",
  jt1: "JT-1",
  jt1k: "JT-1k",
  jt3: "JT-3",
  kt1: "KT-1",
  kt2: "KT-2",
};
