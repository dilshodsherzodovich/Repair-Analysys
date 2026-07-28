import api from "../axios";
import {
  LocomotiveGpsReportParams,
  LocomotiveGpsReportResponse,
} from "../types/locomotive-gps-report";

export const locomotiveGpsReportService = {
  get: async (
    params: LocomotiveGpsReportParams,
  ): Promise<LocomotiveGpsReportResponse> =>
    (await api.get("/locomotive-gps-report/", { params })).data,
};
