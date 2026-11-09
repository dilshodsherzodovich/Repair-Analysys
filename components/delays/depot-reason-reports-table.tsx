"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ErrorCard } from "@/ui/error-card";
import { useDepotReasonReports } from "@/api/hooks/use-delays";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

export function DepotReasonReportsTable() {
  const { getAllQueryValues } = useFilterParams();
  const {
    start_date,
    end_date,
    organizations: organizationsParam,
    service_type: serviceTypeParam,
  } = getAllQueryValues();

  const activeServiceType = serviceTypeParam === "passenger" ? "passenger,electric,high_speed" : "freight";

  const params = useMemo(() => {
    if (!start_date || !end_date) return undefined;

    return {
      start_date,
      end_date,
      organizations: organizationsParam,
      train_types: activeServiceType,
    };
  }, [start_date, end_date, organizationsParam, activeServiceType]);

  const {
    data,
    isLoading,
    error,
  } = useDepotReasonReports(params);

  const headers = data?.headers || [];
  // Default skeleton column count if headers not loaded yet
  const skeletonColumnCount = headers.length > 0 ? headers.length : 4;

  return (
    <div className="mt-8">
      {error && (
        <ErrorCard
          title="Произошла ошибка"
          message={error.message || "Произошла ошибка"}
          onRetry={() => { }}
          showRetry={false}
          showBack={false}
          className="mb-4"
        />
      )}

      {isLoading && (
        <div className="mt-6 bg-background rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border-strong">
                  {Array.from({ length: skeletonColumnCount }).map((_, index) => (
                    <th
                      key={index}
                      className={cn(
                        "border border-border-strong px-4 py-3 text-center font-semibold text-sm",
                        index === skeletonColumnCount - 1 && "bg-border"
                      )}
                    >
                      <div className="h-4 bg-border rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "border-b border-border",
                      rowIndex % 2 === 0 ? "bg-background" : "bg-surface-muted/50"
                    )}
                  >
                    {Array.from({ length: skeletonColumnCount }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className={cn(
                          "border border-border-strong px-4 py-3 text-center",
                          colIndex === skeletonColumnCount - 1 && "bg-border"
                        )}
                      >
                        <div className="h-4 bg-border rounded animate-pulse mx-auto w-12" />
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Skeleton Total Row */}
                <tr className="bg-border border-t-2 border-foreground-subtle">
                  {Array.from({ length: skeletonColumnCount }).map((_, colIndex) => (
                    <td
                      key={colIndex}
                      className={cn(
                        "border border-border-strong px-4 py-3 text-center",
                        colIndex === skeletonColumnCount - 1 && "bg-border"
                      )}
                    >
                      <div className="h-4 bg-border-strong rounded animate-pulse mx-auto w-12" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="mt-6 bg-background rounded-md overflow-hidden">
          <div className="overflow-x-auto">

            {data?.summary && (
              <div className="mb-2 border-border bg-surface-muted text-md text-foreground-secondary flex justify-center">
                <div className="font-semibold flex items-center gap-1">
                  Всего по вине локомотивных депо:
                  <span>
                    {data.summary.total_cases} сл. на{" "}
                  </span>
                  <span>
                    {data.summary.total_delay_time_formatted}
                  </span>
                </div>
              </div>
            )}

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border-strong">
                  {headers?.map((header, index) => (
                    <th
                      key={header}
                      className={cn(
                        "border border-border-strong px-4 py-3 text-center font-semibold text-sm",
                        index === headers?.length - 1 && "bg-border"
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.rows?.map((row, index) => (
                  <tr
                    key={row?.reason}
                    className="border-b border-border hover:bg-surface-muted"
                  >
                    {Object.entries(row).slice(1).map(([key, value], index) => (
                      <td
                        key={key}
                        className={cn(
                          "border border-border-strong px-4 py-3 text-sm text-center font-bold",
                          index === headers?.length - 1 && "bg-border"
                        )}
                      >
                        {value ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Total Row */}
                {data?.total && (
                  <tr className="bg-border border-t-2 border-foreground-subtle font-semibold">
                    {Object.entries(data?.total).slice(1).map(([key, value], index) => (
                      <td
                        key={key}
                        className={cn(
                          "border border-border-strong px-4 py-3 text-sm text-center font-bold",
                          index === headers?.length - 1 && "bg-border"
                        )}
                      >
                        {value ?? 0}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

