"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { PageHeader } from "@/ui/page-header";
import { useTu137Records } from "@/api/hooks/use-tu137";
import { exportTu137ToDocx } from "@/lib/export-tu137-docx";
import { Button } from "@/ui/button";
import { Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { Tu137Record } from "@/api/types/tu137";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { cn } from "@/lib/utils";
import { authService, getEmmDepoId } from "@/api/services/auth.service";
import { SegmentedTabs } from "@/ui/segmented-tabs";

const PAGE_SIZE = 20;

type Tab = "in_progress" | "hal_qilingan";

export default function Tu137Page() {
  const t = useTranslations("Tu137Page");
  const { getQueryValue, updateQuery } = useFilterParams();

  const tab = (getQueryValue("tab") || "in_progress") as Tab;
  const page = Math.max(1, parseInt(getQueryValue("page") || "1"));

  const currentUser =
    authService.getUser();

  const pDepoId = getEmmDepoId(currentUser);

  const { data: apiResponse, isLoading, error } = useTu137Records({
    depo_id: pDepoId,
    finished: tab === "hal_qilingan" ? true : false,
    page,
    page_size: PAGE_SIZE,
  });

  if (!currentUser || !canAccessSection(currentUser, "tu-137")) {
    return <UnauthorizedPage />;
  }

  const records = apiResponse?.results ?? [];
  const totalCount = apiResponse?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const recordsColumns: TableColumn<Tu137Record>[] = [
    {
      key: "id",
      header: t("table_number"),
      accessor: (r) => (
        <span className="text-foreground-subtle font-medium">#{r.id}</span>
      ),
      width: "80px",
    },
    {
      key: "mashinist",
      header: t("mashinist"),
      accessor: (r) => (
        <div>
          <div className="font-medium text-foreground">
            {r.create_user_fio || `#${r.mashinist_id}`}
          </div>
          <div className="text-xs text-foreground-subtle">
            {r.resp_organization?.name}
          </div>
        </div>
      ),
    },
    {
      key: "lokomotiv",
      header: t("table_lokomotiv"),
      accessor: (r) => (
        <div>
          <div className="font-semibold text-foreground-secondary">{r.lokomotiv_name}</div>
          {r.poezd_number && (
            <div className="text-xs text-foreground-subtle">№{r.poezd_number}</div>
          )}
        </div>
      ),
    },
    {
      key: "station",
      header: t("table_station"),
      accessor: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.group_name}</div>
          <div className="text-xs text-foreground-subtle">
            {r.station_name}
            {r.station2_name ? ` - ${r.station2_name}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "created_at",
      header: t("table_date"),
      accessor: (r) => (
        <span className="text-foreground-secondary whitespace-nowrap">
          {formatDate(r.created_at)}
        </span>
      ),
      width: "120px",
    },
    {
      key: "comments",
      header: t("table_comment"),
      accessor: (r) => (
        <span className="text-foreground-secondary whitespace-pre-wrap line-clamp-2">
          {r.comments || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("table_status"),
      accessor: (r) => (
        <span
          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider border ${
            r.finished
              ? "bg-success-subtle text-success border-success/30"
              : "bg-warning-subtle text-warning border-warning/30"
          }`}
        >
          {r.finished ? t("status_finished") : t("status_open")}
        </span>
      ),
      width: "120px",
    },
  ];

  const breadcrumbs = [
    { label: t("breadcrumbs_home"), href: "/" },
    { label: t("title"), current: true },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: "in_progress", label: t("tab_in_progress") },
    { key: "hal_qilingan", label: t("tab_hal_qilingan") },
  ];

  return (
    <div className="min-h-full bg-surface-muted pb-12">
      <PageHeader
        title={t("title")}
        description={""}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-6 space-y-6">
        {/* Tabs + Export Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-4 rounded-xl border border-border/60 shadow-sm">
          <SegmentedTabs
            value={tab}
            onValueChange={(v) => updateQuery({ tab: v, page: "1" })}
            options={tabs.map(({ key, label }) => ({ value: key, label }))}
          />
          <Button
            onClick={() => (records.length ? exportTu137ToDocx(records) : null)}
            disabled={isLoading || !records.length}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("export_docx")}</span>
          </Button>
        </div>

        {/* Records Table */}
        {isLoading ? (
          <div className="text-sm text-muted-foreground">{t("loading")}</div>
        ) : error ? (
          <div className="text-sm text-destructive">
            {t("error")} {(error as Error).message}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-foreground-secondary uppercase tracking-widest">
                {t("all_records")}
              </h2>
              <span className="text-xs text-foreground-subtle font-medium">
                ({totalCount})
              </span>
            </div>
            <PaginatedTable<Tu137Record>
              columns={recordsColumns}
              data={records}
              isLoading={isLoading}
              getRowId={(r) => r.id}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={PAGE_SIZE}
              currentPage={page}
              onPageChange={(p) => updateQuery({ page: String(p), tab })}
              onItemsPerPageChange={() => {}}
              updateQueryParams={false}
              showActions={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
