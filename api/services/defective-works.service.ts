import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  DefectiveWorkEntry,
  DefectiveWorkCreatePayload,
  DefectiveWorkUpdatePayload,
  DefectiveWorkListParams,
} from "../types/defective-works";

export const defectiveWorksService = {
  async getDefectiveWorks(
    params?: DefectiveWorkListParams,
  ): Promise<PaginatedData<DefectiveWorkEntry>> {
    const response = await api.get<PaginatedData<DefectiveWorkEntry>>(
      "/revision-journal/",
      {
        params: {
          page: params?.page,
          page_size: params?.page_size,
          search: params?.search,
          is_completed: params?.tab,
          no_page: params?.no_page,
          organization: params?.organization_id,
          inspection_type: params?.inspection_type,
          locomotive: params?.locomotive,
          fromDate: params?.fromDate,
          toDate: params?.toDate,
        },
      },
    );
    return response.data;
  },
  async createDefectiveWork(
    payload: DefectiveWorkCreatePayload,
  ): Promise<DefectiveWorkEntry> {
    const response = await api.post<DefectiveWorkEntry>(
      "/revision-journal/",
      payload,
    );
    return response.data;
  },
  async updateDefectiveWork(
    id: number | string,
    payload: DefectiveWorkUpdatePayload,
  ): Promise<DefectiveWorkEntry> {
    const response = await api.patch<DefectiveWorkEntry>(
      `/revision-journal/${id}/`,
      payload,
    );
    return response.data;
  },
  async deleteDefectiveWork(id: number | string): Promise<void> {
    await api.delete(`/revision-journal/${id}/`);
  },

  async exportExcel(params: {
    fromDate?: string;
    toDate?: string;
    organization?: string;
  }): Promise<string> {
    const response = await api.get<{ url: string }>(
      "/revision-journal/export-excel/",
      {
        params: {
          fromDate: params.fromDate || undefined,
          toDate: params.toDate || undefined,
          organization: params.organization || undefined,
        },
      },
    );
    return response.data.url;
  },

  // bulk api
  async bulkCreateDefectiveWorks(
    payload: DefectiveWorkCreatePayload[],
    temporaryToken?: string,
  ): Promise<DefectiveWorkEntry> {
    const config = temporaryToken
      ? {
          headers: {
            Authorization: `Bearer ${temporaryToken}`,
          },
        }
      : {};
    const response = await api.post(
      "/revision-journal/bulk_create_values/",
      payload,
      config,
    );
    return response.data;
  },
};

export default defectiveWorksService;
