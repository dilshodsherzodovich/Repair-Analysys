import api from "../axios";
import {
  Tu137Params,
  Tu137ApiResponse,
  Tu137RecurringParams,
  Tu137RecurringGroup,
} from "../types/tu137";

export const tu137Service = {
  async getRecords(params?: Tu137Params): Promise<Tu137ApiResponse> {
    const response = await api.get<Tu137ApiResponse>("/tu137/integration/", {
      params: {
        depo_id: params?.depo_id,
        finished: params?.finished,
        mashinist_id: params?.mashinist_id,
        page: params?.page ?? 1,
        page_size: params?.page_size ?? 20,
        responsible_organization: params?.responsible_organization,
        fromDate: params?.fromDate,
        toDate: params?.toDate,
        search: params?.search,
        is_repeat: params?.is_repeat,
        ordering: params?.ordering,
      },
    });
    return response.data;
  },

  async getRecurring(
    params: Tu137RecurringParams,
  ): Promise<Tu137RecurringGroup[]> {
    const response = await api.get<
      Tu137RecurringGroup[] | { results: Tu137RecurringGroup[] }
    >("/tu137/integration/recurring/", {
      params: {
        depo_id: params.depo_id,
        responsible_organization: params.responsible_organization,
        fromDate: params.fromDate,
        toDate: params.toDate,
        search: params.search,
        status: params.status,
      },
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results ?? []);
  },
};
