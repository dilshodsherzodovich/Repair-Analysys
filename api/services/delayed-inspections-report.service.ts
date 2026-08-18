import api from "../axios";
import {
  DelayedInspectionsReportParams,
  DelayedInspectionsReportResponse,
} from "../types/delayed-inspections-report";

export const delayedInspectionsReportService = {
  /** Not paginated — the whole result set arrives in one response. */
  get: async (
    params: DelayedInspectionsReportParams,
  ): Promise<DelayedInspectionsReportResponse> =>
    (await api.get("/delayed-inspections-report/", { params })).data,
};
