"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { DelayReportResponse } from "@/api/types/delays";
import { ErrorCard } from "@/ui/error-card";
import { DepotReasonReportsTable } from "./depot-reason-reports-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

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
            <Table wrapper={false} className="w-full border-collapse">
              {/* Table Header */}
              <TableHeader>
                {/* Main Header Row */}
                <TableRow className="border-b-1 border-border-strong">
                  <TableHead
                    rowSpan={2}
                    className="border border-border-strong px-4 py-3 text-left font-semibold text-sm bg-muted"
                  >
                    Депо
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    По отправлению
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    По проследованию
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-border"
                  >
                    Всего
                  </TableHead>
                </TableRow>
                {/* Sub-header Row */}
                <TableRow className="bg-surface-muted border-b border-border-strong">
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Количество
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Время задержки
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Ущерб
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Loading skeleton rows */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      "border-b border-border",
                      index % 2 === 0 ? "bg-background" : "bg-surface-muted/50"
                    )}
                  >
                    <TableCell className="border border-border-strong px-4 py-3">
                      <div className="h-4 bg-border rounded animate-pulse" />
                    </TableCell>
                    {Array.from({ length: 9 }).map((_, colIndex) => (
                      <TableCell
                        key={colIndex}
                        className="border border-border-strong px-4 py-3"
                      >
                        <div className="h-4 bg-border rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="bg-background border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table wrapper={false} className="w-full border-collapse">
              {/* Table Header */}
              <TableHeader>
                {/* Main Header Row */}
                <TableRow className="bg-muted border-b-1 border-border-strong">
                  <TableHead
                    rowSpan={2}
                    className="border border-border-strong px-4 py-3 text-left font-semibold text-sm bg-muted"
                  >
                    Депо
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    По отправлению
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-muted"
                  >
                    По проследованию
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border border-border-strong px-4 py-3 text-center font-semibold text-sm bg-border"
                  >
                    Всего
                  </TableHead>
                </TableRow>
                <TableRow className="bg-surface-muted border-b border-border-strong">
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Количество
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Время задержки
                  </TableHead>
                  <TableHead className="border border-border-strong px-4 py-2 text-center font-medium text-xs bg-border">
                    Ущерб
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Data Rows */}
                {data?.rows?.map((row, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      "border-b border-border hover:bg-surface-muted",
                      index % 2 === 0 ? "bg-background" : "bg-surface-muted/50"
                    )}
                  >
                    <TableCell className="border border-border-strong px-4 py-2 text-sm font-medium">
                      {row?.depo}
                    </TableCell>
                    {/* По отправлению */}
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.po_otpravleniyu?.count}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.po_otpravleniyu?.total_delay_time}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right">
                      {formatNumber(row?.po_otpravleniyu?.total_damage)}
                    </TableCell>
                    {/* По проследованию */}
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.po_prosledovaniyu?.count}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right">
                      {row?.po_prosledovaniyu?.total_delay_time}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right">
                      {formatNumber(row?.po_prosledovaniyu?.total_damage)}
                    </TableCell>
                    {/* Всего */}
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right bg-border">
                      {row?.total?.count}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right bg-border">
                      {row?.total?.total_delay_time}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-2 text-sm text-right bg-border">
                      {formatNumber(row?.total?.total_damage)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                {data?.total && (
                  <TableRow className="bg-border border-t-2 border-foreground-subtle font-semibold">
                    <TableCell className="border border-border-strong px-4 py-3 text-sm font-bold">
                      {data?.total?.depo}
                    </TableCell>
                    {/* По отправлению Total */}
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_otpravleniyu?.count}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_otpravleniyu?.total_delay_time}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.po_otpravleniyu?.total_damage)}
                    </TableCell>
                    {/* По проследованию Total */}
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_prosledovaniyu?.count}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_prosledovaniyu?.total_delay_time}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.po_prosledovaniyu?.total_damage)}
                    </TableCell>
                    {/* Всего Total */}
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.total?.count}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.total?.total_delay_time}
                    </TableCell>
                    <TableCell className="border border-border-strong px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.total?.total_damage)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
