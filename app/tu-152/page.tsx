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
import {
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authService } from "@/api/services/auth.service";
import { CardButton } from "@/ui/card-button";
import { Chip } from "@/ui/chip";

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
  blue:    { dot: "bg-primary",    activeBorder: "border-primary ring-2 ring-primary/30" },
  violet:  { dot: "bg-category-violet",  activeBorder: "border-category-violet/60 ring-2 ring-category-violet/25" },
  emerald: { dot: "bg-success", activeBorder: "border-success ring-2 ring-success/30" },
  rose:    { dot: "bg-category-rose",    activeBorder: "border-category-rose/60 ring-2 ring-category-rose/25" },
  orange:  { dot: "bg-warning",  activeBorder: "border-warning ring-2 ring-warning/30" },
  pink:    { dot: "bg-category-pink",    activeBorder: "border-category-pink/60 ring-2 ring-category-pink/25" },
  indigo:  { dot: "bg-category-indigo",  activeBorder: "border-category-indigo/60 ring-2 ring-category-indigo/25" },
  teal:    { dot: "bg-category-teal",    activeBorder: "border-category-teal/60 ring-2 ring-category-teal/25" },
};

const INS_COLORS = [
  "sky", "amber", "lime", "cyan", "fuchsia", "violet", "orange", "red", "teal", "slate",
] as const;
type InsColor = (typeof INS_COLORS)[number];

const INS_COLOR_MAP: Record<InsColor, { dot: string; activeBorder: string }> = {
  sky:     { dot: "bg-primary",     activeBorder: "border-primary ring-2 ring-primary/30" },
  amber:   { dot: "bg-warning",   activeBorder: "border-warning ring-2 ring-warning/30" },
  lime:    { dot: "bg-category-lime",    activeBorder: "border-category-lime/60 ring-2 ring-category-lime/25" },
  cyan:    { dot: "bg-category-cyan",    activeBorder: "border-category-cyan/60 ring-2 ring-category-cyan/25" },
  fuchsia: { dot: "bg-category-fuchsia", activeBorder: "border-category-fuchsia/60 ring-2 ring-category-fuchsia/25" },
  violet:  { dot: "bg-category-violet",  activeBorder: "border-category-violet/60 ring-2 ring-category-violet/25" },
  orange:  { dot: "bg-warning",  activeBorder: "border-warning ring-2 ring-warning/30" },
  red:     { dot: "bg-destructive",     activeBorder: "border-destructive ring-2 ring-destructive/30" },
  teal:    { dot: "bg-category-teal",    activeBorder: "border-category-teal/60 ring-2 ring-category-teal/25" },
  slate:   { dot: "bg-foreground-subtle",   activeBorder: "border-foreground-subtle ring-2 ring-border" },
};

function progressColor(rate: number) {
  if (rate >= 0.8) return "bg-success";
  if (rate >= 0.5) return "bg-warning";
  return "bg-destructive";
}

function progressText(rate: number) {
  if (rate >= 0.8) return "text-success";
  if (rate >= 0.5) return "text-warning";
  return "text-destructive";
}

function fmt(n: number) {
  return n.toLocaleString();
}

