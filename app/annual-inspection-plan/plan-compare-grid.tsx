"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AnnualPlanReportOrganization,
  AnnualPlanReportRow,
  AnnualPlanReportType,
  cellCount,
} from "@/api/types/annual-inspection-plan";
import { GRID_COLUMNS, MONTHS_SHORT, QUARTER_LABELS, accentFor } from "./plan-grid-shared";
import { DisclosureTrigger } from "@/ui/disclosure-trigger";
import { CardButton } from "@/ui/card-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

const mVal = (row: AnnualPlanReportRow | undefined, m: number) => cellCount(row?.months[String(m)]);
const qVal = (row: AnnualPlanReportRow | undefined, q: number) => cellCount(row?.quarters[String(q)]);
const yVal = (row: AnnualPlanReportRow | undefined) => cellCount(row?.yearly_count);

/** plan/fact → status colour classes for a cell. */
function status(plan: number, fact: number) {
  if (plan === 0 && fact === 0) return { bg: "", text: "text-muted-foreground/25", empty: true };
  if (plan === 0 && fact > 0)
    return { bg: "bg-primary-subtle", text: "text-primary-hover" }; // rejadan tashqari
  if (fact >= plan) return { bg: "bg-success-subtle", text: "text-success" }; // bajarildi
  if (fact > 0) return { bg: "bg-warning-subtle", text: "text-warning" }; // qisman
  return { bg: "bg-category-rose/10", text: "text-category-rose" }; // bajarilmadi
}

function Cell({ plan, fact }: { plan: number; fact: number }) {
  const s = status(plan, fact);
  return (
    <div className={cn("h-full w-full flex items-center justify-center gap-0.5 py-2", s.bg)}>
      {s.empty ? (
        <span className="text-muted-foreground/25">·</span>
      ) : (
        <>
          <span className={cn("font-bold tabular-nums", s.text)}>{fact}</span>
          <span className="text-2xs text-muted-foreground tabular-nums">/{plan}</span>
        </>
      )}
    </div>
  );
}

interface TypeAgg {
  id: number;
  name: string;
  index: number;
  models: { id: number; name: string; plan?: AnnualPlanReportRow; fact?: AnnualPlanReportRow }[];
  planYearly: number;
  factYearly: number;
  planQ: Record<number, number>;
  factQ: Record<number, number>;
}

function buildTypes(
  planOrg?: AnnualPlanReportOrganization,
  factOrg?: AnnualPlanReportOrganization
): TypeAgg[] {
  const planTypes = new Map<number, AnnualPlanReportType>();
  const factTypes = new Map<number, AnnualPlanReportType>();
  planOrg?.inspection_types.forEach((t) => planTypes.set(t.inspection_type.id, t));
  factOrg?.inspection_types.forEach((t) => factTypes.set(t.inspection_type.id, t));

  // Plan order first, then any fact-only types.
  const ids: number[] = [];
  planOrg?.inspection_types.forEach((t) => ids.push(t.inspection_type.id));
  factOrg?.inspection_types.forEach((t) => {
    if (!ids.includes(t.inspection_type.id)) ids.push(t.inspection_type.id);
  });

  return ids.map((id, index) => {
    const pt = planTypes.get(id);
    const ft = factTypes.get(id);
    const name = pt?.inspection_type.name ?? ft?.inspection_type.name ?? String(id);

    // `locomotive_model` can be null (aggregated rows with no model) — bucket
    // those under a shared -1 / "—" key.
    const modelId = (row: AnnualPlanReportRow) => row.locomotive_model?.id ?? -1;
    const modelName = (row: AnnualPlanReportRow) => row.locomotive_model?.name ?? "—";

    const modelMap = new Map<number, { id: number; name: string; plan?: AnnualPlanReportRow; fact?: AnnualPlanReportRow }>();
    pt?.locomotive_models.forEach((row) =>
      modelMap.set(modelId(row), { id: modelId(row), name: modelName(row), plan: row })
    );
    ft?.locomotive_models.forEach((row) => {
      const existing = modelMap.get(modelId(row));
      if (existing) existing.fact = row;
      else modelMap.set(modelId(row), { id: modelId(row), name: modelName(row), fact: row });
    });

    const models = Array.from(modelMap.values());
    const planQ: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const factQ: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let planYearly = 0;
    let factYearly = 0;
    models.forEach((m) => {
      for (let q = 1; q <= 4; q++) {
        planQ[q] += qVal(m.plan, q);
        factQ[q] += qVal(m.fact, q);
      }
      planYearly += yVal(m.plan);
      factYearly += yVal(m.fact);
    });

    return { id, name, index, models, planYearly, factYearly, planQ, factQ };
  });
}

function pctColor(pct: number) {
  if (pct >= 100) return "bg-success";
  if (pct >= 50) return "bg-primary";
  if (pct > 0) return "bg-warning";
  return "bg-category-rose/60";
}

