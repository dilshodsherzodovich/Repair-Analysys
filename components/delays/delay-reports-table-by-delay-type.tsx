"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { DelayReportResponse } from "@/api/types/delays";
import { ErrorCard } from "@/ui/error-card";

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
          title="Xatolik yuz berdi"
          message={error.message || "Xatolik yuz berdi"}
          onRetry={() => {}}
          showRetry={false}
          showBack={false}
          className="mb-4"
        />
      )}

      {isLoading && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                {/* Main Header Row */}
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th
                    rowSpan={2}
                    className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm bg-gray-100"
                  >
                    Депо
                  </th>
                  <th
                    colSpan={3}
                    className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm bg-gray-100"
                  >
                    По отправлению
                  </th>
                  <th
                    colSpan={3}
                    className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm bg-gray-100"
                  >
                    По проследованию
                  </th>
                  <th
                    colSpan={3}
                    className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm bg-gray-100"
                  >
                    Всего
                  </th>
                </tr>
                {/* Sub-header Row */}
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
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
                      "border-b border-gray-200",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    )}
                  >
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                    {Array.from({ length: 9 }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-gray-300 px-4 py-3"
                      >
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
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
        <div className="bg-white border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                {/* Main Header Row */}
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th
                    rowSpan={2}
                    className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm bg-gray-100"
                  >
                    Депо
                  </th>
                  <th
                    colSpan={3}
                    className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm bg-gray-100"
                  >
                    По отправлению
                  </th>
                  <th
                    colSpan={3}
                    className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm bg-gray-100"
                  >
                    По проследованию
                  </th>
                  <th
                    colSpan={3}
                    className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm bg-gray-100"
                  >
                    Всего
                  </th>
                </tr>
                {/* Sub-header Row */}
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Ущерб
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Количество
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
                    Время задержки
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-medium text-xs">
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
                      "border-b border-gray-200 hover:bg-gray-50",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    )}
                  >
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium">
                      {row?.depo}
                    </td>
                    {/* По отправлению */}
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {row?.po_otpravleniyu?.count}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {row?.po_otpravleniyu?.total_delay_time}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatNumber(row?.po_otpravleniyu?.total_damage)}
                    </td>
                    {/* По проследованию */}
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {row?.po_prosledovaniyu?.count}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {row?.po_prosledovaniyu?.total_delay_time}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatNumber(row?.po_prosledovaniyu?.total_damage)}
                    </td>
                    {/* Всего */}
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {row?.total?.count}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {row?.total?.total_delay_time}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatNumber(row?.total?.total_damage)}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                {data?.total && (
                  <tr className="bg-gray-200 border-t-2 border-gray-400 font-semibold">
                    <td className="border border-gray-300 px-4 py-3 text-sm font-bold">
                      {data?.total?.depo}
                    </td>
                    {/* По отправлению Total */}
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_otpravleniyu?.count}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_otpravleniyu?.total_delay_time}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.po_otpravleniyu?.total_damage)}
                    </td>
                    {/* По проследованию Total */}
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_prosledovaniyu?.count}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.po_prosledovaniyu?.total_delay_time}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.po_prosledovaniyu?.total_damage)}
                    </td>
                    {/* Всего Total */}
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.total?.count}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {data?.total?.total?.total_delay_time}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                      {formatNumber(data?.total?.total?.total_damage)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !error && !data && startDate && endDate && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">
            Ma'lumotlar topilmadi. Iltimos, boshqa sana oralig'ini tanlang.
          </p>
        </div>
      )}

      {!isLoading && !error && !startDate && !endDate && !start_date && !end_date && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">
            Hisobotni ko'rish uchun boshlanish va tugash sanalarini tanlang.
          </p>
        </div>
      )}
    </div>
  );
}
