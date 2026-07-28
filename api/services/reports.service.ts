import api from "../axios";
import {
  CategorizedLocomotivesResponse,
  DelayedLocomotivesResponse,
  InspectionTypeLocomotivesResponse,
  ReportDateRangeParams,
  ReservedLocomotivesResponse,
} from "../types/reports";

/** Endpoints behind the reports dashboard. All share the same date window. */
export const reportsService = {
  /** Locomotives bucketed by operational category (active, switcher, …). */
  getCategorizedLocomotives: async (
    params: ReportDateRangeParams,
  ): Promise<CategorizedLocomotivesResponse> =>
    (await api.get("/categorized-locomotives/", { params })).data,

  /** Locomotives grouped by inspection type, split electric / diesel. */
  getInspectionTypeLocomotives: async (
    params: ReportDateRangeParams,
  ): Promise<InspectionTypeLocomotivesResponse> =>
    (await api.get("/inspection-type-locomotives/", { params })).data,

  /** Same grouping, restricted to TXK-2. */
  getTxk2InspectionTypeLocomotives: async (
    params: ReportDateRangeParams,
  ): Promise<InspectionTypeLocomotivesResponse> =>
    (await api.get("/txk2-inspection-type-locomotives/", { params })).data,

  getDelayedLocomotives: async (
    params: ReportDateRangeParams,
  ): Promise<DelayedLocomotivesResponse[]> =>
    (await api.get("/delayed-locomotives-report/", { params })).data,

  getReservedLocomotives: async (
    params: ReportDateRangeParams,
  ): Promise<ReservedLocomotivesResponse> =>
    (await api.get("/reserved-locomotives/", { params })).data,
};
