import { useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { annualInspectionPlanService } from "../services/annual-inspection-plan.service";
import {
  AnnualInspectionPlanWrite,
  AnnualPlanEditRow,
} from "../types/annual-inspection-plan";

/**
 * Grid data matching the printed "grafik raboti" table. `variant` = "report"
 * (the plan) or "fact" (actually performed inspections). Both return the same
 * shape, so consumers render them the same way.
 */
export const useAnnualInspectionPlanReport = ({
  year,
  organization,
  inspection_type,
  locomotive_model,
  variant = "report",
  enabled = true,
}: {
  year?: number;
  organization?: number;
  inspection_type?: number;
  locomotive_model?: number;
  variant?: "report" | "fact";
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [
      queryKeys.annualInspectionPlans.report,
      { variant, year, organization, inspection_type, locomotive_model },
    ],
    queryFn: () =>
      annualInspectionPlanService.getReport(variant, {
        year,
        organization,
        inspection_type,
        locomotive_model,
      }),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

/** Identifies one grid cell inside the cached edit rows. */
export type AnnualPlanCellRef = Pick<
  AnnualPlanEditRow,
  "inspection_type" | "locomotive_model" | "month"
>;

export const annualPlanEditRowsKey = ({
  year,
  organization,
}: {
  year?: number;
  organization?: number;
}) => [queryKeys.annualInspectionPlans.all, { year, organization }];

/**
 * Editable cells for a (year, organization), read off the `report/` endpoint in
 * one request — seeds the edit grid.
 */
export const useAnnualPlanEditRows = ({
  year,
  organization,
  enabled = true,
}: {
  year?: number;
  organization?: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: annualPlanEditRowsKey({ year, organization }),
    queryFn: () =>
      annualInspectionPlanService.getEditRows({ year, organization }),
    enabled: enabled && !!year && !!organization,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

/**
 * Writes each saved cell straight into the cached edit rows.
 *
 * Cells autosave one at a time, so invalidating on every save refetched the
 * whole report per keystroke — and a response that landed after the user had
 * already retyped another cell reseeded the grid with stale counts. Patching
 * the cache keeps the saved state exact without a single extra request.
 */
export const useAnnualPlanCache = ({
  year,
  organization,
}: {
  year?: number;
  organization?: number;
}) => {
  const qc = useQueryClient();

  return useMemo(() => {
    const key = annualPlanEditRowsKey({ year, organization });

    const isSameCell = (
      row: AnnualPlanEditRow,
      cell: AnnualPlanCellRef,
    ): boolean =>
      row.inspection_type === cell.inspection_type &&
      row.locomotive_model === cell.locomotive_model &&
      row.month === cell.month;

    const write = (
      update: (rows: AnnualPlanEditRow[]) => AnnualPlanEditRow[],
    ) =>
      qc.setQueryData<AnnualPlanEditRow[]>(key, (prev) => update(prev ?? []));

    return {
      /** Created or updated cell — replaces the row in place, or appends it. */
      upsertRow: (row: AnnualPlanEditRow) =>
        write((rows) =>
          rows.some((r) => isSameCell(r, row))
            ? rows.map((r) => (isSameCell(r, row) ? { ...r, ...row } : r))
            : [...rows, row],
        ),

      /** Cell cleared to 0 — its plan row is gone. */
      removeRow: (cell: AnnualPlanCellRef) =>
        write((rows) => rows.filter((r) => !isSameCell(r, cell))),

      /**
       * The view grids (reja / fakt) read their own query. Mark them stale so
       * they refresh next time they mount, without refetching mid-editing.
       */
      markReportsStale: () =>
        qc.invalidateQueries({
          queryKey: [queryKeys.annualInspectionPlans.report],
          refetchType: "none",
        }),
    };
  }, [qc, year, organization]);
};

export const useCreateAnnualInspectionPlan = () =>
  useMutation({
    mutationFn: (data: AnnualInspectionPlanWrite) =>
      annualInspectionPlanService.create(data),
  });

export const useUpdateAnnualInspectionPlan = () =>
  useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<AnnualInspectionPlanWrite>;
    }) => annualInspectionPlanService.update(id, data),
  });

export const useDeleteAnnualInspectionPlan = () =>
  useMutation({
    mutationFn: (id: number) => annualInspectionPlanService.remove(id),
  });
