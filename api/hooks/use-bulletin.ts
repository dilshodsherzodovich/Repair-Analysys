import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulletinRowService,
  bulletinService,
} from "../services/bulletin.service";
import { queryKeys } from "../querykey";
import {
  BulletinCreateBody,
  BulletinCreateRow,
  BulletinFileUpdateRequest,
} from "../types/bulleten";

export const useBulletin = (params: {
  page: number;
  type_of_journal?: string;
  search?: string;
  organization?: string;
}) => {
  return useQuery({
    queryKey: [queryKeys.bulletins.list, { ...params }],
    queryFn: () => {
      return bulletinService.getBulletins(params);
    },
    enabled: !!params.page,
  });
};

export const useBulletinDetail = (id: string) => {
  return useQuery({
    queryKey: [queryKeys.bulletins.detail(id)],
    queryFn: () => {
      return bulletinService.getBulletinDetail(id);
    },
  });
};

export const useCreateBulletin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.bulletins.create],
    mutationFn: (data: BulletinCreateBody) =>
      bulletinService.createBulletin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.bulletins.list] });
    },
  });
};

export const useUpdateBulletin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.bulletins.edit],
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      bulletinService.updateBulletin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.bulletins.list] });
    },
  });
};

export const useDeleteBulletin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.bulletins.delete],
    mutationFn: (id: string) => bulletinService.deleteBulletin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.bulletins.list] });
    },
  });
};

export const useCreateBulletinRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.bulletins.createRow],
    mutationFn: (data: BulletinCreateRow) =>
      bulletinRowService.createBulletinRow(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.bulletins.detail(variables.journal)],
      });
    },
  });
};

export const useUpdateBulletinRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.bulletins.updateRow],
    mutationFn: ({ id, data }: { id: string; data: BulletinCreateRow }) =>
      bulletinRowService.updateBulletinRow(id, data),
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.bulletins.detail(data.journal)],
      });
    },
  });
};

export const useDeleteBulletinRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.bulletins.deleteRow],
    mutationFn: (id: string) => bulletinRowService.deleteBulletinRow(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.bulletins.detail(id)],
      });
    },
  });
};

export const useCreateBulletinFile = () => {
  return useMutation({
    mutationFn: ({ id, upload_file }: { id: string; upload_file: File }) => {
      return bulletinService.createBulletinFile(id, upload_file);
    },
  });
};

export const useUpdateBulletinFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      journal: string;
      data: BulletinFileUpdateRequest;
    }) => {
      return bulletinService.updateBulletinFile({ id, data });
    },
    onSuccess: (_, { journal }) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.bulletins.detail(journal)],
      });
    },
  });
};

export const useDeleteBulletinFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.bulletins.deleteFile],
    mutationFn: ({ fileId }: { fileId: string; journalId: string }) =>
      bulletinService.deleteBulletinFile(fileId),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.bulletins.detail(journalId)],
      });
    },
  });
};

export const useCreateBulletinFileStatusHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      j_upload_history_id,
      upload_file,
      description,
      journal_id,
    }: {
      j_upload_history_id: string;
      upload_file: File;
      description: string;
      journal_id: string;
    }) => {
      return bulletinService.createBulletinFileStatusHistory({
        j_upload_history_id,
        upload_file,
        description,
        journal_id,
      });
    },
    onSuccess: (_, { journal_id }) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.bulletins.detail(journal_id)],
      });
    },
  });
};
