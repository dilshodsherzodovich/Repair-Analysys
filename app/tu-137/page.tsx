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

const PAGE_SIZE = 20;

type Tab = "in_progress" | "hal_qilingan";

export default function Tu137Page() {
  const t = useTranslations("Tu137Page");
  const { getQueryValue, updateQuery } = useFilterParams();

  const tab = (getQueryValue("tab") || "in_progress") as Tab;
  const page = Math.max(1, parseInt(getQueryValue("page") || "1"));

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const pDepoId = currentUser?.emm_depo_id;

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
        <span className="text-slate-400 font-medium">#{r.id}</span>
      ),
      width: "80px",
    },
    {
      key: "mashinist",
      header: t("mashinist"),
      accessor: (r) => (
        <div>
          <div className="font-medium text-slate-800">
            {r.create_user_fio || `#${r.mashinist_id}`}
          </div>
          <div className="text-xs text-slate-400">
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
          <div className="font-semibold text-slate-700">{r.lokomotiv_name}</div>
          {r.poezd_number && (
            <div className="text-xs text-slate-400">№{r.poezd_number}</div>
          )}
        </div>
      ),
    },
    {
      key: "station",
      header: t("table_station"),
      accessor: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.group_name}</div>
          <div className="text-xs text-slate-400">
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
        <span className="text-slate-600 whitespace-nowrap">
          {formatDate(r.created_at)}
        </span>
      ),
      width: "120px",
    },
    {
      key: "comments",
      header: t("table_comment"),
      accessor: (r) => (
        <span className="text-slate-700 whitespace-pre-wrap line-clamp-2">
          {r.comments || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("table_status"),
      accessor: (r) => (
        <span
          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            r.finished
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
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
    <div className="min-h-screen bg-slate-50 pb-12">
      <PageHeader
        title={t("title")}
        description={""}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-6 space-y-6">
        {/* Tabs + Export Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => updateQuery({ tab: key, page: "1" })}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-semibold transition-all",
                  tab === key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            onClick={() => (records.length ? exportTu137ToDocx(records) : null)}
            disabled={isLoading || !records.length}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("export_docx")}</span>
          </Button>
        </div>

        {/* Records Table */}
        {isLoading ? (
          <div className="text-sm text-slate-500">{t("loading")}</div>
        ) : error ? (
          <div className="text-sm text-red-500">
            {t("error")} {(error as Error).message}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                {t("all_records")}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
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
