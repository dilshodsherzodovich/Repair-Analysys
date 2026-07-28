import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { locomotiveGpsReportService } from "../services/locomotive-gps-report.service";

export const useLocomotiveGpsReport = ({
  organization,
  locomotiveModel,
  serviceType,
  locomotiveType,
  enabled = true,
}: {
  /** Only supply for non-admin users. Admins omit it to receive every org. */
  organization?: number | null;
  locomotiveModel?: string | null;
  serviceType?: string | null;
  locomotiveType?: string | null;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [
      queryKeys.locomotiveGpsReport.get,
      { organization, locomotiveModel, serviceType, locomotiveType },
    ],
    queryFn: () =>
      locomotiveGpsReportService.get({
        // Admins pass null → the param is dropped so the API returns all orgs.
        organization: organization ?? undefined,
        locomotive_model: locomotiveModel || undefined,
        service_type: serviceType || undefined,
        locomotive_type: locomotiveType || undefined,
      }),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// Types are re-exported here so the report pages import them alongside the hook.
export type {
  GpsReportLocomotive,
  GpsReportModel,
  GpsReportOrganization,
  LocomotiveGpsReportResponse,
} from "../types/locomotive-gps-report";
