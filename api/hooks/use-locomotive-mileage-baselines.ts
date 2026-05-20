import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locomotiveMileageBaselinesService } from "../services/locomotive-mileage-baselines.service";
import type { LocomotiveMileageBaselinePayload } from "../types/locomotive-mileage-baselines";
import { queryKeys } from "../querykey";

export function useLocomotiveMileageBaseline(
  locomotiveId: number | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [queryKeys.locomotiveMileageBaselines.list, locomotiveId],
    queryFn: () => locomotiveMileageBaselinesService.getList(locomotiveId!),
    enabled: options?.enabled !== false && locomotiveId != null,
    staleTime: 0,
  });
}

export function useCreateLocomotiveMileageBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LocomotiveMileageBaselinePayload) =>
      locomotiveMileageBaselinesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotiveMileageBaselines.list],
      });
      queryClient.invalidateQueries({ queryKey: ["txk13-report"] });
    },
  });
}

export function useUpdateLocomotiveMileageBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LocomotiveMileageBaselinePayload }) =>
      locomotiveMileageBaselinesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotiveMileageBaselines.list],
      });
      queryClient.invalidateQueries({ queryKey: ["txk13-report"] });
    },
  });
}

export function useDeleteLocomotiveMileageBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => locomotiveMileageBaselinesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotiveMileageBaselines.list],
      });
      queryClient.invalidateQueries({ queryKey: ["txk13-report"] });
    },
  });
}
