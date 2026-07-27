"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AnnualPlanReportOrganization,
  AnnualPlanReportType,
} from "@/api/types/annual-inspection-plan";
import {
  GRID_COLUMNS,
  MONTHS_SHORT,
  QUARTER_LABELS,
  accentFor,
  computeOrgTotals,
  monthCount,
  monthInspections,
  quarterCount,
  rowInspections,
} from "./plan-grid-shared";
import { PlanStatCards } from "./plan-stat-cards";
import {
  InspectionsDialogData,
  PlanInspectionsDialog,
} from "./plan-inspections-dialog";

function num(v: number) {
  return v ? (
    <span className="tabular-nums">{v}</span>
  ) : (
    <span className="text-muted-foreground/25">·</span>
  );
}

function typeTotals(type: AnnualPlanReportType) {
  const quarters: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let yearly = 0;
  type.locomotive_models.forEach((row) => {
    for (let q = 1; q <= 4; q++) quarters[q] += quarterCount(row, q);
    yearly += row.yearly_count ?? 0;
  });
  return { quarters, yearly };
}

/**
 * One inspection type = one collapsible card: summary header + month table.
 *
 * Memoised on purpose: the table is the expensive part of this page (models ×
 * 17 columns) and `type`/`index` only change when new data arrives, so opening
 * the inspections dialog no longer rebuilds every card.
 */