export default function Tu152Page() {
  const t = useTranslations("Tu152Page");
  const { getQueryValue, updateQuery } = useFilterParams();

  const currentUser =
    authService.getUser();

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
      accessor: (r) => <span className="text-foreground-subtle font-medium">#{r.id}</span>,
      width: "70px",
    },
    {
      key: "locomotive",
      header: t("col_loco"),
      accessor: (r) => (
        <div>
          <div className="font-semibold text-foreground-secondary">
            {r.locomotive_info?.name ?? `#${r.locomotive}`}
          </div>
          {r.locomotive_info?.locomotive_model && (
            <div className="text-xs text-foreground-subtle">{r.locomotive_info.locomotive_model}</div>
          )}
        </div>
      ),
    },
    {
      key: "inspection_type",
      header: t("col_inspection"),
      accessor: (r) => (
        <span className="text-foreground-secondary">{r.inspection_type_info?.name ?? "—"}</span>
      ),
    },
    {
      key: "issue",
      header: t("col_issue"),
      accessor: (r) => (
        <span className="text-foreground-secondary line-clamp-2 whitespace-pre-wrap">{r.issue || "—"}</span>
      ),
    },
    {
      key: "organization",
      header: t("col_org"),
      accessor: (r) => (
        <span className="text-foreground-secondary text-sm">{r.organization_info?.name ?? "—"}</span>
      ),
    },
    {
      key: "date",
      header: t("col_date"),
      accessor: (r) => (
        <span className="text-foreground-secondary whitespace-nowrap">{r.date || "—"}</span>
      ),
      width: "110px",
    },
  ];

  const breadcrumbs = [
    { label: t("breadcrumbs_home"), href: "/" },
    { label: t("title"), current: true },
  ];

  return (
    <div className="min-h-full bg-surface-muted pb-12">
      <PageHeader title={t("title")} description="" breadcrumbs={breadcrumbs} />

      <div className="px-6 py-6 space-y-8">
        {/* Date badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground-secondary">{t("generated_at")}:</span>
          <span className="bg-muted px-2 py-0.5 rounded font-mono">{generated_at}</span>
        </div>

        {/* Global stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-2xs font-bold text-muted-foreground tracking-wider uppercase">
                {t("stat_total")}
              </p>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">{fmt(totals.total)}</p>
          </div>

          <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-2xs font-bold text-success tracking-wider uppercase">
                {t("stat_fixed")}
              </p>
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-success mt-2">{fmt(totals.fixed)}</p>
          </div>

          <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-2xs font-bold text-warning tracking-wider uppercase">
                {t("stat_unfixed")}
              </p>
              <XCircle className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-warning mt-2">{fmt(totals.unfixed)}</p>
          </div>

          <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-2xs font-bold text-muted-foreground tracking-wider uppercase">
                {t("stat_rate")}
              </p>
              <TrendingUp className="w-5 h-5 text-category-indigo/60" />
            </div>
            <p className={cn("text-3xl font-bold mt-2", progressText(totals.fixed_rate))}>
              {fixedRatePct}%
            </p>
            <div className="mt-2 bg-muted h-1.5 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", progressColor(totals.fixed_rate))}
                style={{ width: `${fixedRatePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* By Organization */}
        <section>
          <h2 className="text-2xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            {t("section_by_org")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {by_organization.map((org, idx) => {
              const color = ORG_COLORS[idx % ORG_COLORS.length];
              const cs = ORG_COLOR_MAP[color];
              const isActive = orgId === String(org.organization_id);
              const ratePct = Math.round(org.fixed_rate * 100);

              return (
                <CardButton selected={isActive} selectedClassName={cs.activeBorder} className="p-4"
                  key={org.organization_id}
                  onClick={() => toggleOrg(org.organization_id)}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1", cs.dot)} />
                    <span className="font-semibold text-foreground text-sm leading-tight">
                      {org.organization_name}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground-subtle">{t("stat_total")}</span>
                      <span className="font-bold text-foreground text-sm">{fmt(org.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-warning font-medium">{t("stat_unfixed")}</span>
                      <span className="font-bold text-warning">{fmt(org.unfixed)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-success font-medium">{t("stat_fixed")}</span>
                      <span className="font-bold text-success">{fmt(org.fixed)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", progressColor(org.fixed_rate))}
                        style={{ width: `${ratePct}%` }}
                      />
                    </div>
                    <span className={cn("text-2xs font-bold w-8 text-right", progressText(org.fixed_rate))}>
                      {ratePct}%
                    </span>
                  </div>
                </CardButton>
              );
            })}
          </div>
        </section>

        {/* By Inspection Type */}
        <section>
          <h2 className="text-2xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            {t("section_by_ins")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {ALL_INSPECTION_TYPES.filter((ins) => ins.id !== null).map((ins, idx) => {
              const color = INS_COLORS[idx % INS_COLORS.length];
              const cs = INS_COLOR_MAP[color];
              const isActive = insTypeId === String(ins.id);

              return (
                <CardButton selected={isActive} selectedClassName={cs.activeBorder} className="p-3.5"
                  key={String(ins.id)}
                  onClick={() => toggleIns(ins.id)}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cs.dot)} />
                    <span className="font-bold text-foreground text-sm">{ins.name}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-foreground-subtle">{t("stat_total")}</span>
                      <span className="font-bold text-foreground-secondary">{fmt(ins.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warning">{t("stat_unfixed")}</span>
                      <span className="font-bold text-warning">{fmt(ins.unfixed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success">{t("stat_fixed")}</span>
                      <span className="font-bold text-success">{fmt(ins.fixed)}</span>
                    </div>
                  </div>
                </CardButton>
              );
            })}
          </div>
        </section>

        {/* Active filter + live results */}
        {hasFilter && (
          <section>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h2 className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">
                {t("section_records")}
              </h2>
              {selectedOrg && (
                <Chip
                  className="font-semibold bg-category-indigo/10 text-category-indigo border-category-indigo/25"
                  onRemove={() => updateQuery({ org_id: null, page: "1" })}
                >
                  {selectedOrg.organization_name}
                </Chip>
              )}
              {selectedIns && (
                <Chip
                  className="font-semibold bg-category-violet/10 text-category-violet border-category-violet/25"
                  onRemove={() => updateQuery({ ins_type: null, page: "1" })}
                >
                  {selectedIns.name}
                </Chip>
              )}
              {!isLoading && (
                <span className="text-xs text-foreground-subtle">{totalCount} ta yozuv</span>
              )}
            </div>

            {isLoading ? (
              <div className="bg-background rounded-xl border border-border/60 shadow-sm p-8 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              </div>
            ) : (
              <div className="bg-background rounded-xl border border-border/60 shadow-sm overflow-hidden">
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
