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
        <Table bordered frame>
          {/* Table Header */}
          <TableHeader>
            {/* Main Header Row */}
            <TableRow>
              <TableHead
                rowSpan={2}
                className="text-left"
              >
                Депо
              </TableHead>
              <TableHead
                colSpan={3}
                className="text-center"
              >
                По отправлению
              </TableHead>
              <TableHead
                colSpan={3}
                className="text-center"
              >
                По проследованию
              </TableHead>
              <TableHead
                colSpan={3}
                className="text-center"
              >
                Всего
              </TableHead>
            </TableRow>
            {/* Sub-header Row */}
            <TableRow>
              <TableHead className="text-center">
                Количество
              </TableHead>
              <TableHead className="text-center">
                Время задержки
              </TableHead>
              <TableHead className="text-center">
                Ущерб
              </TableHead>
              <TableHead className="text-center">
                Количество
              </TableHead>
              <TableHead className="text-center">
                Время задержки
              </TableHead>
              <TableHead className="text-center">
                Ущерб
              </TableHead>
              <TableHead className="text-center">
                Количество
              </TableHead>
              <TableHead className="text-center">
                Время задержки
              </TableHead>
              <TableHead className="text-center">
                Ущерб
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading skeleton rows */}
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={index}
                
              >
                <TableCell>
                  <div className="h-4 bg-border rounded animate-pulse" />
                </TableCell>
                {Array.from({ length: 9 }).map((_, colIndex) => (
                  <TableCell
                    key={colIndex}
                  >
                    <div className="h-4 bg-border rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && data && (
        <Table bordered frame>
          {/* Table Header */}
          <TableHeader>
            {/* Main Header Row */}
            <TableRow>
              <TableHead
                rowSpan={2}
                className="text-left"
              >
                Депо
              </TableHead>
              <TableHead
                colSpan={3}
                className="text-center"
              >
                По отправлению
              </TableHead>
              <TableHead
                colSpan={3}
                className="text-center"
              >
                По проследованию
              </TableHead>
              <TableHead
                colSpan={3}
                className="text-center"
              >
                Всего
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center">
                Количество
              </TableHead>
              <TableHead className="text-center">
                Время задержки
              </TableHead>
              <TableHead className="text-center">
                Ущерб
              </TableHead>
              <TableHead className="text-center">
                Количество
              </TableHead>
              <TableHead className="text-center">
                Время задержки
              </TableHead>
              <TableHead className="text-center">
                Ущерб
              </TableHead>
              <TableHead className="text-center">
                Количество
              </TableHead>
              <TableHead className="text-center">
                Время задержки
              </TableHead>
              <TableHead className="text-center">
                Ущерб
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Data Rows */}
            {data?.rows?.map((row, index) => (
              <TableRow
                key={index}
                
              >
                <TableCell className="font-medium">
                  {row?.depo}
                </TableCell>
                {/* По отправлению */}
                <TableCell className="text-right">
                  {row?.po_otpravleniyu?.count}
                </TableCell>
                <TableCell className="text-right">
                  {row?.po_otpravleniyu?.total_delay_time}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row?.po_otpravleniyu?.total_damage)}
                </TableCell>
                {/* По проследованию */}
                <TableCell className="text-right">
                  {row?.po_prosledovaniyu?.count}
                </TableCell>
                <TableCell className="text-right">
                  {row?.po_prosledovaniyu?.total_delay_time}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row?.po_prosledovaniyu?.total_damage)}
                </TableCell>
                {/* Всего */}
                <TableCell className="text-right bg-border">
                  {row?.total?.count}
                </TableCell>
                <TableCell className="text-right bg-border">
                  {row?.total?.total_delay_time}
                </TableCell>
                <TableCell className="text-right bg-border">
                  {formatNumber(row?.total?.total_damage)}
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            {data?.total && (
              <TableRow className="border-foreground-subtle">
                <TableCell className="font-bold">
                  {data?.total?.depo}
                </TableCell>
                {/* По отправлению Total */}
                <TableCell className="text-right font-bold">
                  {data?.total?.po_otpravleniyu?.count}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {data?.total?.po_otpravleniyu?.total_delay_time}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatNumber(data?.total?.po_otpravleniyu?.total_damage)}
                </TableCell>
                {/* По проследованию Total */}
                <TableCell className="text-right font-bold">
                  {data?.total?.po_prosledovaniyu?.count}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {data?.total?.po_prosledovaniyu?.total_delay_time}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatNumber(data?.total?.po_prosledovaniyu?.total_damage)}
                </TableCell>
                {/* Всего Total */}
                <TableCell className="text-right font-bold">
                  {data?.total?.total?.count}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {data?.total?.total?.total_delay_time}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatNumber(data?.total?.total?.total_damage)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
