"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  AnnualPlanReportOrganization,
  AnnualPlanReportType,
  cellCount,
} from "@/api/types/annual-inspection-plan";
import {
  GRID_COLUMNS,
  MONTHS_SHORT,
  QUARTER_LABELS,
  accentFor,
  computeOrgTotals,
} from "./plan-grid-shared";
import { PlanStatCards } from "./plan-stat-cards";
import { DisclosureTrigger } from "@/ui/disclosure-trigger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

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
    for (let q = 1; q <= 4; q++) quarters[q] += cellCount(row.quarters[String(q)]);
    yearly += cellCount(row.yearly_count);
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
      <DisclosureTrigger
        open={open}
        chevronSide="end"
        onClick={() => setOpen((v) => !v)}
        className={cn("px-4 py-3", open && "border-b border-border")}
      >
        <span className={cn("h-8 w-1.5 rounded-full shrink-0", accent.bar)} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight">
            {type.inspection_type.name}
          </div>
          <div className="text-2xs text-muted-foreground">Texnik ko&apos;rik</div>
        </div>

        <div className="ml-auto hidden md:flex items-center gap-1.5">
          {QUARTER_LABELS.map((q, i) => (
            <div key={q} className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
              <span className="text-2xs font-medium text-muted-foreground">{q} kv</span>
              <span className="text-xs font-semibold tabular-nums text-foreground">{quarters[i + 1] || 0}</span>
            </div>
          ))}
        </div>

        <div className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 shrink-0", accent.soft)}>
          <span className={cn("text-2xs font-medium uppercase tracking-wide", accent.text)}>Yillik</span>
          <span className={cn("text-base font-bold tabular-nums", accent.text)}>{yearly}</span>
        </div>

      </DisclosureTrigger>

      {/* Table */}
      {open && (
        <div className="overflow-x-auto">
          <Table wrapper={false} className="w-full table-fixed min-w-[900px] border-collapse text-xs">
            <colgroup>
              <col style={{ width: 150 }} />
              {GRID_COLUMNS.map((c, i) => (
                <col key={i} />
              ))}
              <col style={{ width: 72 }} />
            </colgroup>
            <TableHeader>
              <TableRow className="text-muted-foreground bg-muted/40">
                <TableHead className="border border-border px-3 py-2.5 text-left font-medium whitespace-nowrap">Rusum</TableHead>
                {GRID_COLUMNS.map((col) =>
                  col.kind === "month" ? (
                    <TableHead key={`m${col.month}`} className="border border-border px-1 py-2.5 text-center font-medium">
                      {MONTHS_SHORT[col.month - 1]}
                    </TableHead>
                  ) : (
                    <TableHead key={`q${col.quarter}`} className={cn("border border-border px-1 py-2.5 text-center font-semibold", accent.soft, accent.text)}>
                      {QUARTER_LABELS[col.quarter - 1]}
                    </TableHead>
                  )
                )}
                <TableHead className={cn("border border-border px-2 py-2.5 text-center font-semibold", accent.soft, accent.text)}>Σ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {type.locomotive_models.map((row, rowIndex) => (
                <TableRow key={row.locomotive_model?.id ?? `x-${rowIndex}`} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="border border-border px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                    {row.locomotive_model?.name ?? "—"}
                  </TableCell>
                  {GRID_COLUMNS.map((col) =>
                    col.kind === "month" ? (
                      <TableCell key={`m${col.month}`} className="border border-border px-1 py-2 text-center">
                        {num(cellCount(row.months[String(col.month)]))}
                      </TableCell>
                    ) : (
                      <TableCell key={`q${col.quarter}`} className={cn("border border-border px-1 py-2 text-center font-semibold tabular-nums", accent.soft, accent.text)}>
                        {cellCount(row.quarters[String(col.quarter)])}
                      </TableCell>
                    )
                  )}
                  <TableCell className={cn("border border-border px-2 py-2 text-center font-bold tabular-nums", accent.soft, accent.text)}>
                    {cellCount(row.yearly_count)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
