"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarRange, Download, Loader2, Pencil, Table2 } from "lucide-react";
import { authService } from "@/api/services/auth.service";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useLocomotiveModels } from "@/api/hooks/use-locomotive-models";
import { useAnnualInspectionPlanReport } from "@/api/hooks/use-annual-inspection-plans";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { cn } from "@/lib/utils";
import { Organization } from "@/api/types/organizations";
import { AnnualPlanReport } from "@/api/types/annual-inspection-plan";
import { exportAnnualPlanExcel } from "@/utils/annual-plan-excel-export";
import { exportAnnualPlanCompareExcel } from "@/utils/annual-plan-compare-excel-export";
import { PlanReportGrid } from "./plan-report-grid";
import { PlanEditGrid } from "./plan-edit-grid";
import { PlanCompareGrid } from "./plan-compare-grid";

const ALL = "0";

export default function AnnualInspectionPlanPage() {
  const user = authService.getUser();
  const isAdmin = user?.role === "admin";

  const { data: orgsRaw } = useOrganizations({ no_page: true });
  const organizations: Organization[] = Array.isArray(orgsRaw)
    ? orgsRaw
    : ((orgsRaw as { results?: Organization[] } | undefined)?.results ?? []);
  const { data: inspectionTypes } = useGetInspectionTypes();
  const { data: modelsData } = useLocomotiveModels();
  const models = modelsData ?? [];

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 6 }, (_, i) => currentYear - 1 + i),
    [currentYear]
  );

  const ownOrgId = user?.branch?.organization?.id ?? 0;

  const [mode, setMode] = useState<"view" | "edit">("view");
  // Within view mode: plan / fact / compare.
  const [source, setSource] = useState<"reja" | "fakt" | "compare">("reja");
  const [year, setYear] = useState<number>(currentYear);
  const [orgFilter, setOrgFilter] = useState<string>(
    isAdmin ? ALL : String(ownOrgId || ALL)
  );
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [modelFilter, setModelFilter] = useState<string>(ALL);

  // In edit mode a concrete organization is required.
  const editOrgId = isAdmin ? Number(orgFilter) : ownOrgId;

  const reportParams = {
    year,
    organization: orgFilter !== ALL ? Number(orgFilter) : undefined,
    inspection_type: typeFilter !== ALL ? Number(typeFilter) : undefined,
    locomotive_model: modelFilter !== ALL ? Number(modelFilter) : undefined,
  };

  const {
    data: report,
    isFetching,
    isError,
  } = useAnnualInspectionPlanReport({
    ...reportParams,
    variant: "report",
    enabled: mode === "view" && (source === "reja" || source === "compare"),
  });

  const {
    data: fact,
    isFetching: isFetchingFact,
    isError: isErrorFact,
  } = useAnnualInspectionPlanReport({
    ...reportParams,
    variant: "fact",
    enabled: mode === "view" && (source === "fakt" || source === "compare"),
  });

  // The fact/report endpoints return every inspection type; only `is_interval`
  // types get an annual plan, so Fakt and Taqqoslash are trimmed to those.
  const intervalIds = useMemo(
    () => new Set((inspectionTypes ?? []).filter((t) => t.is_interval).map((t) => t.id)),
    [inspectionTypes]
  );
  const onlyInterval = useCallback(
    (rep?: AnnualPlanReport): AnnualPlanReport | undefined => {
      if (!rep || intervalIds.size === 0) return rep;
      return {
        ...rep,
        organizations: rep.organizations.map((o) => ({
          ...o,
          inspection_types: o.inspection_types.filter((t) => intervalIds.has(t.inspection_type.id)),
        })),
      };
    },
    [intervalIds]
  );
  const factInterval = useMemo(() => onlyInterval(fact), [fact, onlyInterval]);

  // The dataset currently on screen (plan or fact) — drives the Excel export.
  const active = source === "fakt" ? factInterval : report;
  const activeFetching = source === "fakt" ? isFetchingFact : source === "compare" ? isFetching || isFetchingFact : isFetching;
  const activeError = source === "fakt" ? isErrorFact : source === "compare" ? isError || isErrorFact : isError;

  const [isExporting, setIsExporting] = useState(false);
  const handleExcel = async () => {
    setIsExporting(true);
    try {
      if (source === "compare") {
        await exportAnnualPlanCompareExcel(report, factInterval, year);
      } else if (active) {
        await exportAnnualPlanExcel(active);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const activeOrgs = active?.organizations ?? [];
  const compareHasData =
    (report?.organizations ?? []).some((o) => o.inspection_types.some((t) => t.locomotive_models.length > 0)) ||
    (factInterval?.organizations ?? []).some((o) => o.inspection_types.some((t) => t.locomotive_models.length > 0));
  const hasData =
    source === "compare"
      ? compareHasData
      : activeOrgs.some((o) => o.inspection_types.some((t) => t.locomotive_models.length > 0));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <CalendarRange className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight">
                Texnik ko&apos;riklar yillik rejasi
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grafik raboti — tashkilot, ko&apos;rik turi va rusum bo&apos;yicha yillik reja
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
            <button
              onClick={() => setMode("view")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                mode === "view"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table2 className="h-3.5 w-3.5" /> Ko&apos;rish
            </button>
            <button
              onClick={() => setMode("edit")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                mode === "edit"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Pencil className="h-3.5 w-3.5" /> Tahrirlash
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 bg-muted/30 flex flex-wrap items-center gap-2">
          {/* Year */}
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[110px] h-8 sm:h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}-yil</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Organization */}
          <Select
            value={orgFilter}
            onValueChange={setOrgFilter}
            disabled={!isAdmin}
          >
            <SelectTrigger className="w-[220px] h-8 sm:h-8 text-xs">
              <SelectValue placeholder="Tashkilot" />
            </SelectTrigger>
            <SelectContent>
              {mode === "view" && <SelectItem value={ALL}>Barcha tashkilotlar</SelectItem>}
              {organizations.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {mode === "view" && (
            <>
              {/* Source: plan / fact / compare */}
              <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-background mb-3 sm:mb-4">
                {([
                  ["reja", "Reja"],
                  ["fakt", "Fakt"],
                  ["compare", "Taqqoslash"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSource(key)}
                    className={cn(
                      "h-full flex items-center px-2.5 rounded-md text-xs font-medium transition-colors",
                      source === key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Inspection type */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] h-8 sm:h-8 text-xs">
                  <SelectValue placeholder="Ko'rik turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Barcha turlar</SelectItem>
                  {inspectionTypes
                    ?.filter((t) => t.is_interval)
                    .map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Locomotive model */}
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="w-[160px] h-8 sm:h-8 text-xs">
                  <SelectValue placeholder="Rusum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Barcha rusumlar</SelectItem>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2 mb-3 sm:mb-4">
                {activeFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <button
                  onClick={handleExcel}
                  disabled={!hasData || isExporting}
                  className="flex items-center h-8 gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Excel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {mode === "view" ? (
        <div className="space-y-4">
          {activeError ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 py-10 text-center text-sm text-destructive">
              Ma&apos;lumotni yuklashda xatolik yuz berdi
            </div>
          ) : activeFetching && !active && !(source === "compare" && (report || fact)) ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : source === "compare" ? (
            (() => {
              const orgIds = Array.from(
                new Set([
                  ...(report?.organizations ?? []).map((o) => o.organization.id),
                  ...(factInterval?.organizations ?? []).map((o) => o.organization.id),
                ])
              );
              if (orgIds.length === 0)
                return (
                  <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
                    {year}-yil uchun ma&apos;lumot topilmadi
                  </div>
                );
              return orgIds.map((id) => (
                <PlanCompareGrid
                  key={id}
                  planOrg={report?.organizations.find((o) => o.organization.id === id)}
                  factOrg={factInterval?.organizations.find((o) => o.organization.id === id)}
                />
              ));
            })()
          ) : activeOrgs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
              {year}-yil uchun {source === "fakt" ? "fakt" : "reja"} topilmadi
            </div>
          ) : (
            activeOrgs.map((org) => <PlanReportGrid key={org.organization.id} org={org} />)
          )}
        </div>
      ) : !editOrgId ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Tahrirlash uchun tashkilotni tanlang
        </div>
      ) : (
        <PlanEditGrid key={`${year}-${editOrgId}`} year={year} organization={editOrgId} />
      )}
    </div>
  );
}
