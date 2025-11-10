import api from "../axios";
import { PaginatedData } from "../types/general";
import { LogItem, LogsGetParams } from "../types/logs";

export const logsService = {
  getLogs: async (params: LogsGetParams) => {
    const response = await api.get<PaginatedData<LogItem>>("/logs/", {
      params: {
        action: params.action,
        content_type: params.content_type,
        user: params.user,
        page: params.page,
        search: params.search,
        date_from: params.date_from,
        date_to: params.date_to,
        no_page: params.no_page,
      },
    });
    return response.data;
  },
};

export default logsService;
