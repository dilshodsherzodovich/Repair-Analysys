import api from "../axios";
import type { Txk13ReportParams, Txk13ReportResponse } from "../types/txk13-report";

export const txk13ReportService = {
  async getReport(params: Txk13ReportParams): Promise<Txk13ReportResponse> {
    const cleanedParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)
    );
    const response = await api.get<Txk13ReportResponse>("/txk13-report/", {
      params: cleanedParams,
    });
    return response.data;
  },

  async patchBandaj(
    locomotiveId: number,
    bandajThickness: number | null
  ): Promise<{ bandaj_thickness: number }> {
    const response = await api.patch<{ bandaj_thickness: number }>(
      `/txk13-report/${locomotiveId}/bandaj/`,
      { bandaj_thickness: bandajThickness }
    );
    return response.data;
  },

  async patchManufactureDate(
    locomotiveId: number,
    manufactureDate: string
  ): Promise<{ manufacture_date: string }> {
    const response = await api.patch<{ manufacture_date: string }>(
      `/txk13-report/${locomotiveId}/manufacture-date/`,
      { manufacture_date: manufactureDate }
    );
    return response.data;
  },

  async patchActualInspectionDate(
    locomotiveId: number,
    inspectionTypeId: number,
    inspectionDate: string
  ): Promise<void> {
    await api.patch(
      `/txk13-report/${locomotiveId}/actual-inspection-date/`,
      { inspection_type_id: inspectionTypeId, inspection_date: inspectionDate }
    );
  },
};
