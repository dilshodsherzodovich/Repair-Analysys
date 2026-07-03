import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  DelayEntry,
  DelayCreatePayload,
  DelayUpdatePayload,
  DelayListParams,
  UploadProtocolPayload,
  ClassifyPayload,
  DelayReportParams,
  DelayReportResponse,
  DelayReportFreightResponse,
  DepotReasonReportResponse,
  SrivPaymentReportParams,
  SrivPaymentReportResponse,
} from "../types/delays";

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
        stage: params?.stage,
        protocol_overdue: params?.protocol_overdue,
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
    // report/protocol_number/status are NOT part of create — handled via actions
    const response = await api.post<DelayEntry>("/sriv/delays/", payload);
    return response.data;
  },

  async bulkCreateDelays(payload: DelayCreatePayload[]): Promise<DelayEntry[]> {
    const response = await api.post<DelayEntry[]>(
      "/sriv/delays/bulk-create/",
      payload
    );
    return response.data;
  },

  async updateDelay(
    id: number | string,
    payload: DelayUpdatePayload
  ): Promise<DelayEntry> {
    const response = await api.patch<DelayEntry>(`/sriv/delays/${id}/`, payload);
    return response.data;
  },

  async deleteDelay(id: number | string): Promise<void> {
    await api.delete(`/sriv/delays/${id}/`);
  },

  // Stage transitions ------------------------------------------------------

  // created → accepted (sriv_moderator)
  async acceptDelay(id: number | string): Promise<DelayEntry> {
    const response = await api.post<DelayEntry>(`/sriv/delays/${id}/accept/`, {});
    return response.data;
  },

  // accepted → protocol_uploaded (sriv_moderator) — multipart report + number
  async uploadProtocol(
    id: number | string,
    payload: UploadProtocolPayload
  ): Promise<DelayEntry> {
    const formData = new FormData();
    formData.append("report", payload.report);
    formData.append("protocol_number", payload.protocol_number);
    const response = await api.post<DelayEntry>(
      `/sriv/delays/${id}/upload-protocol/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  // protocol_uploaded → disruption | not_disruption (sriv_admin)
  async classifyDelay(
    id: number | string,
    payload: ClassifyPayload
  ): Promise<DelayEntry> {
    const response = await api.post<DelayEntry>(
      `/sriv/delays/${id}/classify/`,
      payload
    );
    return response.data;
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

  async getSrivPaymentReport(
    params: SrivPaymentReportParams
  ): Promise<SrivPaymentReportResponse> {
    const response = await api.get<SrivPaymentReportResponse>(
      "/sriv/payment-reports/",
      {
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          organizations: params.organizations,
        },
      }
    );
    return response.data;
  },
};

export default delaysService;
