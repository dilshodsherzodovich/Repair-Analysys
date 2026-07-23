"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useAllAnnualInspectionPlans,
  useCreateAnnualInspectionPlan,
  useDeleteAnnualInspectionPlan,
  useUpdateAnnualInspectionPlan,
} from "@/api/hooks/use-annual-inspection-plans";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useLocomotiveModels } from "@/api/hooks/use-locomotive-models";
import {
  GRID_COLUMNS,
  MONTHS_SHORT,
  QUARTER_LABELS,
  accentFor,
} from "./plan-grid-shared";
import { PlanStatCards } from "./plan-stat-cards";

function getErrorMessage(e: any): string {
  return (
    e?.response?.data?.message ||
    e?.response?.data?.detail ||
    (typeof e?.response?.data === "string" ? e.response.data : "") ||
    e?.message ||
    "Xatolik yuz berdi"
  );
}

const cellKey = (typeId: number, modelId: number, month: number) =>
  `${typeId}-${modelId}-${month}`;

/**
 * A single month cell. It renders as plain text and only mounts an <input>
 * while it is being edited, so the grid holds one live input at a time instead
 * of hundreds. Memoised on its primitive props + a stable `onCommit`, so typing
 * in one cell never re-renders its neighbours.
 */
const EditableCell = memo(function EditableCell({
  value,
  typeId,
  modelId,
  month,
  onCommit,
}: {
  value: number;
  typeId: number;
  modelId: number;
  month: number;
  onCommit: (typeId: number, modelId: number, month: number, next: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const begin = () => {
    setDraft(value ? String(value) : "");
    setEditing(true);
  };

  const finish = () => {
    setEditing(false);
    const n = Math.max(0, Math.floor(Number(draft) || 0));
    if (n !== value) onCommit(typeId, modelId, month, n);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={finish}
        onKeyDown={(e) => {
          if (e.key === "Enter") finish();
          else if (e.key === "Escape") setEditing(false);
        }}
        className="w-full h-9 text-center text-xs tabular-nums bg-primary/10 outline-none ring-2 ring-inset ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={begin}
      onKeyDown={(e) => {
        if (e.key === "Enter") begin();
      }}
      className="w-full h-9 text-center text-xs tabular-nums hover:bg-primary/5 focus:bg-primary/10 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary/40 transition-colors"
    >
      {value ? value : <span className="text-muted-foreground/25">·</span>}
    </button>
  );
});

/**
 * Ready-to-fill data entry, one card per `is_interval` inspection type. Every
 * locomotive model gets a row of twelve month cells with live quarter subtotals
 * and yearly totals. Cells autosave on blur (create / update / delete; 0 = no row).
 */
export function PlanEditGrid({
  year,
  organization,
}: {
  year: number;
  organization: number;
}) {
  const { data, isLoading } = useAllAnnualInspectionPlans({ year, organization });
  const { data: inspectionTypes, isLoading: typesLoading } = useGetInspectionTypes();
  const { data: modelsData, isLoading: modelsLoading } = useLocomotiveModels();

  const createPlan = useCreateAnnualInspectionPlan();
  const updatePlan = useUpdateAnnualInspectionPlan();
  const deletePlan = useDeleteAnnualInspectionPlan();

  const models = useMemo(() => modelsData ?? [], [modelsData]);

  const groups = useMemo(
    () =>
      (inspectionTypes ?? [])
        .filter((t) => t.is_interval)
        .map((type) => ({ type, models })),
    [inspectionTypes, models]
  );

  const [cells, setCells] = useState<Record<string, { id: number | null; count: number }>>({});
  const savedRef = useRef<Record<string, number>>({});
  const [saving, setSaving] = useState(0);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Refs so the `commit` callback can stay stable (empty deps) yet read the
  // latest cells/mutations without re-subscribing.
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const createRef = useRef(createPlan);
  createRef.current = createPlan;
  const updateRef = useRef(updatePlan);
  updateRef.current = updatePlan;
  const deleteRef = useRef(deletePlan);
  deleteRef.current = deletePlan;

  const toggleCard = (typeId: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });

  useEffect(() => {
    const rows = data ?? [];
    const nextCells: Record<string, { id: number | null; count: number }> = {};
    const nextSaved: Record<string, number> = {};
    rows.forEach((r) => {
      const key = cellKey(r.inspection_type, r.locomotive_model, r.month);
      nextCells[key] = { id: r.id, count: r.count };
      nextSaved[key] = r.count;
    });
    setCells(nextCells);
    savedRef.current = nextSaved;
  }, [data]);

  const countAt = (typeId: number, modelId: number, month: number) =>
    cells[cellKey(typeId, modelId, month)]?.count ?? 0;

  const commit = useCallback(
    (typeId: number, modelId: number, month: number, next: number) => {
      const key = cellKey(typeId, modelId, month);
      const saved = savedRef.current[key] ?? 0;
      const id = cellsRef.current[key]?.id ?? null;

      // Reflect immediately (drives totals + display); persist in the background.
      setCells((prev) => ({ ...prev, [key]: { id: prev[key]?.id ?? null, count: next } }));
      if (next === saved) return;

      (async () => {
        setSaving((s) => s + 1);
        try {
          if (next > 0 && id == null) {
            const created = await createRef.current.mutateAsync({
              year,
              month,
              organization,
              inspection_type: typeId,
              locomotive_model: modelId,
              count: next,
            });
            setCells((prev) => ({ ...prev, [key]: { id: created?.id ?? null, count: next } }));
          } else if (next > 0 && id != null) {
            await updateRef.current.mutateAsync({ id, data: { count: next } });
          } else if (next === 0 && id != null) {
            await deleteRef.current.mutateAsync(id);
            setCells((prev) => ({ ...prev, [key]: { id: null, count: 0 } }));
          }
          savedRef.current[key] = next;
        } catch (e) {
          setCells((prev) => ({ ...prev, [key]: { id: prev[key]?.id ?? null, count: saved } }));
          toast.error(getErrorMessage(e));
        } finally {
          setSaving((s) => s - 1);
        }
      })();
    },
    [year, organization]
  );

  const rowQuarter = (typeId: number, modelId: number, quarter: number) => {
    let sum = 0;
    for (let m = (quarter - 1) * 3 + 1; m <= quarter * 3; m++) sum += countAt(typeId, modelId, m);
    return sum;
  };
  const rowYearly = (typeId: number, modelId: number) => {
    let sum = 0;
    for (let m = 1; m <= 12; m++) sum += countAt(typeId, modelId, m);
    return sum;
  };
  const typeQuarter = (g: (typeof groups)[number], q: number) =>
    g.models.reduce((acc, m) => acc + rowQuarter(g.type.id, m.id, q), 0);
  const typeYearly = (g: (typeof groups)[number]) =>
    g.models.reduce((acc, m) => acc + rowYearly(g.type.id, m.id), 0);

  const statItems = useMemo(
    () =>
      groups.map((g) => ({
        id: g.type.id,
        name: g.type.name,
        yearly: typeYearly(g),
        quarters: { 1: typeQuarter(g, 1), 2: typeQuarter(g, 2), 3: typeQuarter(g, 3), 4: typeQuarter(g, 4) },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, cells]
  );

  if (isLoading || typesLoading || modelsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (groups.length === 0 || models.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
        Interval turdagi ko&apos;rik turlari yoki lokomotiv rusumlari topilmadi
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Autosave hint */}
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-[11px] font-medium text-muted-foreground">
          Katakni bosib to&apos;ldiring — o&apos;zgarish avtomatik saqlanadi
        </span>
        {saving > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] text-primary">
            <Loader2 className="h-3 w-3 animate-spin" /> Saqlanmoqda…
          </span>
        )}
      </div>

      {/* Per-type stat cards (click to filter) */}
      <PlanStatCards items={statItems} selectedId={selectedTypeId} onSelect={setSelectedTypeId} />

      {/* One collapsible card per inspection type */}
      {groups
        .filter((g) => selectedTypeId == null || g.type.id === selectedTypeId)
        .map((group) => {
          const groupIdx = groups.findIndex((g) => g.type.id === group.type.id);
          const accent = accentFor(groupIdx);
          const open = !collapsed.has(group.type.id);
          return (
            <div
              key={group.type.id}
              className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", accent.ring)}
            >
              {/* Header (toggles) */}
              <button
                type="button"
                onClick={() => toggleCard(group.type.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30",
                  open && "border-b border-border"
                )}
              >
                <span className={cn("h-8 w-1.5 rounded-full shrink-0", accent.bar)} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground leading-tight">
                    {group.type.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Texnik ko&apos;rik</div>
                </div>
                <div className="ml-auto hidden md:flex items-center gap-1.5">
                  {QUARTER_LABELS.map((q, i) => (
                    <div key={q} className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
                      <span className="text-[10px] font-medium text-muted-foreground">{q} kv</span>
                      <span className="text-xs font-semibold tabular-nums text-foreground">
                        {typeQuarter(group, i + 1) || 0}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 shrink-0", accent.soft)}>
                  <span className={cn("text-[10px] font-medium uppercase tracking-wide", accent.text)}>Yillik</span>
                  <span className={cn("text-base font-bold tabular-nums", accent.text)}>{typeYearly(group)}</span>
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
                      {group.models.map((mdl) => (
                        <tr key={mdl.id} className="hover:bg-muted/20 transition-colors">
                          <td className="border border-border px-3 py-1 text-left font-medium text-foreground whitespace-nowrap">
                            {mdl.name}
                          </td>
                          {GRID_COLUMNS.map((col) => {
                            if (col.kind === "quarter") {
                              return (
                                <td key={`q${col.quarter}`} className={cn("border border-border px-1 text-center font-semibold tabular-nums", accent.soft, accent.text)}>
                                  {rowQuarter(group.type.id, mdl.id, col.quarter) || 0}
                                </td>
                              );
                            }
                            return (
                              <td key={`m${col.month}`} className="border border-border p-0">
                                <EditableCell
                                  value={countAt(group.type.id, mdl.id, col.month)}
                                  typeId={group.type.id}
                                  modelId={mdl.id}
                                  month={col.month}
                                  onCommit={commit}
                                />
                              </td>
                            );
                          })}
                          <td className={cn("border border-border px-2 text-center font-bold tabular-nums", accent.soft, accent.text)}>
                            {rowYearly(group.type.id, mdl.id) || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
    </section>
  );
}
