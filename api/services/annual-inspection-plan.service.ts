import api from "../axios";
import {
  AnnualInspectionPlan,
  AnnualInspectionPlanWrite,
  AnnualPlanEditRow,
  AnnualPlanReport,
  cellCount,
  cellId,
} from "../types/annual-inspection-plan";

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

  /**
   * Seeds the edit grid from the same `report/` endpoint the view grids use,
   * flattened to one row per filled (type, model, month) cell. Cells keep their
   * plan row id, so editing still PATCHes / DELETEs the existing row.
   */
  getEditRows: async (params: {
    year?: number;
    organization?: number;
  }): Promise<AnnualPlanEditRow[]> => {
    const report = await annualInspectionPlanService.getReport("report", params);
    const rows: AnnualPlanEditRow[] = [];

    for (const org of report?.organizations ?? []) {
      for (const type of org?.inspection_types ?? []) {
        for (const modelRow of type?.locomotive_models ?? []) {
          for (const [month, cell] of Object.entries(modelRow?.months ?? {})) {
            const count = cellCount(cell);
            const id = cellId(cell);
            // Empty cells with no row behind them carry nothing to edit.
            if (!count && id == null) continue;
            rows.push({
              id,
              month: Number(month),
              inspection_type: type.inspection_type.id,
              locomotive_model: modelRow.locomotive_model.id,
              count,
            });
          }
        }
      }
    }

    return rows;
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
