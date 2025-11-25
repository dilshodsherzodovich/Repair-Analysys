import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  DefectiveWorkEntry,
  DefectiveWorkCreatePayload,
  DefectiveWorkUpdatePayload,
  DefectiveWorkListParams,
} from "../types/defective-works";

const BASE_URL = "/revision-journal/";

export const defectiveWorksService = {
  async getDefectiveWorks(
    params?: DefectiveWorkListParams
  ): Promise<PaginatedData<DefectiveWorkEntry>> {
    const response = await api.get<PaginatedData<DefectiveWorkEntry>>(
      BASE_URL,
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
    const response = await api.post<DefectiveWorkEntry>(BASE_URL, payload);
    return response.data;
  },
  async updateDefectiveWork(
    id: number | string,
    payload: DefectiveWorkUpdatePayload
  ): Promise<DefectiveWorkEntry> {
    const response = await api.patch<DefectiveWorkEntry>(
      `${BASE_URL}${id}/`,
      payload
    );
    return response.data;
  },
  async deleteDefectiveWork(id: number | string): Promise<void> {
    await api.delete(`${BASE_URL}${id}/`);
  },
};

export default defectiveWorksService;
