import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { annualInspectionPlanService } from "../services/annual-inspection-plan.service";
import { AnnualInspectionPlanWrite } from "../types/annual-inspection-plan";

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

/** Every plan row for a (year, organization) — seeds the edit grid. */
export const useAllAnnualInspectionPlans = ({
  year,
  organization,
  enabled = true,
}: {
  year?: number;
  organization?: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [queryKeys.annualInspectionPlans.all, { year, organization }],
    queryFn: () => annualInspectionPlanService.getAll({ year, organization }),
    enabled: enabled && !!year && !!organization,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

const useInvalidatePlans = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [queryKeys.annualInspectionPlans.all] });
    qc.invalidateQueries({ queryKey: [queryKeys.annualInspectionPlans.report] });
  };
};

export const useCreateAnnualInspectionPlan = () => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (data: AnnualInspectionPlanWrite) =>
      annualInspectionPlanService.create(data),
    onSuccess: invalidate,
  });
};

export const useUpdateAnnualInspectionPlan = () => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<AnnualInspectionPlanWrite>;
    }) => annualInspectionPlanService.update(id, data),
    onSuccess: invalidate,
  });
};

export const useDeleteAnnualInspectionPlan = () => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (id: number) => annualInspectionPlanService.remove(id),
    onSuccess: invalidate,
  });
};
