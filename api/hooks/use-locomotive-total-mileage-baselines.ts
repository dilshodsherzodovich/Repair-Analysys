import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locomotiveTotalMileageBaselinesService } from "../services/locomotive-total-mileage-baselines.service";
import type {
  TotalMileageBaselineCreatePayload,
  TotalMileageBaselinePatchPayload,
} from "../types/locomotive-total-mileage-baselines";

const QK = "locomotive-total-mileage-baselines";

export function useTotalMileageBaseline(
  locomotiveId: number | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [QK, locomotiveId],
    queryFn: () => locomotiveTotalMileageBaselinesService.get(locomotiveId!),
    enabled: options?.enabled !== false && locomotiveId != null,
    staleTime: 0,
  });
}

export function useCreateTotalMileageBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TotalMileageBaselineCreatePayload) =>
      locomotiveTotalMileageBaselinesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK] });
      queryClient.invalidateQueries({ queryKey: ["txk13-report"] });
    },
  });
}

export function useUpdateTotalMileageBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TotalMileageBaselinePatchPayload }) =>
      locomotiveTotalMileageBaselinesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK] });
      queryClient.invalidateQueries({ queryKey: ["txk13-report"] });
    },
  });
}

export function useDeleteTotalMileageBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => locomotiveTotalMileageBaselinesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK] });
      queryClient.invalidateQueries({ queryKey: ["txk13-report"] });
    },
  });
}
