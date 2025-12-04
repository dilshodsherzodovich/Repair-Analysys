import { queryKeys } from "../querykey";
import { organizationsService } from "../services/organizations.service";
import { useQuery } from "@tanstack/react-query";

export const useOrganizations = (
  paramsOrToken?: { no_page?: boolean; page?: number } | string,
  temporaryToken?: string
) => {
  // Handle both old signature (params object) and new signature (temporaryToken string)
  const params = typeof paramsOrToken === "object" ? paramsOrToken : undefined;
  const token =
    typeof paramsOrToken === "string"
      ? paramsOrToken
      : temporaryToken || undefined;

  return useQuery({
    queryKey: [queryKeys.organizations.list, params, token],
    queryFn: () => organizationsService.getOrganizations(params, token),
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};
