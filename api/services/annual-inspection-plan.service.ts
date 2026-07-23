import api from "../axios";
import {
  AnnualInspectionPlan,
  AnnualInspectionPlanWrite,
  AnnualPlanReport,
} from "../types/annual-inspection-plan";
import { PaginatedData } from "../types/general";

interface ReportParams {
  year?: number;
  organization?: number;
  inspection_type?: number;
  locomotive_model?: number;
}

export const annualInspectionPlanService = {
  /** Grid data. `variant` = "report" (plan) or "fact" (actually performed). */
  getReport: async (
    variant: "report" | "fact",
    params: ReportParams,
  ): Promise<AnnualPlanReport> => {
    const res = await api.get<AnnualPlanReport>(
      `/annual-inspection-plans/${variant}/`,
      { params },
    );
    return res.data;
  },

  /** Walks the paginated list endpoint page-by-page to seed the edit grid. */
  getAll: async (params: {
    year?: number;
    organization?: number;
  }): Promise<AnnualInspectionPlan[]> => {
    const all: AnnualInspectionPlan[] = [];
    let page = 1;
    // Safety cap so a misbehaving `next` can never loop forever.
    while (page <= 200) {
      const res = await api.get<PaginatedData<AnnualInspectionPlan>>(
        "/annual-inspection-plans/",
        { params: { ...params, page } },
      );
      const data = res.data;
      const rows = Array.isArray(data?.results) ? data.results : [];
      all.push(...rows);
      if (!data?.next) break;
      page += 1;
    }
    return all;
  },

  create: async (
    data: AnnualInspectionPlanWrite,
  ): Promise<AnnualInspectionPlan> =>
    (await api.post("/annual-inspection-plans/", data)).data,

  update: async (
    id: number,
    data: Partial<AnnualInspectionPlanWrite>,
  ): Promise<AnnualInspectionPlan> =>
    (await api.patch(`/annual-inspection-plans/${id}/`, data)).data,

  remove: async (id: number): Promise<void> => {
    await api.delete(`/annual-inspection-plans/${id}/`);
  },
};
