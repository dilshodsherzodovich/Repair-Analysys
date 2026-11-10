"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../../unauthorized/page";
import { PageHeader } from "@/ui/page-header";
import { useTu137Records } from "@/api/hooks/use-tu137";
import { exportTu137ToDocx } from "@/lib/export-tu137-docx";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

import { Users, FileText, Clock, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { authService, getEmmDepoId } from "@/api/services/auth.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { ExportActions } from "@/ui/export-actions";
import { FilterBar, FilterField, FilterReset, SearchInput } from "@/ui/filter-bar";
import { Page } from "@/ui/page";
import { StatCard, StatGrid } from "@/ui/stat-card";

import { LoadingState, EmptyState, TableStateRow, ErrorState } from "@/ui/empty-state";
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
  const tc = useTranslations("Common");
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
    <Page>
      <PageHeader
        title={t("reports_title")}
        breadcrumbs={breadcrumbs}
        actions={
          <ExportActions
            onWord={() => exportTu137ToDocx(allRecords)}
            disabled={isLoading || !allRecords.length}
          />
        }
        filters={
          <FilterBar>
            <FilterField label={tc("search")} width="lg">
              <SearchInput
                value={searchQuery}
                placeholder={t("search_placeholder")}
                onChange={(value) => updateQuery({ search: value || null })}
              />
            </FilterField>
            <FilterReset active={Boolean(searchQuery)} onReset={() => updateQuery({ search: null })} />
          </FilterBar>
        }
      />

      <>

        {/* Global Stats Cards */}
        {isLoading ? (
          <LoadingState shape="cards" />
        ) : error ? (
          <ErrorState title={t("error")} message={(error as Error).message} />
        ) : (
          <StatGrid columns={4}>
            <StatCard label={t("mashinists_count")} icon={Users} value={globalStats.mashinistsCount} />
            <StatCard label={t("total_records")} icon={FileText} tone="primary" value={globalStats.totalRecords} />
            <StatCard label={t("open_records")} icon={Clock} tone="warning" value={globalStats.totalOpen} />
            <StatCard
              label={t("solved_records")}
              icon={CheckCircle}
              tone="success"
              value={globalStats.totalSolved}
              caption={
                <span className="mt-1 flex items-center gap-2">
                  <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-success"
                      style={{ width: `${globalStats.overallPercent}%` }}
                    />
                  </span>
                  <span className="font-semibold text-foreground-secondary">{globalStats.overallPercent}%</span>
                </span>
              }
            />
          </StatGrid>
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
          <Table density="compact" frame className="text-left whitespace-nowrap">
            <TableHeader className="text-muted-foreground font-bold uppercase tracking-wider">
              <TableRow>
                <TableHead>{t("mashinist")}</TableHead>
                <TableHead className="text-center">{t("records")}</TableHead>
                <TableHead className="text-center">{t("open")}</TableHead>
                <TableHead className="text-center">{t("solved")}</TableHead>
                <TableHead className="text-right">
                  {t("percent_solved")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-muted text-foreground-secondary">
              {filteredMashinists.length === 0 ? (
                <TableStateRow colSpan={5}><EmptyState title={t("no_data")} size="compact" /></TableStateRow>
              ) : (
                filteredMashinists.map((mashinist) => {
                  const matchKey = String(mashinist.id);
                  const isExpanded = expandedRow === matchKey;

                  return (
                    <React.Fragment key={matchKey}>
                      <TableRow
                        className="cursor-pointer group"
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : matchKey)
                        }
                      >
                        <TableCell className="flex items-center gap-3">
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
                        <TableCell className="text-center font-bold">
                          {mashinist.total}
                        </TableCell>
                        <TableCell className="text-center font-bold text-warning">
                          {mashinist.open}
                        </TableCell>
                        <TableCell className="text-center font-bold text-success">
                          {mashinist.solved}
                        </TableCell>
                        <TableCell className="text-right">
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
                        <TableRow>
                          <TableCell colSpan={5} className="bg-surface-muted p-4">
                            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                              <Table density="compact" wrapper={false}>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>
                                      {t("table_number")}
                                    </TableHead>
                                    <TableHead>
                                      {t("table_lokomotiv")}
                                    </TableHead>
                                    <TableHead>
                                      {t("table_station")}
                                    </TableHead>
                                    <TableHead>
                                      {t("table_date")}
                                    </TableHead>
                                    <TableHead className="max-w-lg">
                                      {t("table_comment")}
                                    </TableHead>
                                    <TableHead className="text-center">
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
                                      >
                                        <TableCell className="font-medium">
                                          #{record.id}
                                        </TableCell>
                                        <TableCell>
                                          <div className="font-semibold text-foreground-secondary">
                                            {record.lokomotiv_name}
                                          </div>
                                          {record.poezd_number && (
                                            <div className="text-muted-foreground text-xs mt-0.5">
                                              №{record.poezd_number}
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
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
                                        <TableCell className="whitespace-nowrap">
                                          {formatDate(record.created_at)}
                                        </TableCell>
                                        <TableCell className="whitespace-pre-wrap max-w-lg">
                                          {record.comments}
                                        </TableCell>
                                        <TableCell className="text-center">
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
        )}
      </>
    </Page>
  );
}
