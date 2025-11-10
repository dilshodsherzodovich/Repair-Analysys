import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { logsService } from "../services/logs.service";
import { LogsGetParams } from "../types/logs";

export const useLogs = (params: LogsGetParams) => {
  return useQuery({
    queryKey: [queryKeys.logs.list, { ...params }],
    queryFn: () => logsService.getLogs(params),
    enabled: !!params.page || !!params.no_page,
  });
};
