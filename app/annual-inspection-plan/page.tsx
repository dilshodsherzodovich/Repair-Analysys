"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Table2 } from "lucide-react";
import { authService } from "@/api/services/auth.service";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useLocomotiveModels } from "@/api/hooks/use-locomotive-models";
import { useAnnualInspectionPlanReport } from "@/api/hooks/use-annual-inspection-plans";
import { Organization } from "@/api/types/organizations";
import { AnnualPlanReport } from "@/api/types/annual-inspection-plan";
import { exportAnnualPlanExcel } from "@/utils/annual-plan-excel-export";
import { exportAnnualPlanCompareExcel } from "@/utils/annual-plan-compare-excel-export";
import { PlanReportGrid } from "./plan-report-grid";
import { PlanEditGrid } from "./plan-edit-grid";
import { PlanCompareGrid } from "./plan-compare-grid";
import { PageHeader } from "@/ui/page-header";
import { SegmentedTabs } from "@/ui/segmented-tabs";
import { ExportActions } from "@/ui/export-actions";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";
import { SearchableSelect } from "@/ui/select";
import { Page } from "@/ui/page";

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

  const tc = useTranslations("Common");

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
    <Page>
      {/* Header */}
      <PageHeader
        title="Texnik ko&apos;riklar yillik rejasi"
        description="Grafik raboti — tashkilot, ko&apos;rik turi va rusum bo&apos;yicha yillik reja"
        actions={
          <>
            <SegmentedTabs
              size="sm"
              value={mode}
              onValueChange={(v) => setMode(v as typeof mode)}
              options={[
                { value: "view", label: "Ko'rish", icon: <Table2 /> },
                { value: "edit", label: "Tahrirlash", icon: <Pencil /> },
              ]}
            />
            {mode === "view" && (
              <ExportActions
                onExcel={handleExcel}
                busy={isExporting ? "excel" : null}
                disabled={!hasData}
              />
            )}
          </>
        }
        filters={
          <FilterBar>
            <FilterField label="Yil" width="sm">
              <SearchableSelect
                size="md"
                value={String(year)}
                onValueChange={(v) => setYear(Number(v))}
                options={years.map((y) => ({ value: String(y), label: `${y}-yil` }))}
              />
            </FilterField>

            <FilterField label={tc("organization")} width="lg">
              <SearchableSelect
                size="md"
                searchable
                disabled={!isAdmin}
                value={orgFilter}
                onValueChange={setOrgFilter}
                placeholder={tc("organization")}
                options={[
                  ...(mode === "view" ? [{ value: ALL, label: "Barcha tashkilotlar" }] : []),
                  ...organizations.map((o) => ({ value: String(o.id), label: o.name })),
                ]}
              />
            </FilterField>

            {mode === "view" && (
              <>
                <FilterField label="Ko'rinish" width="auto">
                  <SegmentedTabs
                    size="sm"
                    value={source}
                    onValueChange={(v) => setSource(v as typeof source)}
                    options={[
                      { value: "reja", label: "Reja" },
                      { value: "fakt", label: "Fakt" },
                      { value: "compare", label: "Taqqoslash" },
                    ]}
                  />
                </FilterField>

                <FilterField label="Ko'rik turi">
                  <SearchableSelect
                    size="md"
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                    options={[
                      { value: ALL, label: "Barcha turlar" },
                      ...(inspectionTypes ?? [])
                        .filter((t) => t.is_interval)
                        .map((t) => ({ value: String(t.id), label: t.name })),
                    ]}
                  />
                </FilterField>

                <FilterField label="Rusum">
                  <SearchableSelect
                    size="md"
                    searchable
                    value={modelFilter}
                    onValueChange={setModelFilter}
                    options={[
                      { value: ALL, label: "Barcha rusumlar" },
                      ...models.map((m) => ({ value: String(m.id), label: m.name })),
                    ]}
                  />
                </FilterField>

                <FilterReset
                  active={typeFilter !== ALL || modelFilter !== ALL}
                  onReset={() => {
                    setTypeFilter(ALL);
                    setModelFilter(ALL);
                  }}
                />
              </>
            )}
          </FilterBar>
        }
      />

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
    </Page>
  );
}
