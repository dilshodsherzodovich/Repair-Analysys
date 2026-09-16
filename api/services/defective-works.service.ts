import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  DefectiveWorkEntry,
  DefectiveWorkCreatePayload,
  DefectiveWorkUpdatePayload,
  DefectiveWorkListParams,
  RevisionRemarkGroup,
  RevisionRemarkGroupParams,
  RevisionJournalGroup,
  RevisionJournalGroupParams,
  EchRemarkGroup,
  EchRemarkGroupParams,
} from "../types/defective-works";

export const defectiveWorksService = {
  async getEchRemarkGroups(
    params?: EchRemarkGroupParams,
  ): Promise<EchRemarkGroup[]> {
    const response = await api.get<EchRemarkGroup[] | PaginatedData<EchRemarkGroup>>(
      "/ech-remark-groups/",
      { params },
    );
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  async getEchDefectiveWorks(
    params?: DefectiveWorkListParams,
  ): Promise<PaginatedData<DefectiveWorkEntry>> {
    const response = await api.get<PaginatedData<DefectiveWorkEntry>>(
      "/ech-revision-journal/",
      {
        params: {
          page: params?.page,
          page_size: params?.page_size,
          search: params?.search,
          ech_remark_group: params?.ech_remark_group,
          locomotive: params?.locomotive,
          locomotive_model: params?.locomotive_model,
          locomotive_type: params?.locomotive_type,
          inspection_type: params?.inspection_type,
          organization: params?.organization_id,
          is_competed: params?.tab,
          fromDate: params?.fromDate,
          toDate: params?.toDate,
          createdFrom: params?.createdFrom,
          createdTo: params?.createdTo,
          ordering: params?.ordering,
          no_page: params?.no_page,
        },
      },
    );
    return response.data;
  },

  async createEchDefectiveWork(
    payload: DefectiveWorkCreatePayload,
  ): Promise<DefectiveWorkEntry> {
    const response = await api.post<DefectiveWorkEntry>(
      "/ech-revision-journal/",
      payload,
    );
    return response.data;
  },
  async getRevisionJournalGroups(
    params?: RevisionJournalGroupParams,
    temporaryToken?: string,
  ): Promise<RevisionJournalGroup[]> {
    const response = await api.get<
      RevisionJournalGroup[] | PaginatedData<RevisionJournalGroup>
    >("/revision-journal-groups/", {
      ...(temporaryToken && {
        headers: { Authorization: `Bearer ${temporaryToken}` },
      }),
      params: {
        search: params?.search,
        ordering: params?.ordering,
        page: params?.page,
        no_page: params?.no_page,
      },
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results ?? []);
  },
  async getRevisionRemarkGroups(
    params?: RevisionRemarkGroupParams,
    temporaryToken?: string,
  ): Promise<RevisionRemarkGroup[]> {
    const response = await api.get<
      RevisionRemarkGroup[] | PaginatedData<RevisionRemarkGroup>
    >("/revision-remark-groups/", {
      ...(temporaryToken && {
        headers: { Authorization: `Bearer ${temporaryToken}` },
      }),
      params: {
        locomotive: params?.locomotive,
        locomotive_id: params?.locomotive_id,
        locomotive_model: params?.locomotive_model,
        locomotive_type: params?.locomotive_type,
        is_active: params?.is_active,
        only_active: params?.only_active,
        search: params?.search,
        ordering: params?.ordering,
        no_page: params?.no_page,
      },
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results ?? []);
  },
  async getDefectiveWorks(
    params?: DefectiveWorkListParams,
  ): Promise<PaginatedData<DefectiveWorkEntry>> {
    const response = await api.get<PaginatedData<DefectiveWorkEntry>>(
      "/revision-journal/",
      {
        params: {
          page: params?.page,
          page_size: params?.page_size,
          search: params?.search,
          is_competed: params?.tab,
          no_page: params?.no_page,
          organization: params?.organization_id,
          inspection_type: params?.inspection_type,
          locomotive: params?.locomotive,
          locomotive_model: params?.locomotive_model,
          locomotive_type: params?.locomotive_type,
          remark_group: params?.remark_group,
          remark: params?.remark,
          group_ech: params?.group_ech,
          ech_remark_group: params?.ech_remark_group,
          fromDate: params?.fromDate,
          toDate: params?.toDate,
        },
      },
    );
    return response.data;
  },
  async createDefectiveWork(
    payload: DefectiveWorkCreatePayload,
  ): Promise<DefectiveWorkEntry> {
    const response = await api.post<DefectiveWorkEntry>(
      "/revision-journal/",
      payload,
    );
    return response.data;
  },
  async updateDefectiveWork(
    id: number | string,
    payload: DefectiveWorkUpdatePayload,
  ): Promise<DefectiveWorkEntry> {
    const response = await api.patch<DefectiveWorkEntry>(
      `/revision-journal/${id}/`,
      payload,
    );
    return response.data;
  },
  async deleteDefectiveWork(id: number | string): Promise<void> {
    await api.delete(`/revision-journal/${id}/`);
  },

  async exportExcel(params: {
    fromDate?: string;
    toDate?: string;
    organization?: string;
  }): Promise<string> {
    const response = await api.get<{ url: string }>(
      "/revision-journal/export-excel/",
      {
        params: {
          fromDate: params.fromDate || undefined,
          toDate: params.toDate || undefined,
          organization: params.organization || undefined,
        },
      },
    );
    return response.data.url;
  },

  // bulk api
  async bulkCreateDefectiveWorks(
    payload: DefectiveWorkCreatePayload[],
    temporaryToken?: string,
  ): Promise<DefectiveWorkEntry> {
    const config = temporaryToken
      ? {
          headers: {
            Authorization: `Bearer ${temporaryToken}`,
          },
        }
      : {};
    const response = await api.post(
      "/revision-journal/bulk_create_values/",
      payload,
      config,
    );
    return response.data;
  },
};

export default defectiveWorksService;
