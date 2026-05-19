import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locomotiveMileageBaselinesService } from "../services/locomotive-mileage-baselines.service";
import type {
  LocomotiveMileageBaselineParams,
  LocomotiveMileageBaselinePayload,
} from "../types/locomotive-mileage-baselines";
import { queryKeys } from "../querykey";

export function useLocomotiveMileageBaseline(
  params: LocomotiveMileageBaselineParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [queryKeys.locomotiveMileageBaselines.list, params],
    queryFn: () => locomotiveMileageBaselinesService.getList(params),
    enabled:
      options?.enabled !== false &&
      params.locomotive != null &&
      params.inspection_type != null,
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
