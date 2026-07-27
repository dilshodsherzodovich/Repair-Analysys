import { useQuery } from "@tanstack/react-query";
import api from "../axios";

// Ported from the dejurniy project (shared backend). The endpoint is keyed by
// organization/model and returns a row per locomotive; on the passport page we
// filter to a single locomotive client-side by its id.
export interface IntervalInspectionDetail {
  inspection_type: string;
  mileage_interval: number;
  hours_interval: number;
  inspection_start_mileage_avg: number;
  inspection_remaining_time_avg: number;
}

export interface LocomotiveIntervalAnalyticsData {
  locomotive: string;
  locomotive_model: string;
  locomotive_id: number;
  organization: string;
  details: IntervalInspectionDetail[];
}

export interface LocomotiveIntervalAnalyticsResponse {
  status: number;
  data: LocomotiveIntervalAnalyticsData[];
}

interface UseIntervalAnalyticsParams {
  organization?: number | string;
  locomotive_model?: number | string;
  last_inspections_count?: number;
  enabled?: boolean;
}

async function fetchIntervalAnalytics(params: {
  organization?: number | string;
  locomotive_model?: number | string;
  last_inspections_count?: number;
}): Promise<LocomotiveIntervalAnalyticsResponse> {
  const response = await api.get<LocomotiveIntervalAnalyticsResponse>(
    "/locomotive-interval-analytics/",
    { params }
  );
  return response.data;
}

export function useLocomotiveIntervalAnalytics({
  organization,
  locomotive_model,
  last_inspections_count = 5,
  enabled = true,
}: UseIntervalAnalyticsParams) {
  return useQuery({
    queryKey: [
      "locomotive-interval-analytics",
      organization,
      locomotive_model,
      last_inspections_count,
    ],
    queryFn: () =>
      fetchIntervalAnalytics({
        organization,
        locomotive_model,
        last_inspections_count,
      }),
    enabled: enabled && !!organization,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
}

/** Selector: the interval-analytics row for a single locomotive id. */
export function useLocomotiveIntervalAnalyticsDetail(
  organization?: number | string,
  locomotiveId?: number,
  enabled: boolean = true
) {
  const query = useLocomotiveIntervalAnalytics({ organization, enabled });
  const analytics = query.data?.data?.find(
    (row) => row.locomotive_id === locomotiveId
  );
  return { ...query, analytics };
}
