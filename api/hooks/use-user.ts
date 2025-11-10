"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { CreateUserRequest, CreateUserResponse } from "@/api/types/user";
import { queryKeys } from "../querykey";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<CreateUserResponse, Error, CreateUserRequest>({
    mutationFn: (userData: CreateUserRequest) =>
      userService.createUser(userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users.all] });
      console.log("User created successfully:", data);
    },
    onError: (error) => {
      console.error("Error creating user:", error.message);
    },
  });
}

export function useUsers({
  page,
  no_page,
  role,
  search,
  organization,
  secondary_organization,
}: {
  page?: number;
  no_page?: boolean;
  role?: string;
  search?: string;
  organization?: string;
  secondary_organization?: string;
}) {
  return useQuery({
    queryKey: [
      queryKeys.users.all,
      { page, role, search, organization, secondary_organization },
    ],
    queryFn: () => userService.getUsers({ page, no_page, search, role }),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: [queryKeys.users.detail(id)],
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useStatisticsUsers() {
  return useQuery({
    queryKey: [queryKeys.users.statistics],
    queryFn: () => userService.getStatisticsUsers(),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      userData,
    }: {
      id: string;
      userData: Partial<CreateUserRequest>;
    }) => userService.updateUser(id, userData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users.all] });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.users.detail(variables.id)],
      });
    },
    onError: (error) => {
      console.error("Error updating user:", error.message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users.all] });
      queryClient.removeQueries({ queryKey: [queryKeys.users.detail(id)] });
    },
    onError: (error) => {
      console.error("Error deleting user:", error.message);
    },
  });
}
