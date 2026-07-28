import { useQuery } from "@tanstack/react-query";
import {
  getEmmAuthToken,
  getDriverInfo,
  getLatestLocation,
  getLocationHistory,
  type DriverInfoApiResponse,
  type LocationRecord,
} from "../services/emm.service";

/**
 * Current driver(s) for a locomotive from the external EMM railway service.
 * Needs the locomotive number (name) and its model id.
 */
export function useDriverInfo(
  locomotiveNumber?: string,
  modelId?: number,
  enabled: boolean = true
) {
  return useQuery<DriverInfoApiResponse>({
    queryKey: ["emm-driver-info", locomotiveNumber, modelId],
    queryFn: async () => {
      const token = await getEmmAuthToken();
      return getDriverInfo(token.value, locomotiveNumber!, modelId!);
    },
    enabled: enabled && !!locomotiveNumber && !!modelId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/** Latest GPS position for a locomotive by IMEI (external EMM service). */
export function useLocomotiveLocation(imei?: string, enabled: boolean = true) {
  return useQuery<LocationRecord | null>({
    queryKey: ["emm-location-latest", imei],
    queryFn: async () => {
      const token = await getEmmAuthToken();
      return getLatestLocation(token.value, imei!);
    },
    enabled: enabled && !!imei,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Full GPS history for a locomotive by IMEI. Kept lazy (enable on demand) since
 * the passport only loads it when the user opens the history view.
 */
export function useLocomotiveLocationHistory(
  imei?: string,
  enabled: boolean = false
) {
  return useQuery<LocationRecord[]>({
    queryKey: ["emm-location-history", imei],
    queryFn: async () => {
      const token = await getEmmAuthToken();
      return getLocationHistory(token.value, imei!);
    },
    enabled: enabled && !!imei,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
