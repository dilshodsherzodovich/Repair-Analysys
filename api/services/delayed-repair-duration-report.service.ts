import api from "../axios";
import {
  DelayedRepairDurationParams,
  DelayedRepairDurationResponse,
} from "../types/delayed-repair-duration-report";

export const delayedRepairDurationReportService = {
  get: async (
    params: DelayedRepairDurationParams,
  ): Promise<DelayedRepairDurationResponse> =>
    (await api.get("/delayed-repair-duration-report/", { params })).data,
};
