import { useMutation, useQuery } from "@tanstack/react-query";
import { organizationsService } from "../services/organizations.service";
import {
  OrganizationCreateParams,
  OrganizationsGetParams,
  OrganizationUpdateParams,
} from "../types/organizations";
import { queryKeys } from "../querykey";

export const useOrganizations = (params: OrganizationsGetParams) => {
  return useQuery({
    queryKey: [queryKeys.organizations.list, { ...params }],
    queryFn: () => {
      return organizationsService.getOrganizations(params);
    },
    enabled: !!params.page || !!params.no_page,
  });
};

export const useCreateOrganization = () => {
  return useMutation({
    mutationKey: [queryKeys.organizations.create],
    mutationFn: (data: OrganizationCreateParams) =>
      organizationsService.createOrganization(data),
  });
};

export const useEditOrganization = () => {
  return useMutation({
    mutationKey: [queryKeys.organizations.edit],
    mutationFn: (data: OrganizationUpdateParams) =>
      organizationsService.updateOrganization(data),
  });
};

export const useDeleteOrganization = () => {
  return useMutation({
    mutationKey: [queryKeys.organizations.delete],
    mutationFn: (id: string) => organizationsService.deleteOrganization(id),
  });
};

export const useStatisticsOrganizations = ({
  no_page,
}: {
  no_page?: boolean;
}) => {
  return useQuery({
    queryKey: [queryKeys.organizations.statistics],
    queryFn: () => organizationsService.getStatisticsOrganizations({ no_page }),
  });
};