const PlanTypeCard = memo(function PlanTypeCard({
  type,
  index,
  onShowInspections,
}: {
  type: AnnualPlanReportType;
  index: number;
  onShowInspections: (data: InspectionsDialogData) => void;
}) {
  const accent = accentFor(index);
  const { quarters, yearly } = useMemo(() => typeTotals(type), [type]);
  const [open, setOpen] = useState(true);

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", accent.ring)}>
      {/* Header (toggles) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30",
          open && "border-b border-border"
        )}
      >
        <span className={cn("h-8 w-1.5 rounded-full shrink-0", accent.bar)} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight">
            {type.inspection_type.name}
          </div>
          <div className="text-[11px] text-muted-foreground">Texnik ko&apos;rik</div>
        </div>

        <div className="ml-auto hidden md:flex items-center gap-1.5">
          {QUARTER_LABELS.map((q, i) => (
            <div key={q} className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
              <span className="text-[10px] font-medium text-muted-foreground">{q} kv</span>
              <span className="text-xs font-semibold tabular-nums text-foreground">{quarters[i + 1] || 0}</span>
            </div>
          ))}
        </div>

        <div className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 shrink-0", accent.soft)}>
          <span className={cn("text-[10px] font-medium uppercase tracking-wide", accent.text)}>Yillik</span>
          <span className={cn("text-base font-bold tabular-nums", accent.text)}>{yearly}</span>
        </div>

        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")}
        />
      </button>

      {/* Table */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[900px] border-collapse text-xs">
            <colgroup>
              <col style={{ width: 150 }} />
              {GRID_COLUMNS.map((c, i) => (
                <col key={i} />
              ))}
              <col style={{ width: 72 }} />
            </colgroup>
            <thead>
              <tr className="text-muted-foreground bg-muted/40">
                <th className="border border-border px-3 py-2.5 text-left font-medium whitespace-nowrap">Rusum</th>
                {GRID_COLUMNS.map((col) =>
                  col.kind === "month" ? (
                    <th key={`m${col.month}`} className="border border-border px-1 py-2.5 text-center font-medium">
                      {MONTHS_SHORT[col.month - 1]}
                    </th>
                  ) : (
                    <th key={`q${col.quarter}`} className={cn("border border-border px-1 py-2.5 text-center font-semibold", accent.soft, accent.text)}>
                      {QUARTER_LABELS[col.quarter - 1]}
                    </th>
                  )
                )}
                <th className={cn("border border-border px-2 py-2.5 text-center font-semibold", accent.soft, accent.text)}>Σ</th>
              </tr>
            </thead>
            <tbody>
              {type.locomotive_models.map((row, rowIndex) => {
                const modelName = row.locomotive_model?.name ?? "—";
                const yearly = rowInspections(row);
                return (
                  <tr key={row.locomotive_model?.id ?? `x-${rowIndex}`} className="hover:bg-muted/30 transition-colors">
                    <td className="border border-border px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                      {modelName}
                    </td>
                    {GRID_COLUMNS.map((col) => {
                      if (col.kind !== "month") {
                        return (
                          <td key={`q${col.quarter}`} className={cn("border border-border px-1 py-2 text-center font-semibold tabular-nums", accent.soft, accent.text)}>
                            {quarterCount(row, col.quarter)}
                          </td>
                        );
                      }
                      // Fakt cells carry the individual inspections — make those
                      // clickable so the list can be opened; plan cells stay static.
                      const inspections = monthInspections(row, col.month);
                      return (
                        <td key={`m${col.month}`} className="border border-border p-0 text-center">
                          {inspections.length > 0 ? (
                            <button
                              type="button"
                              title="Ko'riklar ro'yxati"
                              onClick={() =>
                                onShowInspections({
                                  typeName: type.inspection_type.name,
                                  modelName,
                                  month: col.month,
                                  inspections,
                                })
                              }
                              className="w-full px-1 py-2 font-semibold tabular-nums underline decoration-dotted underline-offset-2 hover:bg-muted transition-colors"
                            >
                              {monthCount(row, col.month)}
                            </button>
                          ) : (
                            <div className="px-1 py-2">{num(monthCount(row, col.month))}</div>
                          )}
                        </td>
                      );
                    })}
                    <td className={cn("border border-border p-0 text-center font-bold tabular-nums", accent.soft, accent.text)}>
                      {yearly.length > 0 ? (
                        <button
                          type="button"
                          title="Yillik ko'riklar ro'yxati"
                          onClick={() =>
                            onShowInspections({
                              typeName: type.inspection_type.name,
                              modelName,
                              month: null,
                              inspections: yearly.map((y) => y.inspection),
                            })
                          }
                          className="w-full px-2 py-2 underline decoration-dotted underline-offset-2 hover:brightness-95 transition-all"
                        >
                          {row.yearly_count || 0}
                        </button>
                      ) : (
                        <div className="px-2 py-2">{row.yearly_count || 0}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

/** One organization: per-type stat cards (also a filter) + detail cards. */
export function PlanReportGrid({ org }: { org: AnnualPlanReportOrganization }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogData, setDialogData] = useState<InspectionsDialogData | null>(null);

  // All of these depend only on `org`, so they survive a dialog open/close.
  const totals = useMemo(() => computeOrgTotals(org), [org]);
  const types = useMemo(
    () => org.inspection_types.filter((t) => t.locomotive_models.length > 0),
    [org]
  );
  const statItems = useMemo(
    () =>
      types.map((t) => {
        const { yearly, quarters } = typeTotals(t);
        return { id: t.inspection_type.id, name: t.inspection_type.name, yearly, quarters };
      }),
    [types]
  );

  const visibleTypes = useMemo(
    () =>
      selectedId == null ? types : types.filter((t) => t.inspection_type.id === selectedId),
    [types, selectedId]
  );

  const closeDialog = useCallback(() => setDialogData(null), []);

  return (
    <section className="space-y-3">
      {/* Organization header */}
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 className="text-sm font-semibold text-foreground">{org.organization.name}</h3>
        <span className="text-xs text-muted-foreground">
          Jami <span className="font-semibold tabular-nums text-foreground">{totals.yearly}</span> ta ko&apos;rik
        </span>
      </div>

      {/* Per-type stat cards (click to filter) */}
      <PlanStatCards items={statItems} selectedId={selectedId} onSelect={setSelectedId} />

      {types.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Ma&apos;lumot yo&apos;q
        </div>
      ) : (
        visibleTypes.map((type) => {
          const originalIdx = types.findIndex(
            (t) => t.inspection_type.id === type.inspection_type.id
          );
          return (
            <PlanTypeCard
              key={type.inspection_type.id}
              type={type}
              index={originalIdx}
              onShowInspections={setDialogData}
            />
          );
        })
      )}

      <PlanInspectionsDialog data={dialogData} onClose={closeDialog} />
    </section>
  );
}
