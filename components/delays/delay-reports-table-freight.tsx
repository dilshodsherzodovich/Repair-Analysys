"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { DelayReportFreightResponse } from "@/api/types/delays";
import { ErrorCard } from "@/ui/error-card";
import { DepotReasonReportsTable } from "./depot-reason-reports-table";

interface DelayReportsTableFreightProps {
  data: DelayReportFreightResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  startDate: Date | undefined;
  endDate: Date | undefined;
  start_date?: string;
  end_date?: string;
}

export function DelayReportsTableFreight({
  data,
  isLoading,
  error,
  startDate,
  endDate,
  start_date,
  end_date,
}: DelayReportsTableFreightProps) {
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
        <div className="bg-background rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                {/* Main Header Row */}
                <tr className="bg-muted border-b-1 border-border-strong">
                  <th
                    rowSpan={3}
                    className="border border-border-strong px-4 py-3 text-left font-semibold text-sm bg-muted"
                  >
                    ДЕПО
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
                  <th
                    colSpan={6}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    В том числе:
                  </th>
                </tr>
                {/* Second-level Header Row */}
                <tr className="border-b border-border-strong">
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Кол-во
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Время
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Сумма
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Кол-во
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Время
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Сумма
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Кол-во
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Время
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Сумма
                  </th>
                  <th
                    colSpan={2}
                    className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted"
                  >
                    нет электровоза
                  </th>
                  <th
                    colSpan={2}
                    className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted"
                  >
                    нет тепловоза
                  </th>
                  <th
                    colSpan={2}
                    className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted"
                  >
                    по вине депо
                  </th>
                </tr>
                {/* Third-level Header Row */}
                <tr className="bg-surface-muted border-b border-border-strong">
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Кол-во
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Кол-во
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Кол-во
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время
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
                    {Array.from({ length: 15 }).map((_, colIndex) => (
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
        <div className="bg-background rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                {/* Main Header Row */}
                <tr className="bg-muted border-b-1 border-border-strong">
                  <th
                    rowSpan={3}
                    className="border border-border-strong px-4 py-3 text-left font-semibold text-sm bg-muted"
                  >
                    ДЕПО
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
                  <th
                    colSpan={6}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    В том числе:
                  </th>
                </tr>
                {/* Second-level Header Row */}
                <tr className="bg-muted border-b border-border-strong">
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Кол-во
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Время
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Сумма
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Кол-во
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Время
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted">
                    Сумма
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Кол-во
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Время
                  </th>
                  <th rowSpan={2} className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Сумма
                  </th>
                  <th
                    colSpan={2}
                    className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted"
                  >
                    нет электровоза
                  </th>
                  <th
                    colSpan={2}
                    className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-muted"
                  >
                    нет тепловоза
                  </th>
                  <th
                    colSpan={2}
                    className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border"
                  >
                    по вине депо
                  </th>
                </tr>
                {/* Third-level Header Row */}
                <tr className="bg-surface-muted border-b border-border-strong">
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Кол-во
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Кол-во
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Кол-во
                  </th>
                  <th className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Время
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
                    {/* В том числе: нет электровоза */}
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.v_tom_chisle?.net_elektrovaza?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.v_tom_chisle?.net_elektrovaza?.total_delay_time}
                    </td>
                    {/* В том числе: нет тепловоза */}
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.v_tom_chisle?.net_teplovaza?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.v_tom_chisle?.net_teplovaza?.total_delay_time}
                    </td>
                    {/* В том числе: по вине депо */}
                    <td className="border border-border-strong px-4 py-2 text-sm text-right bg-border">
                      {row?.v_tom_chisle?.po_vine_depo?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-2 text-sm text-right bg-border">
                      {row?.v_tom_chisle?.po_vine_depo?.total_delay_time}
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
                    {/* В том числе: нет электровоза Total */}
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.v_tom_chisle?.net_elektrovaza?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.v_tom_chisle?.net_elektrovaza?.total_delay_time}
                    </td>
                    {/* В том числе: нет тепловоза Total */}
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.v_tom_chisle?.net_teplovaza?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.v_tom_chisle?.net_teplovaza?.total_delay_time}
                    </td>
                    {/* В том числе: по вине депо Total */}
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.v_tom_chisle?.po_vine_depo?.count}
                    </td>
                    <td className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.v_tom_chisle?.po_vine_depo?.total_delay_time}
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
        <div className="bg-background rounded-lg p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Данные не найдены. Пожалуйста, выберите другой диапазон дат.
          </p>
        </div>
      )}

      {!isLoading && !error && !startDate && !endDate && !start_date && !end_date && (
        <div className="bg-background rounded-lg p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Для просмотра отчета выберите дату начала и окончания.
          </p>
        </div>
      )}
    </div>
  );
}
