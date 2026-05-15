import api from "../axios";
import type { Txk13ReportParams, Txk13ReportResponse } from "../types/txk13-report";

export const txk13ReportService = {
  async getReport(params: Txk13ReportParams): Promise<Txk13ReportResponse> {
    const response = await api.get<Txk13ReportResponse>("/txk13-report/", {
      params: { organization: params.organization },
    });
    return response.data;
  },
};
