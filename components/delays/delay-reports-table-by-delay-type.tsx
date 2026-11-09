"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { DelayReportResponse } from "@/api/types/delays";
import { ErrorCard } from "@/ui/error-card";
import { DepotReasonReportsTable } from "./depot-reason-reports-table";

interface DelayReportsTableByDelayTypeProps {
  data: DelayReportResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  startDate: Date | undefined;
  endDate: Date | undefined;
  start_date?: string;
  end_date?: string;
}

export function DelayReportsTableByDelayType({
  data,
  isLoading,
  error,
  startDate,
  endDate,
  start_date,
  end_date,
}: DelayReportsTableByDelayTypeProps) {
  // Format number with comma as decimal separator
  const formatNumber = useCallback((num: number) => {
    return num?.toFixed(1)?.replace(".", ",");
  }, []);

  return (
    <div className="px-6 pb-6">
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
        <div className="bg-background border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                {/* Main Header Row */}
                <tr className="border-b-1 border-border-strong">
                  <th
                    rowSpan={2}
                    className="border border-border-strong px-4 py-3 text-left font-semibold text-sm bg-muted"
                  >
                    Депо
                  </th>
                  <th
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    По отправлению
                  </th>
                  <th
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    По проследованию
                  </th>
                  <th
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-border"
                  >
                    Всего
                  </th>
                </tr>
                {/* Sub-header Row */}
                <tr className="bg-surface-muted border-b border-border-strong">
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Количество
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Время задержки
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Ущерб
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Loading skeleton rows */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-b border-border",
                      index % 2 === 0 ? "bg-background" : "bg-surface-muted/50"
                    )}
                  >
                    <td className="border border-border-strong px-4 py-3">
                      <div className="h-4 bg-border rounded animate-pulse" />
                    </td>
                    {Array.from({ length: 9 }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-border-strong px-4 py-3"
                      >
                        <div className="h-4 bg-border rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="bg-background border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                {/* Main Header Row */}
                <tr className="bg-muted border-b-1 border-border-strong">
                  <th
                    rowSpan={2}
                    className="border border-border-strong px-4 py-3 text-left font-semibold text-sm bg-muted"
                  >
                    Депо
                  </th>
                  <th
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    По отправлению
                  </th>
                  <th
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    По проследованию
                  </th>
                  <th
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-border"
                  >
                    Всего
                  </th>
                </tr>
                <tr className="bg-surface-muted border-b border-border-strong">
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Количество
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Время задержки
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Ущерб
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Data Rows */}
                {data?.rows?.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-b border-border hover:bg-surface-muted",
                      index % 2 === 0 ? "bg-background" : "bg-surface-muted/50"
                    )}
                  >
                    <td className="border border-border-strong px-4 py-2 text-sm font-medium">
                      {row?.depo}
                    </td>
                    {/* По отправлению */}
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.po_otpravleniyu?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.po_otpravleniyu?.total_delay_time}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {formatNumber(row?.po_otpravleniyu?.total_damage)}
                    </td>
                    {/* По проследованию */}
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.po_prosledovaniyu?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.po_prosledovaniyu?.total_delay_time}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {formatNumber(row?.po_prosledovaniyu?.total_damage)}
                    </td>
                    {/* Всего */}
                    <td className="border border-border-strong px-4 py-2 text-sm text-right bg-border">
                      {row?.total?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right bg-border">
                      {row?.total?.total_delay_time}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right bg-border">
                      {formatNumber(row?.total?.total_damage)}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                {data?.total && (
                  <tr className="bg-border border-t-2 border-foreground-subtle font-semibold">
                    <td className="border border-border-strong px-4 py-3 text-sm font-bold">
                      {data?.total?.depo}
                    </td>
                    {/* По отправлению Total */}
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_otpravleniyu?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_otpravleniyu?.total_delay_time}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.po_otpravleniyu?.total_damage)}
                    </td>
                    {/* По проследованию Total */}
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_prosledovaniyu?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_prosledovaniyu?.total_delay_time}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.po_prosledovaniyu?.total_damage)}
                    </td>
                    {/* Всего Total */}
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.total?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.total?.total_delay_time}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.total?.total_damage)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      <DepotReasonReportsTable />


      {!isLoading && !error && !data && startDate && endDate && (
        <div className="bg-background border rounded-lg p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Данные не найдены. Пожалуйста, выберите другой диапазон дат.
          </p>
        </div>
      )}

      {!isLoading && !error && !startDate && !endDate && !start_date && !end_date && (
        <div className="bg-background border rounded-lg p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Для просмотра отчета выберите дату начала и окончания.
          </p>
        </div>
      )}
    </div>
  );
}
