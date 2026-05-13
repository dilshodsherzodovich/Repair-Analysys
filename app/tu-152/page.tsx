"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { PageHeader } from "@/ui/page-header";
import { useDefectiveWorks } from "@/api/hooks/use-defective-works";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { DefectiveWorkEntry } from "@/api/types/defective-works";
import tu152Data from "@/data/tu-152.json";
import { FileText, CheckCircle, XCircle, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const ALL_INSPECTION_TYPES = (() => {
  const map = new Map<
    string,
    { id: number | null; name: string; total: number; fixed: number; unfixed: number }
  >();
  tu152Data.by_organization.forEach((org) => {
    org.by_inspection_type.forEach((ins) => {
      const key = String(ins.inspection_type_id ?? "none");
      if (!map.has(key)) {
        map.set(key, {
          id: ins.inspection_type_id,
          name: ins.inspection_type_name,
          total: 0,
          fixed: 0,
          unfixed: 0,
        });
      }
      const entry = map.get(key)!;
      entry.total += ins.total;
      entry.fixed += ins.fixed;
      entry.unfixed += ins.unfixed;
    });
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
})();

const ORG_COLORS = [
  "blue", "violet", "emerald", "rose", "orange", "pink", "indigo", "teal",
] as const;
type OrgColor = (typeof ORG_COLORS)[number];

const ORG_COLOR_MAP: Record<OrgColor, { dot: string; activeBorder: string }> = {
  blue:    { dot: "bg-blue-500",    activeBorder: "border-blue-400 ring-2 ring-blue-200" },
  violet:  { dot: "bg-violet-500",  activeBorder: "border-violet-400 ring-2 ring-violet-200" },
  emerald: { dot: "bg-emerald-500", activeBorder: "border-emerald-400 ring-2 ring-emerald-200" },
  rose:    { dot: "bg-rose-500",    activeBorder: "border-rose-400 ring-2 ring-rose-200" },
  orange:  { dot: "bg-orange-500",  activeBorder: "border-orange-400 ring-2 ring-orange-200" },
  pink:    { dot: "bg-pink-500",    activeBorder: "border-pink-400 ring-2 ring-pink-200" },
  indigo:  { dot: "bg-indigo-500",  activeBorder: "border-indigo-400 ring-2 ring-indigo-200" },
  teal:    { dot: "bg-teal-500",    activeBorder: "border-teal-400 ring-2 ring-teal-200" },
};

const INS_COLORS = [
  "sky", "amber", "lime", "cyan", "fuchsia", "violet", "orange", "red", "teal", "slate",
] as const;
type InsColor = (typeof INS_COLORS)[number];

const INS_COLOR_MAP: Record<InsColor, { dot: string; activeBorder: string }> = {
  sky:     { dot: "bg-sky-500",     activeBorder: "border-sky-400 ring-2 ring-sky-200" },
  amber:   { dot: "bg-amber-500",   activeBorder: "border-amber-400 ring-2 ring-amber-200" },
  lime:    { dot: "bg-lime-500",    activeBorder: "border-lime-400 ring-2 ring-lime-200" },
  cyan:    { dot: "bg-cyan-500",    activeBorder: "border-cyan-400 ring-2 ring-cyan-200" },
  fuchsia: { dot: "bg-fuchsia-500", activeBorder: "border-fuchsia-400 ring-2 ring-fuchsia-200" },
  violet:  { dot: "bg-violet-500",  activeBorder: "border-violet-400 ring-2 ring-violet-200" },
  orange:  { dot: "bg-orange-500",  activeBorder: "border-orange-400 ring-2 ring-orange-200" },
  red:     { dot: "bg-red-500",     activeBorder: "border-red-400 ring-2 ring-red-200" },
  teal:    { dot: "bg-teal-500",    activeBorder: "border-teal-400 ring-2 ring-teal-200" },
  slate:   { dot: "bg-slate-400",   activeBorder: "border-slate-400 ring-2 ring-slate-200" },
};

function progressColor(rate: number) {
  if (rate >= 0.8) return "bg-emerald-500";
  if (rate >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

function progressText(rate: number) {
  if (rate >= 0.8) return "text-emerald-500";
  if (rate >= 0.5) return "text-amber-500";
  return "text-red-500";
}

function fmt(n: number) {
  return n.toLocaleString();
}

export default function Tu152Page() {
  const t = useTranslations("Tu152Page");
  const { getQueryValue, updateQuery } = useFilterParams();

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  if (!currentUser || !canAccessSection(currentUser, "tu-152")) {
    return <UnauthorizedPage />;
  }

  const orgId = getQueryValue("org_id");
  const insTypeId = getQueryValue("ins_type");
  const page = Math.max(1, parseInt(getQueryValue("page") || "1"));
  const hasFilter = Boolean(orgId || insTypeId);

  const { data: apiData, isLoading } = useDefectiveWorks(
    {
      organization_id: orgId || undefined,
      inspection_type: insTypeId || undefined,
      page,
      page_size: PAGE_SIZE,
    },
    { enabled: hasFilter },
  );

  const records = apiData?.results ?? [];
  const totalCount = apiData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const { totals, by_organization, generated_at } = tu152Data;
  const fixedRatePct = Math.round(totals.fixed_rate * 100);

  const selectedOrg = by_organization.find((o) => String(o.organization_id) === orgId);
  const selectedIns = ALL_INSPECTION_TYPES.find((i) => String(i.id) === insTypeId);

  function toggleOrg(id: number) {
    updateQuery({ org_id: orgId === String(id) ? null : String(id), page: "1" });
  }

  function toggleIns(id: number | null) {
    updateQuery({ ins_type: insTypeId === String(id) ? null : String(id), page: "1" });
  }

  const columns: TableColumn<DefectiveWorkEntry>[] = [
    {
      key: "id",
      header: "№",
      accessor: (r) => <span className="text-slate-400 font-medium">#{r.id}</span>,
      width: "70px",
    },
    {
      key: "locomotive",
      header: t("col_loco"),
      accessor: (r) => (
        <div>
          <div className="font-semibold text-slate-700">
            {r.locomotive_info?.name ?? `#${r.locomotive}`}
          </div>
          {r.locomotive_info?.locomotive_model && (
            <div className="text-xs text-slate-400">{r.locomotive_info.locomotive_model}</div>
          )}
        </div>
      ),
    },
    {
      key: "inspection_type",
      header: t("col_inspection"),
      accessor: (r) => (
        <span className="text-slate-700">{r.inspection_type_info?.name ?? "—"}</span>
      ),
    },
    {
      key: "issue",
      header: t("col_issue"),
      accessor: (r) => (
        <span className="text-slate-700 line-clamp-2 whitespace-pre-wrap">{r.issue || "—"}</span>
      ),
    },
    {
      key: "organization",
      header: t("col_org"),
      accessor: (r) => (
        <span className="text-slate-600 text-sm">{r.organization_info?.name ?? "—"}</span>
      ),
    },
    {
      key: "date",
      header: t("col_date"),
      accessor: (r) => (
        <span className="text-slate-600 whitespace-nowrap">{r.date || "—"}</span>
      ),
      width: "110px",
    },
  ];

  const breadcrumbs = [
    { label: t("breadcrumbs_home"), href: "/" },
    { label: t("title"), current: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PageHeader title={t("title")} description="" breadcrumbs={breadcrumbs} />

      <div className="px-6 py-6 space-y-8">
        {/* Date badge */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">{t("generated_at")}:</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{generated_at}</span>
        </div>

        {/* Global stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                {t("stat_total")}
              </p>
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-slate-800 mt-2">{fmt(totals.total)}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-emerald-500 tracking-wider uppercase">
                {t("stat_fixed")}
              </p>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-600 mt-2">{fmt(totals.fixed)}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-amber-500 tracking-wider uppercase">
                {t("stat_unfixed")}
              </p>
              <XCircle className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-500 mt-2">{fmt(totals.unfixed)}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                {t("stat_rate")}
              </p>
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <p className={cn("text-3xl font-black mt-2", progressText(totals.fixed_rate))}>
              {fixedRatePct}%
            </p>
            <div className="mt-2 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", progressColor(totals.fixed_rate))}
                style={{ width: `${fixedRatePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* By Organization */}
        <section>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            {t("section_by_org")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {by_organization.map((org, idx) => {
              const color = ORG_COLORS[idx % ORG_COLORS.length];
              const cs = ORG_COLOR_MAP[color];
              const isActive = orgId === String(org.organization_id);
              const ratePct = Math.round(org.fixed_rate * 100);

              return (
                <button
                  key={org.organization_id}
                  type="button"
                  onClick={() => toggleOrg(org.organization_id)}
                  className={cn(
                    "text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md",
                    isActive ? cs.activeBorder : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1", cs.dot)} />
                    <span className="font-semibold text-slate-800 text-sm leading-tight">
                      {org.organization_name}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{t("stat_total")}</span>
                      <span className="font-bold text-slate-800 text-sm">{fmt(org.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-500 font-medium">{t("stat_unfixed")}</span>
                      <span className="font-bold text-amber-600">{fmt(org.unfixed)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-500 font-medium">{t("stat_fixed")}</span>
                      <span className="font-bold text-emerald-600">{fmt(org.fixed)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", progressColor(org.fixed_rate))}
                        style={{ width: `${ratePct}%` }}
                      />
                    </div>
                    <span className={cn("text-[11px] font-bold w-8 text-right", progressText(org.fixed_rate))}>
                      {ratePct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* By Inspection Type */}
        <section>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            {t("section_by_ins")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {ALL_INSPECTION_TYPES.filter((ins) => ins.id !== null).map((ins, idx) => {
              const color = INS_COLORS[idx % INS_COLORS.length];
              const cs = INS_COLOR_MAP[color];
              const isActive = insTypeId === String(ins.id);

              return (
                <button
                  key={String(ins.id)}
                  type="button"
                  onClick={() => toggleIns(ins.id)}
                  className={cn(
                    "text-left bg-white rounded-xl border p-3.5 transition-all hover:shadow-md",
                    isActive ? cs.activeBorder : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cs.dot)} />
                    <span className="font-bold text-slate-800 text-sm">{ins.name}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("stat_total")}</span>
                      <span className="font-bold text-slate-700">{fmt(ins.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-400">{t("stat_unfixed")}</span>
                      <span className="font-bold text-amber-600">{fmt(ins.unfixed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">{t("stat_fixed")}</span>
                      <span className="font-bold text-emerald-600">{fmt(ins.fixed)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active filter + live results */}
        {hasFilter && (
          <section>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {t("section_records")}
              </h2>
              {selectedOrg && (
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-200">
                  {selectedOrg.organization_name}
                  <button
                    type="button"
                    onClick={() => updateQuery({ org_id: null, page: "1" })}
                    className="hover:text-indigo-900 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedIns && (
                <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-200">
                  {selectedIns.name}
                  <button
                    type="button"
                    onClick={() => updateQuery({ ins_type: null, page: "1" })}
                    className="hover:text-violet-900 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {!isLoading && (
                <span className="text-xs text-slate-400">{totalCount} ta yozuv</span>
              )}
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-8 flex items-center justify-center">
                <p className="text-sm text-slate-500">{t("loading")}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                <PaginatedTable<DefectiveWorkEntry>
                  columns={columns}
                  data={records}
                  isLoading={isLoading}
                  getRowId={(r) => r.id}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  itemsPerPage={PAGE_SIZE}
                  currentPage={page}
                  onPageChange={(p) => updateQuery({ page: String(p) })}
                  onItemsPerPageChange={() => {}}
                  updateQueryParams={false}
                  showActions={false}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
