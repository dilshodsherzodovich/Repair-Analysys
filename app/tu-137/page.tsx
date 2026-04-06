"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { PageHeader } from "@/ui/page-header";
import { useTu137Records } from "@/api/hooks/use-tu137";
import { exportTu137ToDocx } from "@/lib/export-tu137-docx";
import { Button } from "@/ui/button";

import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
import { Input } from "@/ui/input";
import { formatDate } from "@/lib/utils";

const getProgressBgColor = (percent: number) => {
  if (percent < 50) return "bg-red-500";
  if (percent < 80) return "bg-amber-500";
  return "bg-emerald-500";
};

const getProgressTextColor = (percent: number) => {
  if (percent < 50) return "text-red-500";
  if (percent < 80) return "text-amber-500";
  return "text-emerald-500";
};

interface MashinistStats {
  id: number;
  fio: string;
  depo_name: string;
  total: number;
  open: number;
  solved: number;
  percent: number;
}

export default function Tu137Page() {
  const t = useTranslations("Tu137Page");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const pDepoId = currentUser?.emm_depo_id;

  const {
    data: apiResponse,
    isLoading,
    error,
  } = useTu137Records({
    p_depo_id: pDepoId,
  });

  if (!currentUser || !canAccessSection(currentUser, "tu-137")) {
    return <UnauthorizedPage />;
  }

  // Pre-process and group data
  const { globalStats, sortedMashinists, filteredMashinists } = useMemo(() => {
    const rawData = apiResponse?.data ?? [];

    // Total aggregate maps
    let totalRecords = rawData.length;
    let totalOpen = 0;
    let totalSolved = 0;

    const mashinistMap = new Map<string, MashinistStats>();

    rawData.forEach((record) => {
      // 4 is considered solved based on user's input, everything else is open
      const isSolved = record.status_id === 4;
      if (isSolved) {
        totalSolved++;
      } else {
        totalOpen++;
      }

      // Group by Mashinist ID or Name, if ID doesn't exist, use FIO
      const mKey = String(record.mashinist_id || record.mashinist_fio);
      if (!mashinistMap.has(mKey)) {
        mashinistMap.set(mKey, {
          id: record.mashinist_id,
          fio: record.mashinist_fio || "Noma'lum",
          depo_name: record.depo_name || "Noma'lum",
          total: 0,
          open: 0,
          solved: 0,
          percent: 0,
        });
      }

      const mData = mashinistMap.get(mKey)!;
      mData.total++;
      if (isSolved) {
        mData.solved++;
      } else {
        mData.open++;
      }
    });

    const mashinistArray = Array.from(mashinistMap.values()).map((m) => {
      return {
        ...m,
        percent: m.total > 0 ? Math.round((m.solved / m.total) * 100) : 0,
      };
    });

    const sortedMashinists = [...mashinistArray].sort(
      (a, b) => b.total - a.total,
    );

    // Filter by query
    const filteredMashinists = sortedMashinists.filter((m) =>
      m.fio.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return {
      globalStats: {
        mashinistsCount: mashinistArray.length,
        totalRecords,
        totalOpen,
        totalSolved,
        overallPercent:
          totalRecords > 0 ? Math.round((totalSolved / totalRecords) * 100) : 0,
      },
      sortedMashinists,
      filteredMashinists,
    };
  }, [apiResponse, searchQuery]);

  const breadcrumbs = [
    { label: t("breadcrumbs_home"), href: "/" },
    { label: t("title"), current: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PageHeader
        title={t("title")}
        description={""}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-6 space-y-6">
        {/* Actions / Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-slate-200 text-slate-800"
            />
          </div>
          <Button
            onClick={() =>
              apiResponse?.data ? exportTu137ToDocx(apiResponse.data) : null
            }
            disabled={isLoading || !apiResponse?.data?.length}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Eksport (Docx)</span>
          </Button>
        </div>

        {/* Global Stats Cards */}
        {isLoading ? (
          <div className="text-sm text-slate-500">Yuklanmoqda...</div>
        ) : error ? (
          <div className="text-sm text-red-500">
            Xatolik yuz berdi: {(error as Error).message}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  {t("mashinists_count")}
                </p>
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-black text-slate-800 mt-2">
                {globalStats.mashinistsCount}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  {t("total_records")}
                </p>
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-black text-slate-800 mt-2">
                {globalStats.totalRecords}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold text-amber-500 tracking-wider uppercase">
                  {t("open_records")}
                </p>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-500 mt-2">
                {globalStats.totalOpen}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold text-emerald-500 tracking-wider uppercase">
                  {t("solved_records")}
                </p>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="mt-2">
                <p className="text-3xl font-black text-emerald-600">
                  {globalStats.totalSolved}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${globalStats.overallPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    {globalStats.overallPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Mashinists Grid */}
        {!isLoading && !error && (
          <div>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                {t("top_mashinists")}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredMashinists.slice(0, 8).map((mashinist, idx) => (
                <div
                  key={mashinist.id || idx}
                  className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-full hover:border-slate-300 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-slate-800 text-sm truncate"
                          title={mashinist.fio}
                        >
                          {mashinist.fio}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {mashinist.depo_name}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-2xl font-black text-slate-800 leading-none">
                        {mashinist.total}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-amber-500">
                        {t("open").slice(0, 4)}: {mashinist.open}
                      </span>
                      <span className="text-emerald-500">
                        {t("solved").slice(0, 3)}: {mashinist.solved}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressBgColor(mashinist.percent)}`}
                          style={{ width: `${mashinist.percent}%` }}
                        />
                        <div
                          className="bg-slate-200 h-full transition-all duration-500"
                          style={{ width: `${100 - mashinist.percent}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold w-8 text-right block ${getProgressTextColor(mashinist.percent)}`}
                      >
                        {mashinist.percent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mashinists Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{t("mashinist")}</th>
                    <th className="px-6 py-4 text-center">{t("records")}</th>
                    <th className="px-6 py-4 text-center">{t("open")}</th>
                    <th className="px-6 py-4 text-center">{t("solved")}</th>
                    <th className="px-6 py-4 text-right">
                      {t("percent_solved")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMashinists.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        {t("no_data")}
                      </td>
                    </tr>
                  ) : (
                    filteredMashinists.map((mashinist, idx) => {
                      const matchKey = String(mashinist.id || mashinist.fio);
                      const isExpanded = expandedRow === matchKey;

                      return (
                        <React.Fragment key={matchKey}>
                          <tr
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : matchKey)
                            }
                          >
                            <td className="px-6 py-3 flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                              )}
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? "bg-indigo-100" : "bg-slate-100 group-hover:bg-slate-200"}`}
                              >
                                <Users
                                  className={`w-3 h-3 ${isExpanded ? "text-indigo-600" : "text-slate-500"}`}
                                />
                              </div>
                              <span
                                className={`font-medium transition-colors ${isExpanded ? "text-indigo-700" : "text-slate-800"}`}
                              >
                                {mashinist.fio}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-center font-bold text-slate-800">
                              {mashinist.total}
                            </td>
                            <td className="px-6 py-3 text-center font-bold text-amber-500">
                              {mashinist.open}
                            </td>
                            <td className="px-6 py-3 text-center font-bold text-emerald-500">
                              {mashinist.solved}
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                                  <div
                                    className={`h-full ${getProgressBgColor(mashinist.percent)}`}
                                    style={{ width: `${mashinist.percent}%` }}
                                  />
                                  <div
                                    className="bg-slate-200 h-full"
                                    style={{
                                      width: `${100 - mashinist.percent}%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={`text-xs font-semibold block w-8 text-right ${getProgressTextColor(mashinist.percent)}`}
                                >
                                  {mashinist.percent}%
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/40 border-b border-t border-slate-100">
                              <td colSpan={5} className="p-4 sm:p-6">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                  <table className="w-full text-left text-xs sm:text-sm whitespace-normal">
                                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-xs border-b border-slate-200">
                                      <tr>
                                        <th className="px-4 py-3">
                                          {t("table_number")}
                                        </th>
                                        <th className="px-4 py-3">
                                          {t("table_lokomotiv")}
                                        </th>
                                        <th className="px-4 py-3">
                                          {t("table_station")}
                                        </th>
                                        <th className="px-4 py-3">
                                          {t("table_date")}
                                        </th>
                                        <th className="px-4 py-3 max-w-lg">
                                          {t("table_comment")}
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                          {t("table_status")}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {apiResponse?.data
                                        ?.filter(
                                          (r) =>
                                            String(
                                              r.mashinist_id || r.mashinist_fio,
                                            ) === matchKey,
                                        )
                                        .map((record) => (
                                          <tr
                                            key={record.id}
                                            className="hover:bg-slate-50 transition-colors"
                                          >
                                            <td className="px-4 py-3 font-medium text-slate-500">
                                              #{record.id}
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="font-semibold text-slate-700">
                                                {record.lokomotiv_name}
                                              </div>
                                              {record.poezd_number && (
                                                <div className="text-slate-500 text-xs mt-0.5">
                                                  №{record.poezd_number}
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="font-medium text-slate-800">
                                                {record.group_name}
                                              </div>
                                              <div className="text-slate-500 text-xs mt-0.5">
                                                {record.station_name}{" "}
                                                {record.station2_name
                                                  ? `- ${record.station2_name}`
                                                  : ""}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                              {formatDate(record.create_date)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 whitespace-pre-wrap max-w-lg">
                                              {record.comments}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span
                                                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                  record.status_id === 4
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    : "bg-amber-50 text-amber-600 border-amber-200"
                                                }`}
                                              >
                                                {record.status_name}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
