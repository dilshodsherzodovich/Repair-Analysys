import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import {
  DepartmentCreateParams,
  DepartmentGetParams,
  DepartmentUpdateParams,
} from "../types/deparments";
import { departmentsService } from "../services/department.service";

export const useDepartments = (params: DepartmentGetParams) => {
  return useQuery({
    queryKey: [queryKeys.departments.list, { ...params }],
    queryFn: () => {
      return departmentsService.getDepartments(params);
    },
    enabled: !!params.page || !!params.no_page,
  });
};

export const useCreateDepartment = () => {
  return useMutation({
    mutationKey: [queryKeys.departments.create],
    mutationFn: (data: DepartmentCreateParams) =>
      departmentsService.createDepartment(data),
  });
};

export const useEditDepartment = () => {
  return useMutation({
    mutationKey: [queryKeys.departments.edit],
    mutationFn: (data: DepartmentUpdateParams) =>
      departmentsService.updateDepartment(data),
  });
};

export const useDeleteDepartment = () => {
  return useMutation({
    mutationKey: [queryKeys.departments.delete],
    mutationFn: (id: string) => departmentsService.deleteDepartment(id),
  });
};
