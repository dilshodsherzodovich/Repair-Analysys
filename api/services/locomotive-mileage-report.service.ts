import api from "../axios";
import type {
  LocomotiveMileageReportResponse,
  LocomotiveMileageReportParams,
} from "../types/locomotive-mileage-report";

export type LocomotiveMileageReportExportParams = {
  organization: number;
  search?: string;
};

export const locomotiveMileageReportService = {
  async getReport(
    params: LocomotiveMileageReportParams
  ): Promise<LocomotiveMileageReportResponse> {
    const response = await api.get<LocomotiveMileageReportResponse>(
      "/locomotive-mileage-report/",
      {
        params: {
          organization: params.organization,
          search: params.loc_number || undefined,
        },
      }
    );
    return response.data;
  },

  async exportExcel(
    params: LocomotiveMileageReportExportParams
  ): Promise<Blob> {
    const response = await api.get("/locomotive-mileage-report/export_excel/", {
      params: {
        organization: params.organization,
        search: params.search || undefined,
      },
      responseType: "blob",
    });
    return response.data as Blob;
  },
};
