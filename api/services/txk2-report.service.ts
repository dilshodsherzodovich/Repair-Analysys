import api from "../axios";
import { Txk2ReportParams, Txk2ReportResponse } from "../types/txk2-report";

export const txk2ReportService = {
  get: async (params: Txk2ReportParams): Promise<Txk2ReportResponse> =>
    (await api.get("/txk2-report/", { params })).data,
};
