import { queryKeys } from "../querykey";
import { organizationsService } from "../services/organizations.service";
import { useQuery } from "@tanstack/react-query";

export const useOrganizations = () => {
  return useQuery({
    queryKey: [queryKeys.organizations.list],
    queryFn: () => organizationsService.getOrganizations(),
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};
