import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  RecoveryDelay,
  RecoveryListParams,
  PayrollConfirmPayload,
  RecoverPayload,
} from "../types/recovery";

export const recoveryService = {
  async getRecoveryDelays(
    params?: RecoveryListParams
  ): Promise<PaginatedData<RecoveryDelay>> {
    const response = await api.get<PaginatedData<RecoveryDelay>>(
      "/sriv/recovery-delays/",
      {
        params: {
          page: params?.page,
          page_size: params?.page_size,
          stage: params?.stage,
          from_date: params?.from_date,
          end_date: params?.end_date,
          incident_date: params?.incident_date,
          delay_type: params?.delay_type,
          group_reason: params?.group_reason,
          train_type: params?.train_type,
          train_number: params?.train_number,
          station: params?.station,
          mashinist: params?.mashinist,
          locomotiv: params?.locomotiv,
          responsible_org: params?.responsible_org,
          search: params?.search,
          ordering: params?.ordering,
        },
      }
    );
    return response.data;
  },

  async getRecoveryDelay(id: number | string): Promise<RecoveryDelay> {
    const response = await api.get<RecoveryDelay>(
      `/sriv/recovery-delays/${id}/`
    );
    return response.data;
  },

  // Step 1 — payroll (ОТЗ) confirmation
  async payrollConfirm(
    id: number | string,
    payload: PayrollConfirmPayload
  ): Promise<RecoveryDelay> {
    const response = await api.post<RecoveryDelay>(
      `/sriv/recovery-delays/${id}/payroll-confirm/`,
      payload
    );
    return response.data;
  },

  // Step 2 — accountant recovery mark
  async recover(
    id: number | string,
    payload: RecoverPayload
  ): Promise<RecoveryDelay> {
    const response = await api.post<RecoveryDelay>(
      `/sriv/recovery-delays/${id}/recover/`,
      payload
    );
    return response.data;
  },
};

export default recoveryService;
