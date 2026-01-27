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

  const activeServiceType = serviceTypeParam || "passenger";

  const params = useMemo(() => {
    if (!start_date || !end_date) return undefined;

    return {
      start_date,
      end_date,
      organizations: organizationsParam,
      train_type: activeServiceType,
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
          title="Xatolik yuz berdi"
          message={error.message || "Xatolik yuz berdi"}
          onRetry={() => { }}
          showRetry={false}
          showBack={false}
          className="mb-4"
        />
      )}

      {isLoading && (
        <div className="mt-6 bg-white rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  {Array.from({ length: skeletonColumnCount }).map((_, index) => (
                    <th
                      key={index}
                      className={cn(
                        "border border-gray-300 px-4 py-3 text-center font-semibold text-sm",
                        index === skeletonColumnCount - 1 && "bg-gray-200"
                      )}
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "border-b border-gray-200",
                      rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    )}
                  >
                    {Array.from({ length: skeletonColumnCount }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className={cn(
                          "border border-gray-300 px-4 py-3 text-center",
                          colIndex === skeletonColumnCount - 1 && "bg-gray-200"
                        )}
                      >
                        <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-12" />
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Skeleton Total Row */}
                <tr className="bg-gray-200 border-t-2 border-gray-400">
                  {Array.from({ length: skeletonColumnCount }).map((_, colIndex) => (
                    <td
                      key={colIndex}
                      className={cn(
                        "border border-gray-300 px-4 py-3 text-center",
                        colIndex === skeletonColumnCount - 1 && "bg-gray-200"
                      )}
                    >
                      <div className="h-4 bg-gray-300 rounded animate-pulse mx-auto w-12" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="mt-6 bg-white rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  {headers?.map((header, index) => (
                    <th
                      key={header}
                      className={cn(
                        "border border-gray-300 px-4 py-3 text-center font-semibold text-sm",
                        index === headers?.length - 1 && "bg-gray-200"
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
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    {Object.entries(row).slice(1).map(([key, value], index) => (
                      <td
                        key={key}
                        className={cn(
                          "border border-gray-300 px-4 py-3 text-sm text-center font-bold",
                          index === headers?.length - 1 && "bg-gray-200"
                        )}
                      >
                        {value ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Total Row */}
                {data?.total && (
                  <tr className="bg-gray-200 border-t-2 border-gray-400 font-semibold">
                    {Object.entries(data?.total).slice(1).map(([key, value], index) => (
                      <td
                        key={key}
                        className={cn(
                          "border border-gray-300 px-4 py-3 text-sm text-center font-bold",
                          index === headers?.length - 1 && "bg-gray-200"
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

