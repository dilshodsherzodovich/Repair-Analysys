import { useQuery } from "@tanstack/react-query";
import api from "../axios";

// Grouped summary of locomotives and their latest laboratory oil analysis
// results (exchange date + validation), organised by locomotive model.
// Endpoint: GET /api/labs/locomotives-oil-status/
//
// Shape (newest → outermost):
//   [ model → { locomotives: [ loco → { analyses: [...] } ] } ]
// The `analyses` array always contains every analysis type; entries with no
// laboratory result carry null exchange_date/validation.
//
// Pass `locomotive_id` to narrow the response to a single locomotive (still
// wrapped in its model group). `locomotive_model` narrows to one model group.

export type OilAnalysisModelName =
  | "DieselOilAnalysis"
  | "CompressorOilAnalysis"
  | "ElectricCompressorOilAnalysis"
  | "MOPOilAnalysis"
  | "ElectricMOPOilAnalysis"
  | "CoolingWaterAnalysis"
  | "DieselFuelAnalysis";

export type OilValidation = "VALID" | "INVALID" | "EXPIRED" | string;

// One analysis result within a locomotive's `analyses` list.
export interface OilAnalysisResult {
  analysis_name: OilAnalysisModelName;
  exchange_date: string | null;
  // Only populated for the DieselOilAnalysis model type.
  last_oil_date?: string | null;
  validation: OilValidation | null;
}

export interface OilStatusLocomotive {
  id: number;
  name: string;
  analyses: OilAnalysisResult[];
}

export interface OilStatusModelGroup {
  id: number;
  name: string;
  locomotives: OilStatusLocomotive[];
}

// One analysis type flattened to the single locomotive we care about.
export interface LocomotiveOilStatusEntry {
  analysis: OilAnalysisModelName;
  modelId: number | null;
  modelName: string | null;
  status: {
    exchange_date: string | null;
    last_oil_date?: string | null;
    validation: OilValidation;
  } | null;
}

interface UseOilStatusParams {
  locomotive_id?: number;
  locomotive_model?: number;
  enabled?: boolean;
}

async function fetchOilStatus(params: {
  locomotive_id?: number;
  locomotive_model?: number;
}): Promise<OilStatusModelGroup[]> {
  const response = await api.get<OilStatusModelGroup[]>(
    "/labs/locomotives-oil-status/",
    { params }
  );
  return response.data;
}

export function useLocomotiveOilStatus({
  locomotive_id,
  locomotive_model,
  enabled = true,
}: UseOilStatusParams) {
  return useQuery({
    queryKey: ["locomotive-oil-status", locomotive_id, locomotive_model],
    queryFn: () => fetchOilStatus({ locomotive_id, locomotive_model }),
    enabled: enabled && !!locomotive_id,
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

/**
 * Selector: flatten the grouped response to one entry per analysis type for a
 * single locomotive. Every analysis type the API returns is represented;
 * `status` is null when this locomotive has no result for a type.
 */
export function useLocomotiveOilStatusEntries(
  locomotiveId?: number,
  locomotiveModel?: number,
  enabled: boolean = true
) {
  const query = useLocomotiveOilStatus({
    locomotive_id: locomotiveId,
    locomotive_model: locomotiveModel,
    enabled,
  });

  const entries: LocomotiveOilStatusEntry[] = [];
  for (const group of query.data ?? []) {
    const loco = group.locomotives.find((l) => l.id === locomotiveId);
    if (!loco) continue;

    for (const result of loco.analyses) {
      const hasData =
        result.validation != null || result.exchange_date != null;
      entries.push({
        analysis: result.analysis_name,
        modelId: group.id,
        modelName: group.name,
        status: hasData
          ? {
              exchange_date: result.exchange_date,
              last_oil_date: result.last_oil_date ?? null,
              validation: result.validation as OilValidation,
            }
          : null,
      });
    }
    break;
  }

  return { ...query, entries };
}
