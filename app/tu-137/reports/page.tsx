"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../../unauthorized/page";
import { PageHeader } from "@/ui/page-header";
import { useTu137Records } from "@/api/hooks/use-tu137";
import { exportTu137ToDocx } from "@/lib/export-tu137-docx";
import { Button } from "@/ui/button";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

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
import { authService, getEmmDepoId } from "@/api/services/auth.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

const getProgressBgColor = (percent: number) => {
  if (percent < 50) return "bg-destructive";
  if (percent < 80) return "bg-warning";
  return "bg-success";
};

const getProgressTextColor = (percent: number) => {
  if (percent < 50) return "text-destructive";
  if (percent < 80) return "text-warning";
  return "text-success";
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

export default function Tu137ReportsPage() {
  const t = useTranslations("Tu137Page");
  const { getQueryValue, updateQuery } = useFilterParams();
  const searchQuery = getQueryValue("search");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const currentUser =
    authService.getUser();

  const pDepoId = getEmmDepoId(currentUser);

  const {
    data: apiResponse,
    isLoading,
    error,
  } = useTu137Records({
    depo_id: pDepoId,
    page: 1,
    page_size: 500,
  });

  if (!currentUser || !canAccessSection(currentUser, "tu-137")) {
    return <UnauthorizedPage />;
  }

  const { globalStats, filteredMashinists } = useMemo(() => {
    const rawData = apiResponse?.results ?? [];

    let totalOpen = 0;
    let totalSolved = 0;

    const mashinistMap = new Map<number, MashinistStats>();

    rawData.forEach((record) => {
      if (record.finished) {
        totalSolved++;
      } else {
        totalOpen++;
      }

      const mId = record.mashinist_id;
      if (!mashinistMap.has(mId)) {
        mashinistMap.set(mId, {
          id: mId,
          fio: record.create_user_fio || `#${mId}`,
          depo_name: record.resp_organization?.name || "—",
          total: 0,
          open: 0,
          solved: 0,
          percent: 0,
        });
      }

      const mData = mashinistMap.get(mId)!;
      mData.total++;
      if (record.finished) {
        mData.solved++;
      } else {
        mData.open++;
      }
    });

    const mashinistArray = Array.from(mashinistMap.values()).map((m) => ({
      ...m,
      percent: m.total > 0 ? Math.round((m.solved / m.total) * 100) : 0,
    }));

    const sorted = [...mashinistArray].sort((a, b) => b.total - a.total);

    const filtered = sorted.filter((m) =>
      m.fio.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return {
      globalStats: {
        mashinistsCount: mashinistArray.length,
        totalRecords: rawData.length,
        totalOpen,
        totalSolved,
        overallPercent:
          rawData.length > 0
            ? Math.round((totalSolved / rawData.length) * 100)
            : 0,
      },
      filteredMashinists: filtered,
    };
  }, [apiResponse, searchQuery]);

  const allRecords = apiResponse?.results ?? [];

  const breadcrumbs = [
    { label: t("breadcrumbs_home"), href: "/" },
    { label: t("title"), href: "/tu-137" },
    { label: t("reports_title"), current: true },
  ];

  return (
    <div className="min-h-screen bg-surface-muted pb-12">
      <PageHeader
        title={t("reports_title")}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-6 space-y-6">
        {/* Actions / Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-4 rounded-xl border border-border/60 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="w-full max-w-md">
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) =>
                  updateQuery({ search: e.target.value || null })
                }
                className="w-full bg-surface-muted border-border text-foreground mb-0"
              />
            </div>
          </div>
          <Button
            onClick={() => (allRecords.length ? exportTu137ToDocx(allRecords) : null)}
            disabled={isLoading || !allRecords.length}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("export_docx")}</span>
          </Button>
        </div>

        {/* Global Stats Cards */}
        {isLoading ? (
          <div className="text-sm text-muted-foreground">{t("loading")}</div>
        ) : error ? (
          <div className="text-sm text-destructive">
            {t("error")} {(error as Error).message}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-2xs font-bold text-muted-foreground tracking-wider uppercase">
                  {t("mashinists_count")}
                </p>
                <Users className="w-5 h-5 text-category-indigo/60" />
              </div>
              <p className="text-3xl font-bold text-foreground mt-2">
                {globalStats.mashinistsCount}
              </p>
            </div>

            <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-2xs font-bold text-muted-foreground tracking-wider uppercase">
                  {t("total_records")}
                </p>
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground mt-2">
                {globalStats.totalRecords}
              </p>
            </div>

            <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-2xs font-bold text-warning tracking-wider uppercase">
                  {t("open_records")}
                </p>
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <p className="text-3xl font-bold text-warning mt-2">
                {globalStats.totalOpen}
              </p>
            </div>

            <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-2xs font-bold text-success tracking-wider uppercase">
                  {t("solved_records")}
                </p>
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold text-success">
                  {globalStats.totalSolved}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-success h-full rounded-full"
                      style={{ width: `${globalStats.overallPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground-secondary">
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
              <h2 className="text-sm font-bold text-foreground-secondary uppercase tracking-widest">
                {t("top_mashinists")}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredMashinists.slice(0, 8).map((mashinist, idx) => (
                <div
                  key={mashinist.id}
                  className="bg-background p-4 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between h-full hover:border-border-strong transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-foreground text-sm truncate"
                          title={mashinist.fio}
                        >
                          {mashinist.fio}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {mashinist.depo_name}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-2xl font-bold text-foreground leading-none">
                        {mashinist.total}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-warning">
                        {t("open").slice(0, 4)}: {mashinist.open}
                      </span>
                      <span className="text-success">
                        {t("solved").slice(0, 3)}: {mashinist.solved}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressBgColor(mashinist.percent)}`}
                          style={{ width: `${mashinist.percent}%` }}
                        />
                        <div
                          className="bg-border h-full transition-all duration-500"
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
          <div className="bg-background rounded-xl border border-border/60 shadow-sm overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <Table wrapper={false} className="w-full text-left text-sm whitespace-nowrap">
                <TableHeader className="bg-surface-muted border-b border-border text-muted-foreground font-bold uppercase text-2xs tracking-wider">
                  <TableRow>
                    <TableHead className="px-6 py-4">{t("mashinist")}</TableHead>
                    <TableHead className="px-6 py-4 text-center">{t("records")}</TableHead>
                    <TableHead className="px-6 py-4 text-center">{t("open")}</TableHead>
                    <TableHead className="px-6 py-4 text-center">{t("solved")}</TableHead>
                    <TableHead className="px-6 py-4 text-right">
                      {t("percent_solved")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-muted text-foreground-secondary">
                  {filteredMashinists.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        {t("no_data")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMashinists.map((mashinist) => {
                      const matchKey = String(mashinist.id);
                      const isExpanded = expandedRow === matchKey;

                      return (
                        <React.Fragment key={matchKey}>
                          <TableRow
                            className="hover:bg-surface-muted/80 transition-colors cursor-pointer group"
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : matchKey)
                            }
                          >
                            <TableCell className="px-6 py-3 flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground-secondary transition-colors" />
                              )}
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? "bg-category-indigo/15" : "bg-muted group-hover:bg-border"}`}
                              >
                                <Users
                                  className={`w-3 h-3 ${isExpanded ? "text-category-indigo" : "text-muted-foreground"}`}
                                />
                              </div>
                              <span
                                className={`font-medium transition-colors ${isExpanded ? "text-category-indigo" : "text-foreground"}`}
                              >
                                {mashinist.fio}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center font-bold text-foreground">
                              {mashinist.total}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center font-bold text-warning">
                              {mashinist.open}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center font-bold text-success">
                              {mashinist.solved}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden flex">
                                  <div
                                    className={`h-full ${getProgressBgColor(mashinist.percent)}`}
                                    style={{ width: `${mashinist.percent}%` }}
                                  />
                                  <div
                                    className="bg-border h-full"
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
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow className="bg-surface-muted/40 border-b border-t border-muted">
                              <TableCell colSpan={5} className="p-4 sm:p-6">
                                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                  <Table wrapper={false} className="w-full text-left text-xs sm:text-sm whitespace-normal">
                                    <TableHeader className="bg-surface-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-2xs sm:text-xs border-b border-border">
                                      <TableRow>
                                        <TableHead className="px-4 py-3">
                                          {t("table_number")}
                                        </TableHead>
                                        <TableHead className="px-4 py-3">
                                          {t("table_lokomotiv")}
                                        </TableHead>
                                        <TableHead className="px-4 py-3">
                                          {t("table_station")}
                                        </TableHead>
                                        <TableHead className="px-4 py-3">
                                          {t("table_date")}
                                        </TableHead>
                                        <TableHead className="px-4 py-3 max-w-lg">
                                          {t("table_comment")}
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center">
                                          {t("table_status")}
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-muted">
                                      {apiResponse?.results
                                        ?.filter(
                                          (r) =>
                                            String(r.mashinist_id) === matchKey,
                                        )
                                        .map((record) => (
                                          <TableRow
                                            key={record.id}
                                            className="hover:bg-surface-muted transition-colors"
                                          >
                                            <TableCell className="px-4 py-3 font-medium text-muted-foreground">
                                              #{record.id}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                              <div className="font-semibold text-foreground-secondary">
                                                {record.lokomotiv_name}
                                              </div>
                                              {record.poezd_number && (
                                                <div className="text-muted-foreground text-xs mt-0.5">
                                                  №{record.poezd_number}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                              <div className="font-medium text-foreground">
                                                {record.group_name}
                                              </div>
                                              <div className="text-muted-foreground text-xs mt-0.5">
                                                {record.station_name}{" "}
                                                {record.station2_name
                                                  ? `- ${record.station2_name}`
                                                  : ""}
                                              </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-foreground-secondary whitespace-nowrap">
                                              {formatDate(record.created_at)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-foreground-secondary whitespace-pre-wrap max-w-lg">
                                              {record.comments}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                              <span
                                                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider border ${
                                                  record.finished
                                                    ? "bg-success-subtle text-success border-success/30"
                                                    : "bg-warning-subtle text-warning border-warning/30"
                                                }`}
                                              >
                                                {record.finished
                                                  ? t("status_finished")
                                                  : t("status_open")}
                                              </span>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
