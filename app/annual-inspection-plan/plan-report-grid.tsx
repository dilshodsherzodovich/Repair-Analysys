"use client";

import { useState } from "react";
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
} from "./plan-grid-shared";
import { PlanStatCards } from "./plan-stat-cards";

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
    for (let q = 1; q <= 4; q++) quarters[q] += row.quarters[String(q)] ?? 0;
    yearly += row.yearly_count ?? 0;
  });
  return { quarters, yearly };
}

/** One inspection type = one collapsible card: summary header + month table. */
function PlanTypeCard({
  type,
  index,
}: {
  type: AnnualPlanReportType;
  index: number;
}) {
  const accent = accentFor(index);
  const { quarters, yearly } = typeTotals(type);
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
              {type.locomotive_models.map((row, rowIndex) => (
                <tr key={row.locomotive_model?.id ?? `x-${rowIndex}`} className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                    {row.locomotive_model?.name ?? "—"}
                  </td>
                  {GRID_COLUMNS.map((col) =>
                    col.kind === "month" ? (
                      <td key={`m${col.month}`} className="border border-border px-1 py-2 text-center">
                        {num(row.months[String(col.month)] ?? 0)}
                      </td>
                    ) : (
                      <td key={`q${col.quarter}`} className={cn("border border-border px-1 py-2 text-center font-semibold tabular-nums", accent.soft, accent.text)}>
                        {row.quarters[String(col.quarter)] ?? 0}
                      </td>
                    )
                  )}
                  <td className={cn("border border-border px-2 py-2 text-center font-bold tabular-nums", accent.soft, accent.text)}>
                    {row.yearly_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** One organization: per-type stat cards (also a filter) + detail cards. */
export function PlanReportGrid({ org }: { org: AnnualPlanReportOrganization }) {
  const totals = computeOrgTotals(org);
  const types = org.inspection_types.filter((t) => t.locomotive_models.length > 0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const statItems = types.map((t) => {
    const { yearly, quarters } = typeTotals(t);
    return { id: t.inspection_type.id, name: t.inspection_type.name, yearly, quarters };
  });

  const visibleTypes =
    selectedId == null ? types : types.filter((t) => t.inspection_type.id === selectedId);

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
            <PlanTypeCard key={type.inspection_type.id} type={type} index={originalIdx} />
          );
        })
      )}
    </section>
  );
}
