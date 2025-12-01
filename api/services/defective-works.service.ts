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
    params?: DefectiveWorkListParams
  ): Promise<PaginatedData<DefectiveWorkEntry>> {
    const response = await api.get<PaginatedData<DefectiveWorkEntry>>(
      "/revision-journal/",
      {
        params: {
          page: params?.page,
          page_size: params?.page_size,
          search: params?.search,
          tab: params?.tab,
          no_page: params?.no_page,
        },
      }
    );
    return response.data;
  },
  async createDefectiveWork(
    payload: DefectiveWorkCreatePayload
  ): Promise<DefectiveWorkEntry> {
    const response = await api.post<DefectiveWorkEntry>(
      "/revision-journal/",
      payload
    );
    return response.data;
  },
  async updateDefectiveWork(
    id: number | string,
    payload: DefectiveWorkUpdatePayload
  ): Promise<DefectiveWorkEntry> {
    const response = await api.patch<DefectiveWorkEntry>(
      `/revision-journal/${id}/`,
      payload
    );
    return response.data;
  },
  async deleteDefectiveWork(id: number | string): Promise<void> {
    await api.delete(`/revision-journal/${id}/`);
  },
};

export default defectiveWorksService;
