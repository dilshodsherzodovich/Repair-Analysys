import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  Culprit,
  CulpritCreatePayload,
  CulpritUpdatePayload,
  CulpritListParams,
} from "../types/culprits";

export const culpritsService = {
  async getCulprits(
    params?: CulpritListParams
  ): Promise<PaginatedData<Culprit>> {
    const response = await api.get<PaginatedData<Culprit>>("/sriv/culprits/", {
      params: {
        page: params?.page,
        page_size: params?.page_size,
        delay: params?.delay,
        organization: params?.organization,
        from_date: params?.from_date,
        end_date: params?.end_date,
        full_name: params?.full_name,
        payroll_confirmed: params?.payroll_confirmed,
        recovered: params?.recovered,
        search: params?.search,
        ordering: params?.ordering,
      },
    });
    return response.data;
  },

  async getCulprit(id: number | string): Promise<Culprit> {
    const response = await api.get<Culprit>(`/sriv/culprits/${id}/`);
    return response.data;
  },

  async createCulprit(payload: CulpritCreatePayload): Promise<Culprit> {
    const response = await api.post<Culprit>("/sriv/culprits/", payload);
    return response.data;
  },

  async updateCulprit(
    id: number | string,
    payload: CulpritUpdatePayload
  ): Promise<Culprit> {
    const response = await api.patch<Culprit>(
      `/sriv/culprits/${id}/`,
      payload
    );
    return response.data;
  },

  async deleteCulprit(id: number | string): Promise<void> {
    await api.delete(`/sriv/culprits/${id}/`);
  },
};

export default culpritsService;
