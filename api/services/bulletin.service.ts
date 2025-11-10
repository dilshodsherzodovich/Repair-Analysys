import {
  Bulletin,
  BulletinCreateBody,
  BulletinCreateRow,
  BulletinFile,
  BulletinFileStatusHistoryCreateRequest,
  BulletinFileUpdateRequest,
  BulletinRow,
} from "../types/bulleten";
import api from "@/api/axios";
import { PaginatedData } from "../types/general";

export const bulletinService = {
  getBulletins: async ({
    page = 1,
    search,
    type_of_journal,
    organization,
  }: {
    page: number;
    search?: string;
    type_of_journal?: string;
    organization?: string;
  }): Promise<PaginatedData<Bulletin>> => {
    try {
      const response = await api.get("/journal/all/", {
        params: {
          page,
          search,
          type_of_journal,
          organization,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching bulletins:", error);
      throw error;
    }
  },

  getBulletinDetail: async (id: string): Promise<Bulletin> => {
    try {
      const response = await api.get<Bulletin>(`/journal/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bulletin detail ${id}:`, error);
      throw error;
    }
  },

  createBulletin: async (body: BulletinCreateBody): Promise<Bulletin> => {
    try {
      const response = await api.post<Bulletin>("/journal/create/", body);
      return response.data;
    } catch (error) {
      console.error("Error creating bulletin:", error);
      throw error;
    }
  },

  updateBulletin: async (
    id: string,
    body: Partial<BulletinCreateBody>
  ): Promise<Bulletin> => {
    try {
      const response = await api.patch<Bulletin>(`/journal/${id}/`, body);
      return response.data;
    } catch (error) {
      console.error("Error updating bulletin:", error);
      throw error;
    }
  },

  deleteBulletin: async (id: string): Promise<void> => {
    try {
      await api.delete(`/journal/${id}/`);
    } catch (error) {
      console.error("Error deleting bulletin:", error);
      throw error;
    }
  },

  getBulletin: async (id: string): Promise<Bulletin> => {
    try {
      const response = await api.get(`/journal/${id}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching bulletin:", error);
      throw error;
    }
  },

  createBulletinFile: async (
    id: string,
    upload_file: File
  ): Promise<BulletinFile> => {
    try {
      const formData = new FormData();
      formData.append("journal", id);
      formData.append("upload_file", upload_file);

      const response = await api.post<BulletinFile>(
        "/journal-history/create/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading bulletin file:", error);
      throw error;
    }
  },

  updateBulletinFile: async ({
    id,
    data,
  }: {
    id: string;
    data: BulletinFileUpdateRequest;
  }): Promise<void> => {
    try {
      const formData = new FormData();
      if (data.upload_file) {
        formData.append("upload_file", data.upload_file as File);
      }
      formData.append("editable", data.editable.toString());
      await api.patch(`/journal/only-permitted/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      console.error("Error updating bulletin file:", error);
      throw error;
    }
  },

  deleteBulletinFile: async (id: string): Promise<void> => {
    try {
      await api.delete(`/uploaded-files/delete/${id}/`);
    } catch (error) {
      console.error("Error deleting bulletin file:", error);
      throw error;
    }
  },

  createBulletinFileStatusHistory: async ({
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
    try {
      const formData = new FormData();
      formData.append("j_upload_history_id", j_upload_history_id);
      formData.append("upload_file", upload_file);
      formData.append("description", description);

      const response = await api.post<BulletinFileStatusHistoryCreateRequest>(
        `/upload-file/journal-history/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating bulletin file status history:", error);
      throw error;
    }
  },
};

export const bulletinRowService = {
  createBulletinRow: async (body: BulletinCreateRow): Promise<BulletinRow> => {
    try {
      const response = await api.post<BulletinRow>(
        "/journal/row/create/",
        body
      );
      return response.data;
    } catch (error) {
      console.error("Error creating bulletin row:", error);
      throw error;
    }
  },

  updateBulletinRow: async (
    id: string,
    body: BulletinCreateRow
  ): Promise<BulletinRow> => {
    try {
      const response = await api.patch<BulletinRow>(
        `/journal/row/${id}/`,
        body
      );

      return response.data;
    } catch (error) {
      console.error("Error updating bulletin row:", error);
      throw error;
    }
  },

  deleteBulletinRow: async (id: string): Promise<void> => {
    try {
      await api.delete(`/journal/row/${id}/`);
    } catch (error) {
      console.error("Error deleting bulletin row:", error);
      throw error;
    }
  },
};
