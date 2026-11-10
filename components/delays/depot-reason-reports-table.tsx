"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ErrorCard } from "@/ui/error-card";
import { useDepotReasonReports } from "@/api/hooks/use-delays";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

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
        <Table bordered frame>
          <TableHeader>
            <TableRow>
              {Array.from({ length: skeletonColumnCount }).map((_, index) => (
                <TableHead
                  key={index}
                  className={cn(
                    "text-center",
                    index === skeletonColumnCount - 1 && ""
                  )}
                >
                  <div className="h-4 bg-border rounded animate-pulse" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <TableRow
                key={rowIndex}
                
              >
                {Array.from({ length: skeletonColumnCount }).map((_, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className={cn(
                      "text-center",
                      colIndex === skeletonColumnCount - 1 && "bg-border"
                    )}
                  >
                    <div className="h-4 bg-border rounded animate-pulse mx-auto w-12" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {/* Skeleton Total Row */}
            <TableRow className="border-foreground-subtle">
              {Array.from({ length: skeletonColumnCount }).map((_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={cn(
                    "text-center",
                    colIndex === skeletonColumnCount - 1 && "bg-border"
                  )}
                >
                  <div className="h-4 bg-border-strong rounded animate-pulse mx-auto w-12" />
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
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

            <Table bordered wrapper={false}>
              <TableHeader>
                <TableRow>
                  {headers?.map((header, index) => (
                    <TableHead
                      key={header}
                      className={cn(
                        "text-center",
                        index === headers?.length - 1 && ""
                      )}
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.rows?.map((row, index) => (
                  <TableRow
                    key={row?.reason}
                  >
                    {Object.entries(row).slice(1).map(([key, value], index) => (
                      <TableCell
                        key={key}
                        className={cn(
                          "text-center font-bold",
                          index === headers?.length - 1 && "bg-border"
                        )}
                      >
                        {value ?? 0}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* Total Row */}
                {data?.total && (
                  <TableRow className="border-foreground-subtle">
                    {Object.entries(data?.total).slice(1).map(([key, value], index) => (
                      <TableCell
                        key={key}
                        className={cn(
                          "text-center font-bold",
                          index === headers?.length - 1 && "bg-border"
                        )}
                      >
                        {value ?? 0}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

