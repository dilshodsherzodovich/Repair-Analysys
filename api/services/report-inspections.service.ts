import api from "../axios";
import { InspectionResponse } from "../types/report-inspection";

/** Count of inspections keyed by inspection-type name. */
export interface InspectionCountStatsResponse {
  [key: string]: number;
}

/**
 * Inspection endpoints the report pages read. Separate from
 * `inspections.service` because the reports use the `/inspections/report/`
 * projection and the stats endpoint, neither of which the operational
 * inspections screens touch.
 */
export const reportInspectionsService = {
  /** Paginated (or full, with `no_page`) inspection list. */
  getInspections: async (
    params: Record<string, string | number | boolean | undefined>,
    timeout?: number,
  ): Promise<InspectionResponse> =>
    (await api.get("/inspections/", { params, timeout })).data,

  /** Report projection of the same resource. */
  getInspectionsReport: async (
    params: Record<string, string | number | boolean | undefined>,
    timeout?: number,
  ): Promise<InspectionResponse> =>
    (await api.get("/inspections/report/", { params, timeout })).data,

  getInspectionCountStats: async (
    params: Record<string, string | number | undefined>,
  ): Promise<InspectionCountStatsResponse> =>
    (await api.get("/inspection-count-stats/", { params })).data,
};
