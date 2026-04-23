"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { PageHeader } from "@/ui/page-header";
import { useTu137Records } from "@/api/hooks/use-tu137";
import { exportTu137ToDocx } from "@/lib/export-tu137-docx";
import { Button } from "@/ui/button";
import { DatePicker } from "@/ui/date-picker";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { Tu137Record } from "@/api/types/tu137";

const RECORDS_PAGE_SIZE = 20;

export default function Tu137Page() {
  const t = useTranslations("Tu137Page");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [recordsPage, setRecordsPage] = useState(1);

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
    ...(dateFrom && { p_create_date_from: format(dateFrom, "yyyy-MM-dd") }),
    ...(dateTo && { p_create_date_to: format(dateTo, "yyyy-MM-dd") }),
  });

  if (!currentUser || !canAccessSection(currentUser, "tu-137")) {
    return <UnauthorizedPage />;
  }

  const allRecords = apiResponse?.data ?? [];
  const recordsTotalPages = Math.max(
    1,
    Math.ceil(allRecords.length / RECORDS_PAGE_SIZE),
  );
  const paginatedRecords = allRecords.slice(
    (recordsPage - 1) * RECORDS_PAGE_SIZE,
    recordsPage * RECORDS_PAGE_SIZE,
  );

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
            {r.mashinist_fio || "—"}
          </div>
          <div className="text-xs text-slate-400">{r.depo_name}</div>
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
      key: "create_date",
      header: t("table_date"),
      accessor: (r) => (
        <span className="text-slate-600 whitespace-nowrap">
          {formatDate(r.create_date)}
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
            r.status_id === 4
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
          }`}
        >
          {r.status_name}
        </span>
      ),
      width: "120px",
    },
  ];

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
        {/* Filters / Export Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DatePicker
              value={dateFrom}
              onValueChange={setDateFrom}
              placeholder={t("date_from")}
            />
            <DatePicker
              value={dateTo}
              onValueChange={setDateTo}
              placeholder={t("date_to")}
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
                ({allRecords.length})
              </span>
            </div>
            <PaginatedTable<Tu137Record>
              columns={recordsColumns}
              data={paginatedRecords}
              isLoading={isLoading}
              getRowId={(r) => r.id}
              totalPages={recordsTotalPages}
              totalItems={allRecords.length}
              itemsPerPage={RECORDS_PAGE_SIZE}
              currentPage={recordsPage}
              onPageChange={(p) => setRecordsPage(p)}
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
