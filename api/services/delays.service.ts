import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  DelayEntry,
  DelayCreatePayload,
  DelayUpdatePayload,
  DelayListParams,
  DelayReportParams,
  DelayReportResponse,
  DelayReportFreightResponse,
  DepotReasonReportResponse,
} from "../types/delays";

const buildDelayFormData = (
  delayData: DelayCreatePayload | DelayUpdatePayload
) => {
  const formData = new FormData();

  Object.entries(delayData).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

export const delaysService = {
  async getDelays(
    params?: DelayListParams
  ): Promise<PaginatedData<DelayEntry>> {
    const response = await api.get<PaginatedData<DelayEntry>>("/sriv/delays/", {
      params: {
        page: params?.page,
        page_size: params?.page_size,
        search: params?.search,
        delay_type: params?.delay_type,
        station: params?.station,
        responsible_org: params?.responsible_org,
        status: params?.status,
        archive: params?.archive,
        incident_date: params?.incident_date,
        from_date: params?.from_date,
        end_date: params?.end_date,
        train_type: params?.train_type,
        group_reason: params?.group_reason,
      },
    });
    return response.data;
  },

  async getDelay(id: number | string): Promise<DelayEntry> {
    const response = await api.get<DelayEntry>(`/sriv/delays/${id}/`);
    return response.data;
  },

  async createDelay(payload: DelayCreatePayload): Promise<DelayEntry> {
    const hasFile = payload.report instanceof File;
    const requestPayload = hasFile ? buildDelayFormData(payload) : payload;

    const config = hasFile
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};

    const response = await api.post<DelayEntry>(
      "/sriv/delays/",
      requestPayload,
      config
    );
    return response.data;
  },

  async bulkCreateDelays(payload: DelayCreatePayload[]): Promise<DelayEntry[]> {
    // Bulk create expects JSON array, so we need to remove File objects
    // If files are needed, they should be uploaded separately or handled differently
    const jsonPayload = payload.map((item) => {
      const { report, ...rest } = item;
      // Only include report if it's not a File (i.e., it's a string/URL)
      if (report && !(report instanceof File)) {
        return { ...rest, report };
      }
      return rest;
    });

    const response = await api.post<DelayEntry[]>(
      "/sriv/delays/bulk-create/",
      jsonPayload
    );
    return response.data;
  },

  async updateDelay(
    id: number | string,
    payload: DelayUpdatePayload
  ): Promise<DelayEntry> {
    const hasFile = payload.report instanceof File;
    const requestPayload = hasFile ? buildDelayFormData(payload) : payload;

    const config = hasFile
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};

    const response = await api.patch<DelayEntry>(
      `/sriv/delays/${id}/`,
      requestPayload,
      config
    );
    return response.data;
  },

  async deleteDelay(id: number | string): Promise<void> {
    await api.delete(`/sriv/delays/${id}/`);
  },

  async getDelayReportsByPassengerTrain(
    params: DelayReportParams
  ): Promise<DelayReportResponse> {
    const response = await api.get<DelayReportResponse>("/sriv/reports/", {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        organizations: params.organizations,
        train_types: params.train_types,
      },
    });
    return response.data;
  },

  async getDelayReportsByFreightTrain(
    params: DelayReportParams
  ): Promise<DelayReportFreightResponse> {
    const response = await api.get<DelayReportFreightResponse>(
      "/sriv/detailed-reports/",
      {
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          organizations: params.organizations,
          train_types: params.train_types,
        },
      }
    );
    return response.data;
  },

  async getDepotReasonReports(
    params: DelayReportParams
  ): Promise<DepotReasonReportResponse> {
    const response = await api.get<DepotReasonReportResponse>(
      "/sriv/depot-reason-reports/",
      {
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          organizations: params.organizations,
          train_types: params.train_types,
        },
      }
    );
    return response.data;
  },
};

export default delaysService;
