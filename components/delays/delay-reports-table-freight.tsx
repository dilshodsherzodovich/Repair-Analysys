"use client";

import { useCallback } from "react";
import { DelayReportFreightResponse } from "@/api/types/delays";
import { ErrorState, EmptyState } from "@/ui/empty-state";
import { DepotReasonReportsTable } from "./depot-reason-reports-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

import { Skeleton } from "@/ui/skeleton";
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
        <ErrorState message={error.message} />
      )}

      {isLoading && (
        <Table bordered density="compact" frame>
          {/* Table Header */}
          <TableHeader>
            {/* Main Header Row */}
            <TableRow>
              <TableHead
                rowSpan={3}
                className="text-left"
              >
                ДЕПО
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
              <TableHead
                colSpan={6}
                className="text-center"
              >
                В том числе:
              </TableHead>
            </TableRow>
            {/* Second-level Header Row */}
            <TableRow>
              <TableHead rowSpan={2} className="text-center">
                Кол-во
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Время
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Сумма
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Кол-во
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Время
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Сумма
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Кол-во
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Время
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Сумма
              </TableHead>
              <TableHead
                colSpan={2}
                className="text-center"
              >
                нет электровоза
              </TableHead>
              <TableHead
                colSpan={2}
                className="text-center"
              >
                нет тепловоза
              </TableHead>
              <TableHead
                colSpan={2}
                className="text-center"
              >
                по вине депо
              </TableHead>
            </TableRow>
            {/* Third-level Header Row */}
            <TableRow>
              <TableHead className="text-center">
                Кол-во
              </TableHead>
              <TableHead className="text-center">
                Время
              </TableHead>
              <TableHead className="text-center">
                Кол-во
              </TableHead>
              <TableHead className="text-center">
                Время
              </TableHead>
              <TableHead className="text-center">
                Кол-во
              </TableHead>
              <TableHead className="text-center">
                Время
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
                  <Skeleton className="h-4" />
                </TableCell>
                {Array.from({ length: 15 }).map((_, colIndex) => (
                  <TableCell
                    key={colIndex}
                  >
                    <Skeleton className="h-4" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && data && (
        <Table bordered density="compact" frame>
          {/* Table Header */}
          <TableHeader>
            {/* Main Header Row */}
            <TableRow>
              <TableHead
                rowSpan={3}
                className="text-left"
              >
                ДЕПО
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
              <TableHead
                colSpan={6}
                className="text-center"
              >
                В том числе:
              </TableHead>
            </TableRow>
            {/* Second-level Header Row */}
            <TableRow>
              <TableHead rowSpan={2} className="text-center">
                Кол-во
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Время
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Сумма
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Кол-во
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Время
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Сумма
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Кол-во
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Время
              </TableHead>
              <TableHead rowSpan={2} className="text-center">
                Сумма
              </TableHead>
              <TableHead
                colSpan={2}
                className="text-center"
              >
                нет электровоза
              </TableHead>
              <TableHead
                colSpan={2}
                className="text-center"
              >
                нет тепловоза
              </TableHead>
              <TableHead
                colSpan={2}
                className="text-center"
              >
                по вине депо
              </TableHead>
            </TableRow>
            {/* Third-level Header Row */}
            <TableRow>
              <TableHead className="text-center">
                Кол-во
              </TableHead>
              <TableHead className="text-center">
                Время
              </TableHead>
              <TableHead className="text-center">
                Кол-во
              </TableHead>
              <TableHead className="text-center">
                Время
              </TableHead>
              <TableHead className="text-center">
                Кол-во
              </TableHead>
              <TableHead className="text-center">
                Время
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
                <TableCell className="text-right bg-surface-muted font-semibold">
                  {row?.total?.count}
                </TableCell>
                <TableCell className="text-right bg-surface-muted font-semibold">
                  {row?.total?.total_delay_time}
                </TableCell>
                <TableCell className="text-right bg-surface-muted font-semibold">
                  {formatNumber(row?.total?.total_damage)}
                </TableCell>
                {/* В том числе: нет электровоза */}
                <TableCell className="text-right">
                  {row?.v_tom_chisle?.net_elektrovaza?.count}
                </TableCell>
                <TableCell className="text-right">
                  {row?.v_tom_chisle?.net_elektrovaza?.total_delay_time}
                </TableCell>
                {/* В том числе: нет тепловоза */}
                <TableCell className="text-right">
                  {row?.v_tom_chisle?.net_teplovaza?.count}
                </TableCell>
                <TableCell className="text-right">
                  {row?.v_tom_chisle?.net_teplovaza?.total_delay_time}
                </TableCell>
                {/* В том числе: по вине депо */}
                <TableCell className="text-right bg-surface-muted font-semibold">
                  {row?.v_tom_chisle?.po_vine_depo?.count}
                </TableCell>
                <TableCell className="text-right bg-surface-muted font-semibold">
                  {row?.v_tom_chisle?.po_vine_depo?.total_delay_time}
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
                {/* В том числе: нет электровоза Total */}
                <TableCell className="text-right font-bold">
                  {data?.total?.v_tom_chisle?.net_elektrovaza?.count}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {data?.total?.v_tom_chisle?.net_elektrovaza?.total_delay_time}
                </TableCell>
                {/* В том числе: нет тепловоза Total */}
                <TableCell className="text-right font-bold">
                  {data?.total?.v_tom_chisle?.net_teplovaza?.count}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {data?.total?.v_tom_chisle?.net_teplovaza?.total_delay_time}
                </TableCell>
                {/* В том числе: по вине депо Total */}
                <TableCell className="text-right font-bold">
                  {data?.total?.v_tom_chisle?.po_vine_depo?.count}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {data?.total?.v_tom_chisle?.po_vine_depo?.total_delay_time}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <DepotReasonReportsTable />

      {!isLoading && !error && !data && startDate && endDate && (
        <div className="bg-background rounded-lg p-8 text-center">
          <EmptyState />
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