/** Plan-vs-fact comparison for one organization. */
export function PlanCompareGrid({
  planOrg,
  factOrg,
}: {
  planOrg?: AnnualPlanReportOrganization;
  factOrg?: AnnualPlanReportOrganization;
}) {
  const types = useMemo(() => buildTypes(planOrg, factOrg), [planOrg, factOrg]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggleCard = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const org = planOrg ?? factOrg;
  const totalPlan = types.reduce((a, t) => a + t.planYearly, 0);
  const totalFact = types.reduce((a, t) => a + t.factYearly, 0);
  const visible = selectedId == null ? types : types.filter((t) => t.id === selectedId);

  if (types.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
        Ma&apos;lumot yo&apos;q
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Org header + legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-foreground">{org?.organization.name}</h3>
        <div className="flex items-center gap-3 text-2xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success" /> Bajarildi</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-warning" /> Qisman</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-category-rose/60" /> Bajarilmadi</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Rejadan tashqari</span>
          <span className="ml-1">
            Jami <span className="font-semibold tabular-nums text-foreground">{totalFact}</span>
            <span className="text-muted-foreground">/{totalPlan}</span>
          </span>
        </div>
      </div>

      {/* Compare stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {types.map((t) => {
          const accent = accentFor(t.index);
          const pct = t.planYearly > 0 ? Math.round((t.factYearly / t.planYearly) * 100) : t.factYearly > 0 ? 100 : 0;
          const selected = selectedId === t.id;
          return (
            <CardButton selected={selected} selectedClassName={cn("border-transparent", accent.ringColor, accent.soft)} className="px-3.5 py-3"
              key={t.id}
              onClick={() => setSelectedId(selected ? null : t.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("h-4 w-1.5 rounded-full shrink-0", accent.bar)} />
                  <span className="text-sm font-semibold text-foreground truncate">{t.name}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">{pct}%</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-foreground leading-none">{t.factYearly}</span>
                <span className="text-sm text-muted-foreground tabular-nums">/ {t.planYearly}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", pctColor(pct))} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>

              {/* Per-quarter fakt / reja */}
              <div className="mt-2.5 grid grid-cols-4 gap-1">
                {QUARTER_LABELS.map((q, qi) => {
                  const p = t.planQ[qi + 1] || 0;
                  const f = t.factQ[qi + 1] || 0;
                  const qpct = p > 0 ? f / p : f > 0 ? 1 : 0;
                  return (
                    <div key={q} className="rounded-md bg-muted/50 px-1 py-1 text-center">
                      <div className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{q} kv</div>
                      <div className="text-xs font-semibold tabular-nums leading-tight">
                        <span className={cn(qpct >= 1 ? "text-success" : f > 0 ? "text-warning" : "text-foreground")}>
                          {f}
                        </span>
                        <span className="text-muted-foreground font-normal">/{p}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardButton>
          );
        })}
      </div>

      {/* Compare detail cards */}
      {visible.map((t) => {
        const accent = accentFor(t.index);
        const open = !collapsed.has(t.id);
        const pct = t.planYearly > 0 ? Math.round((t.factYearly / t.planYearly) * 100) : t.factYearly > 0 ? 100 : 0;
        return (
          <div key={t.id} className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", accent.ring)}>
            <DisclosureTrigger
              open={open}
              chevronSide="end"
              onClick={() => toggleCard(t.id)}
              className={cn("px-4 py-3", open && "border-b border-border")}
            >
              <span className={cn("h-8 w-1.5 rounded-full shrink-0", accent.bar)} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground leading-tight">{t.name}</div>
                <div className="text-2xs text-muted-foreground">Fakt / Reja</div>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {t.factYearly}<span className="text-muted-foreground font-normal">/{t.planYearly}</span>
                </span>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md", accent.soft, accent.text)}>{pct}%</span>
              </div>
            </DisclosureTrigger>

            {open && (
              <Table bordered density="compact" className=" table-fixed min-w-[1080px]">
                <colgroup>
                  <col style={{ width: 150 }} />
                  {GRID_COLUMNS.map((c, i) => <col key={i} />)}
                  <col style={{ width: 84 }} />
                </colgroup>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Rusum</TableHead>
                    {GRID_COLUMNS.map((col) =>
                      col.kind === "month" ? (
                        <TableHead key={`m${col.month}`} className="text-center">{MONTHS_SHORT[col.month - 1]}</TableHead>
                      ) : (
                        <TableHead key={`q${col.quarter}`} className="text-center text-success">{QUARTER_LABELS[col.quarter - 1]}</TableHead>
                      )
                    )}
                    <TableHead className="text-center">Σ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {t.models.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-left font-medium whitespace-nowrap">{m.name}</TableCell>
                      {GRID_COLUMNS.map((col) =>
                        col.kind === "month" ? (
                          <TableCell key={`m${col.month}`}><Cell plan={mVal(m.plan, col.month)} fact={mVal(m.fact, col.month)} /></TableCell>
                        ) : (
                          <TableCell key={`q${col.quarter}`}><Cell plan={qVal(m.plan, col.quarter)} fact={qVal(m.fact, col.quarter)} /></TableCell>
                        )
                      )}
                      <TableCell><Cell plan={yVal(m.plan)} fact={yVal(m.fact)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        );
      })}
    </section>
  );
}
