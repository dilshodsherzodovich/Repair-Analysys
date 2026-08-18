# Unified Inspection Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/unified-inspection-report` — one admin-only page that presents inspections performed, locomotives delayed to enter, and inspections that overran their duration norm, as a single handover-ready document with PDF and Excel exports.

**Architecture:** A single stacked page reading three independent React Query hooks composed behind one data hook (`useUnifiedReportData`). That hook owns all derivation — KPI totals, trend deltas, per-type breakdown — and hands plain data to five presentational components. Exports consume the same derived object the screen renders, so an export can never disagree with the screen.

**Tech Stack:** Next.js App Router (client components), TanStack Query, next-intl, Tailwind, shadcn/ui (`@/ui/*`), `exceljs` + `@react-pdf/renderer` (per existing exporters in `utils/`), `date-fns`.

## Global Constraints

- **Access:** admin only. Page wrapped in `withRole(Page, ["admin"])`; sidebar entry rendered only when `role === "admin"`.
- **Route:** `/unified-inspection-report`.
- **No test framework exists in this repo** (no jest/vitest/playwright; scripts are only `dev`, `build`, `lint`). Tasks therefore verify by rendering the page in the browser, not by running unit tests. Do not scaffold a test harness as part of this work.
- **Standing user preference:** do not run `tsc`/`next build` to confirm edits — the user checks themselves. `npm run lint` is acceptable when a task explicitly calls for it.
- **Filters are URL-backed** via `useReportFilters()` so the report is shareable and survives reload.
- **Organization is always concrete** — never an "all organizations" mode. Use `useReportOrganization()`.
- **Never render `0` for unresolved data.** Unloaded KPI tiles show a skeleton; absent deltas render `—`.
- **i18n:** all user-facing copy through `next-intl`. New namespace `UnifiedInspectionReport` in both `messages/uz.json` and `messages/ru.json`. No hardcoded strings.

---

## File Structure

**Create:**
- `app/unified-inspection-report/page.tsx` — filters, layout, export triggers
- `components/reports/unified/use-unified-report-data.ts` — composes queries, derives KPIs
- `components/reports/unified/kpi-strip.tsx`
- `components/reports/unified/type-breakdown.tsx`
- `components/reports/unified/section-inspections.tsx`
- `components/reports/unified/section-delayed-entry.tsx`
- `components/reports/unified/section-delayed-duration.tsx`
- `utils/unified-inspection-report-excel-export.ts`
- `utils/unified-inspection-report-pdf-export.tsx`

**Modify:**
- `api/types/reports.ts` — add `branch?: number` to `ReportDateRangeParams`
- `api/hooks/use-reports.ts` — forward `branch` in `useDelayedLocomotives`
- `api/querykey.ts` — add `unifiedInspectionReport` key
- `layout/sidebar.tsx:421` — add nav entry under the admin check
- `messages/uz.json`, `messages/ru.json` — add `UnifiedInspectionReport` namespace

---

### Task 1: Plumb `branch` through the reports endpoints

The backend accepts `organization` and `branch` on every reports endpoint; the frontend never sent `branch` on the delayed-locomotives call. `ReportDateRangeParams` is the shared params type for all five reports queries, so adding one optional field fixes this for every caller.

**Files:**
- Modify: `api/types/reports.ts:67-71`
- Modify: `api/hooks/use-reports.ts:44-49`

**Interfaces:**
- Produces: `ReportDateRangeParams` gains `branch?: number`; `useDelayedLocomotives(params: ReportDateRangeParams)` now forwards `branch` to the API.

- [ ] **Step 1: Add `branch` to the shared params type**

In `api/types/reports.ts`, replace the `ReportDateRangeParams` interface:

```ts
/** Shared query window used by every reports endpoint. */
export interface ReportDateRangeParams {
  organization?: number;
  /** Backend accepts this on every reports endpoint. */
  branch?: number;
  fromDate?: string;
  toDate?: string;
}
```

- [ ] **Step 2: Confirm the service passes it through**

`reportsService.getDelayedLocomotives` spreads `params` straight into `api.get(..., { params })`, so no service change is needed. Read `api/services/reports.service.ts:30-33` to confirm this is still true; if it destructures fields explicitly, add `branch` there too.

- [ ] **Step 3: Commit**

```bash
git add api/types/reports.ts api/hooks/use-reports.ts
git commit -m "feat(reports): accept branch param on reports endpoints"
```

---

### Task 2: Add the `UnifiedInspectionReport` i18n namespace

Every later task renders copy through these keys, so they must exist first.

**Files:**
- Modify: `messages/uz.json`
- Modify: `messages/ru.json`

**Interfaces:**
- Produces: `useTranslations("UnifiedInspectionReport")` with the keys listed below.

- [ ] **Step 1: Add the namespace to `messages/uz.json`**

Add as a new top-level key:

```json
"UnifiedInspectionReport": {
  "title": "Texnik ko'riklar — yagona hisobot",
  "subtitle": "Ko'riklar, kirishga kechikkanlar va davomiylikdan cho'zilganlar",
  "period": "Davr",
  "organization": "Tashkilot",
  "branch": "Filial",
  "inspectionType": "Ko'rik turi",
  "all": "Barchasi",
  "reset": "Tozalash",
  "kpiTotal": "Jami ko'riklar",
  "kpiDelayedEntry": "Kirishga kechikkan",
  "kpiDelayedDuration": "Davomiylikdan cho'zilgan",
  "kpiOnTime": "O'z vaqtida",
  "kpiUnitInspections": "ko'rik",
  "kpiUnitLocomotives": "lokomotiv",
  "currentState": "hozirgi holat",
  "byType": "Ko'rik turlari bo'yicha",
  "sectionInspections": "Bajarilgan ko'riklar",
  "sectionDelayedEntry": "Kirishga kechikkan lokomotivlar",
  "sectionDelayedDuration": "Davomiylikdan cho'zilgan ko'riklar",
  "locomotive": "Lokomotiv",
  "entryTime": "Kirish vaqti",
  "closeTime": "Yopilish vaqti",
  "normHours": "Norma (soat)",
  "spentHours": "Sarflangan (soat)",
  "overrunHours": "Ortiqcha (soat)",
  "delayReason": "Sabab",
  "hourKm": "Soat / Km",
  "delayedCountSuffix": "cho'zilgan",
  "noData": "Ma'lumot yo'q",
  "exportPdf": "PDF",
  "exportExcel": "Excel",
  "generating": "Tayyorlanmoqda…",
  "generatedAt": "Shakllantirildi",
  "vsPrevious": "oldingi davrga nisbatan",
  "branchNotApplicable": "Filial bo'yicha ajratilmagan"
}
```

- [ ] **Step 2: Add the same namespace to `messages/ru.json`**

```json
"UnifiedInspectionReport": {
  "title": "Технические осмотры — единый отчёт",
  "subtitle": "Осмотры, задержки на заход и превышение длительности",
  "period": "Период",
  "organization": "Организация",
  "branch": "Филиал",
  "inspectionType": "Тип осмотра",
  "all": "Все",
  "reset": "Сбросить",
  "kpiTotal": "Всего осмотров",
  "kpiDelayedEntry": "Задержка на заход",
  "kpiDelayedDuration": "Превышение длительности",
  "kpiOnTime": "В срок",
  "kpiUnitInspections": "осмотр",
  "kpiUnitLocomotives": "локомотив",
  "currentState": "текущее состояние",
  "byType": "По типам осмотра",
  "sectionInspections": "Выполненные осмотры",
  "sectionDelayedEntry": "Локомотивы с задержкой на заход",
  "sectionDelayedDuration": "Осмотры с превышением длительности",
  "locomotive": "Локомотив",
  "entryTime": "Время захода",
  "closeTime": "Время закрытия",
  "normHours": "Норма (ч)",
  "spentHours": "Затрачено (ч)",
  "overrunHours": "Превышение (ч)",
  "delayReason": "Причина",
  "hourKm": "Час / Км",
  "delayedCountSuffix": "с превышением",
  "noData": "Нет данных",
  "exportPdf": "PDF",
  "exportExcel": "Excel",
  "generating": "Формируется…",
  "generatedAt": "Сформирован",
  "vsPrevious": "к предыдущему периоду",
  "branchNotApplicable": "Не разделено по филиалам"
}
```

- [ ] **Step 3: Verify both files still parse**

Run: `node -e "require('./messages/uz.json');require('./messages/ru.json');console.log('ok')"`
Expected: prints `ok`. A trailing-comma or duplicate-key mistake fails here.

- [ ] **Step 4: Commit**

```bash
git add messages/uz.json messages/ru.json
git commit -m "feat(i18n): add UnifiedInspectionReport namespace"
```

---

### Task 3: Build the data hook

This is the seam the whole page hangs off. It composes the three queries plus two prior-window queries, and derives every number the UI shows.

**Files:**
- Create: `components/reports/unified/use-unified-report-data.ts`
- Modify: `api/querykey.ts`

**Interfaces:**
- Consumes: `ReportDateRangeParams.branch` from Task 1.
- Produces:
  ```ts
  interface UnifiedFilters {
    organization: number; fromDate: string; toDate: string;
    branch?: number; inspectionType?: number;
  }
  interface TypeBreakdownRow { name: string; total: number; delayed: number }
  interface UnifiedKpis {
    total: number | null; delayedEntry: number | null;
    delayedDuration: number | null; onTimePct: number | null;
    totalDelta: number | null; delayedDurationDelta: number | null;
    onTimeDelta: number | null;
  }
  function useUnifiedReportData(f: UnifiedFilters): {
    kpis: UnifiedKpis;
    breakdown: TypeBreakdownRow[];
    inspections: { rows: Inspection[]; isLoading: boolean };
    delayedEntry: { groups: DelayedLocomotivesResponse[]; isLoading: boolean };
    delayedDuration: { rows: DelayedRepairDurationRow[]; isLoading: boolean };
  }
  ```

- [ ] **Step 1: Add the query key**

In `api/querykey.ts`, alongside the existing `delayedRepairDurationReport` entry:

```ts
  unifiedInspectionReport: {
    previousStats: "unified-inspection-report-previous-stats",
  },
```

- [ ] **Step 2: Write the hook**

Create `components/reports/unified/use-unified-report-data.ts`:

```ts
"use client";

import { useMemo } from "react";
import { differenceInCalendarDays, format, subDays } from "date-fns";
import {
  useInspectionCountStats,
  useInspectionsReport,
} from "@/api/hooks/use-report-inspections";
import { useDelayedLocomotives } from "@/api/hooks/use-reports";
import { useDelayedRepairDurationReport } from "@/api/hooks/use-delayed-repair-duration-report";
import type { Inspection } from "@/api/types/report-inspection";
import type { DelayedLocomotivesResponse } from "@/api/types/reports";
import type { DelayedRepairDurationRow } from "@/api/types/delayed-repair-duration-report";

const DATE_FMT = "yyyy-MM-dd";

export interface UnifiedFilters {
  organization: number;
  fromDate: string;
  toDate: string;
  branch?: number;
  inspectionType?: number;
}

export interface TypeBreakdownRow {
  name: string;
  total: number;
  delayed: number;
}

export interface UnifiedKpis {
  total: number | null;
  delayedEntry: number | null;
  delayedDuration: number | null;
  /** 0-100, or null while unresolved / when total is 0. */
  onTimePct: number | null;
  totalDelta: number | null;
  delayedDurationDelta: number | null;
  /** Percentage-point change. */
  onTimeDelta: number | null;
}

/**
 * The window immediately preceding the selected one, of equal length. A 31-day
 * window compares against the 31 days before it.
 */
function previousWindow(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  const span = Math.max(differenceInCalendarDays(to, from), 0) + 1;
  return {
    fromDate: format(subDays(from, span), DATE_FMT),
    toDate: format(subDays(to, span), DATE_FMT),
  };
}

const sumCounts = (stats?: Record<string, number>) =>
  stats ? Object.values(stats).reduce((s, n) => s + n, 0) : null;

export function useUnifiedReportData(f: UnifiedFilters) {
  const prev = useMemo(
    () => previousWindow(f.fromDate, f.toDate),
    [f.fromDate, f.toDate],
  );

  // Fast aggregate — the KPI denominator, independent of the heavy row list.
  const { data: stats } = useInspectionCountStats({
    organization: f.organization,
    branch: f.branch,
    fromDate: f.fromDate,
    toDate: f.toDate,
  });

  const { data: prevStats } = useInspectionCountStats({
    organization: f.organization,
    branch: f.branch,
    fromDate: prev.fromDate,
    toDate: prev.toDate,
  });

  // Row data for section 1. A full month of one organization is a large
  // payload — give it room over the 60s default.
  const { data: inspectionsData, isFetching: inspectionsLoading } =
    useInspectionsReport({
      organization: f.organization,
      branch: f.branch,
      inspection_type: f.inspectionType ? String(f.inspectionType) : undefined,
      fromDate: f.fromDate,
      toDate: f.toDate,
      no_page: true,
      timeout: 5 * 60 * 1000,
    });

  const { data: delayedEntryData, isFetching: delayedEntryLoading } =
    useDelayedLocomotives({
      organization: f.organization,
      branch: f.branch,
      fromDate: f.fromDate,
      toDate: f.toDate,
    });

  const { data: durationData, isFetching: durationLoading } =
    useDelayedRepairDurationReport({
      organization: f.organization,
      branch: f.branch,
      inspectionType: f.inspectionType,
      fromDate: f.fromDate,
      toDate: f.toDate,
    });

  // Only *delayed* inspections come back here, so the prior-window fetch is a
  // small set rather than the full inspection list.
  const { data: prevDurationData } = useDelayedRepairDurationReport({
    organization: f.organization,
    branch: f.branch,
    inspectionType: f.inspectionType,
    fromDate: prev.fromDate,
    toDate: prev.toDate,
  });

  const kpis = useMemo<UnifiedKpis>(() => {
    const total = sumCounts(stats);
    const prevTotal = sumCounts(prevStats);

    const delayedEntry = delayedEntryData
      ? delayedEntryData.reduce(
          (sum, trainType) =>
            sum +
            trainType.inspection_types.reduce(
              (s, it) => s + it.locomotives.length,
              0,
            ),
          0,
        )
      : null;

    const delayedDuration = durationData ? durationData.data.length : null;
    const prevDelayedDuration = prevDurationData
      ? prevDurationData.data.length
      : null;

    const pct = (t: number | null, d: number | null) =>
      t == null || d == null || t === 0 ? null : ((t - d) / t) * 100;

    const onTimePct = pct(total, delayedDuration);
    const prevOnTimePct = pct(prevTotal, prevDelayedDuration);

    const delta = (now: number | null, before: number | null) =>
      now == null || before == null ? null : now - before;

    return {
      total,
      delayedEntry,
      delayedDuration,
      onTimePct,
      totalDelta: delta(total, prevTotal),
      delayedDurationDelta: delta(delayedDuration, prevDelayedDuration),
      onTimeDelta: delta(onTimePct, prevOnTimePct),
    };
  }, [stats, prevStats, delayedEntryData, durationData, prevDurationData]);

  // Overran counts per type come from the duration rows; totals come from the
  // aggregate, so a type with zero overruns still shows its total.
  const breakdown = useMemo<TypeBreakdownRow[]>(() => {
    if (!stats) return [];
    const delayedByType = new Map<string, number>();
    for (const row of durationData?.data ?? []) {
      const key = row.inspection_type_name;
      delayedByType.set(key, (delayedByType.get(key) ?? 0) + 1);
    }
    return Object.entries(stats)
      .filter(([, total]) => total > 0)
      .map(([name, total]) => ({
        name,
        total,
        delayed: delayedByType.get(name) ?? 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [stats, durationData]);

  return {
    kpis,
    breakdown,
    inspections: {
      rows: (inspectionsData?.results ?? []) as Inspection[],
      isLoading: inspectionsLoading,
    },
    delayedEntry: {
      groups: (delayedEntryData ?? []) as DelayedLocomotivesResponse[],
      isLoading: delayedEntryLoading,
    },
    delayedDuration: {
      rows: (durationData?.data ?? []) as DelayedRepairDurationRow[],
      isLoading: durationLoading,
    },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add components/reports/unified/use-unified-report-data.ts api/querykey.ts
git commit -m "feat(unified-report): add composed data hook with KPI derivation"
```

---

### Task 4: KPI strip and type breakdown

**Files:**
- Create: `components/reports/unified/kpi-strip.tsx`
- Create: `components/reports/unified/type-breakdown.tsx`

**Interfaces:**
- Consumes: `UnifiedKpis`, `TypeBreakdownRow` from Task 3.
- Produces: `<KpiStrip kpis={...} />`, `<TypeBreakdown rows={...} />`.

- [ ] **Step 1: Write `kpi-strip.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UnifiedKpis } from "./use-unified-report-data";

/** Unresolved values render as a skeleton — never as a misleading `0`. */
function Value({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value == null) {
    return <div className="h-8 w-16 rounded bg-gray-200 animate-pulse" />;
  }
  return (
    <p className="text-3xl font-bold tabular-nums leading-none">
      {value.toLocaleString()}
      {suffix}
    </p>
  );
}

function Delta({ value, unit }: { value: number | null; unit: string }) {
  const t = useTranslations("UnifiedInspectionReport");
  if (value == null) return <p className="text-[11px] text-gray-400 mt-1">—</p>;
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return <p className="text-[11px] text-gray-400 mt-1">→ 0 {unit}</p>;
  }
  const up = rounded > 0;
  return (
    <p
      className={cn(
        "text-[11px] mt-1 font-medium",
        up ? "text-emerald-600" : "text-red-600",
      )}
      title={t("vsPrevious")}
    >
      {up ? "▲" : "▼"} {Math.abs(rounded).toLocaleString()} {unit}
    </p>
  );
}

function Tile({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "neutral" | "danger" | "warning" | "good";
  children: React.ReactNode;
}) {
  const toneClass = {
    neutral: "border-t-gray-300 text-gray-900",
    danger: "border-t-red-400 text-red-600",
    warning: "border-t-amber-400 text-amber-600",
    good: "border-t-emerald-400 text-emerald-600",
  }[tone];
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-t-4 px-4 py-3 shadow-sm",
        toneClass,
      )}
    >
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

export function KpiStrip({ kpis }: { kpis: UnifiedKpis }) {
  const t = useTranslations("UnifiedInspectionReport");
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile label={t("kpiTotal")} tone="neutral">
        <Value value={kpis.total} />
        <Delta value={kpis.totalDelta} unit={t("kpiUnitInspections")} />
      </Tile>

      <Tile label={t("kpiDelayedEntry")} tone="danger">
        <Value value={kpis.delayedEntry} />
        {/* Snapshot of locomotives that have not started — there is no
            meaningful "previous period" figure to trend against. */}
        <p className="text-[11px] text-gray-400 mt-1">⚠ {t("currentState")}</p>
      </Tile>

      <Tile label={t("kpiDelayedDuration")} tone="warning">
        <Value value={kpis.delayedDuration} />
        <Delta
          value={kpis.delayedDurationDelta}
          unit={t("kpiUnitInspections")}
        />
      </Tile>

      <Tile label={t("kpiOnTime")} tone="good">
        <Value
          value={kpis.onTimePct == null ? null : Math.round(kpis.onTimePct)}
          suffix="%"
        />
        <Delta value={kpis.onTimeDelta} unit="pp" />
      </Tile>
    </div>
  );
}
```

- [ ] **Step 2: Write `type-breakdown.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import type { TypeBreakdownRow } from "./use-unified-report-data";

export function TypeBreakdown({ rows }: { rows: TypeBreakdownRow[] }) {
  const t = useTranslations("UnifiedInspectionReport");
  const max = rows.reduce((m, r) => Math.max(m, r.total), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-sm font-semibold mb-4">{t("byType")}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{t("noData")}</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => {
            const pct = max === 0 ? 0 : (row.total / max) * 100;
            const delayedPct =
              row.total === 0 ? 0 : (row.delayed / row.total) * 100;
            return (
              <div key={row.name} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-gray-700 truncate">
                  {row.name}
                </span>
                <div className="flex-1 h-5 rounded bg-gray-100 overflow-hidden relative">
                  <div
                    className="h-full bg-blue-500/80"
                    style={{ width: `${pct}%` }}
                  />
                  {/* Overran share sits inside the bar, so the reader sees the
                      problem portion without a second chart. */}
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-500"
                    style={{ width: `${(pct * delayedPct) / 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">
                  {row.total}
                </span>
                <span className="w-28 shrink-0 text-right text-[11px] text-amber-600 tabular-nums">
                  {row.delayed > 0
                    ? `${row.delayed} ${t("delayedCountSuffix")}`
                    : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/reports/unified/kpi-strip.tsx components/reports/unified/type-breakdown.tsx
git commit -m "feat(unified-report): add KPI strip and type breakdown"
```

---

### Task 5: The three detail sections

**Files:**
- Create: `components/reports/unified/section-inspections.tsx`
- Create: `components/reports/unified/section-delayed-entry.tsx`
- Create: `components/reports/unified/section-delayed-duration.tsx`

**Interfaces:**
- Consumes: `Inspection`, `DelayedLocomotivesResponse`, `DelayedRepairDurationRow`.
- Produces: `<SectionInspections rows isLoading />`, `<SectionDelayedEntry groups isLoading branchSelected />`, `<SectionDelayedDuration rows isLoading />`.

- [ ] **Step 1: Create the shared section shell inside `section-inspections.tsx` and export it**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import type { Inspection } from "@/api/types/report-inspection";

export function SectionShell({
  index,
  title,
  count,
  badge,
  isLoading,
  isEmpty,
  children,
}: {
  index: number;
  title: string;
  count: number | null;
  badge?: React.ReactNode;
  isLoading: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("UnifiedInspectionReport");
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <header className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <span className="w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {index}
        </span>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {count != null && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {count}
          </span>
        )}
        {badge}
      </header>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : isEmpty ? (
        <p className="text-center py-12 text-sm text-gray-400">{t("noData")}</p>
      ) : (
        children
      )}
    </section>
  );
}

export function SectionInspections({
  rows,
  isLoading,
}: {
  rows: Inspection[];
  isLoading: boolean;
}) {
  const t = useTranslations("UnifiedInspectionReport");
  const globalT = useTranslations();

  return (
    <SectionShell
      index={1}
      title={t("sectionInspections")}
      count={isLoading ? null : rows.length}
      isLoading={isLoading}
      isEmpty={rows.length === 0}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              <th className="border px-2 py-1.5 text-center w-10">{globalT("no")}</th>
              <th className="border px-2 py-1.5 text-left">{t("locomotive")}</th>
              <th className="border px-2 py-1.5 text-left">{t("branch")}</th>
              <th className="border px-2 py-1.5 text-center">{t("inspectionType")}</th>
              <th className="border px-2 py-1.5 text-center">{t("entryTime")}</th>
              <th className="border px-2 py-1.5 text-center">{t("closeTime")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "hover:bg-gray-50",
                  i % 2 === 1 && "bg-gray-50/40",
                )}
              >
                <td className="border px-2 py-1 text-center text-gray-400">{i + 1}</td>
                <td className="border px-2 py-1 font-medium whitespace-nowrap">
                  {[row.locomotive?.name, row.locomotive?.locomotive_model?.name]
                    .filter(Boolean)
                    .join(" ")}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">{row.branch?.name}</td>
                <td className="border px-2 py-1 text-center">{row.inspection_type?.name}</td>
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {formatDate(row.created_time)}
                </td>
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {row.is_closed_time ? formatDate(row.is_closed_time) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 2: Write `section-delayed-entry.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { SectionShell } from "./section-inspections";
import type {
  DelayedLocomotive,
  DelayedLocomotivesResponse,
} from "@/api/types/reports";

/** Backend group keys → translated train-type labels. */
function useTrainTypeName() {
  const t = useTranslations("Reports");
  return (name: string) =>
    name === "electric_freight_locos"
      ? t("freightElectric")
      : name === "electric_switches_locos"
      ? t("switcherLocos")
      : name === "passenger_locos"
      ? t("passenger_locs")
      : t("diesel_locs");
}

export function SectionDelayedEntry({
  groups,
  isLoading,
}: {
  groups: DelayedLocomotivesResponse[];
  isLoading: boolean;
}) {
  const t = useTranslations("UnifiedInspectionReport");
  const globalT = useTranslations();
  const trainTypeName = useTrainTypeName();

  const populated = groups
    .map((g) => ({
      ...g,
      inspection_types: g.inspection_types.filter(
        (it) => it.locomotives.length > 0,
      ),
    }))
    .filter((g) => g.inspection_types.length > 0);

  const total = populated.reduce(
    (s, g) => s + g.inspection_types.reduce((n, it) => n + it.locomotives.length, 0),
    0,
  );

  return (
    <SectionShell
      index={2}
      title={t("sectionDelayedEntry")}
      count={isLoading ? null : total}
      badge={
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          ⚠ {t("currentState")}
        </span>
      }
      isLoading={isLoading}
      isEmpty={populated.length === 0}
    >
      <div className="p-4 space-y-4">
        {populated.map((group) => (
          <div key={group.name}>
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              {trainTypeName(group.name)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {group.inspection_types.map((type) => (
                <div
                  key={type.name}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <p className="bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600 border-b text-center">
                    {type.name}
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      {type.locomotives.map((loc: DelayedLocomotive) => (
                        <tr key={loc.id} className="border-b last:border-0">
                          <td className="px-2 py-1 font-medium">{loc.name}</td>
                          <td className="px-2 py-1 text-right text-gray-500 whitespace-nowrap">
                            {loc.hour
                              ? `${loc.hour} ${globalT("hour").toLowerCase()}`
                              : ""}
                            {loc.hour && loc.mileage ? " / " : ""}
                            {loc.mileage
                              ? `${loc.mileage} ${globalT("Km").toLowerCase()}`
                              : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 3: Write `section-delayed-duration.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SectionShell } from "./section-inspections";
import type { DelayedRepairDurationRow } from "@/api/types/delayed-repair-duration-report";

/** Times arrive as "yyyy-MM-dd HH:mm", ISO, or null. */
export function fmtTime(value: string | null): string {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? value : format(d, "dd.MM HH:mm");
}

export function overrun(row: DelayedRepairDurationRow): number | null {
  if (row.delayed_hours == null || row.interval_hours == null) return null;
  return row.delayed_hours - row.interval_hours;
}

const fmtNum = (v: number | null) => (v == null ? "—" : v.toLocaleString());

export function SectionDelayedDuration({
  rows,
  isLoading,
}: {
  rows: DelayedRepairDurationRow[];
  isLoading: boolean;
}) {
  const t = useTranslations("UnifiedInspectionReport");
  const tReason = useTranslations("Inspects.detail.delayReason");
  const globalT = useTranslations();

  const delayLabel = (code: string | null) => {
    if (!code) return "—";
    try {
      return tReason(code as never);
    } catch {
      return code;
    }
  };

  return (
    <SectionShell
      index={3}
      title={t("sectionDelayedDuration")}
      count={isLoading ? null : rows.length}
      isLoading={isLoading}
      isEmpty={rows.length === 0}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              <th className="border px-2 py-1.5 text-center w-10">{globalT("no")}</th>
              <th className="border px-2 py-1.5 text-left">{t("locomotive")}</th>
              <th className="border px-2 py-1.5 text-left">{t("branch")}</th>
              <th className="border px-2 py-1.5 text-center">{t("inspectionType")}</th>
              <th className="border px-2 py-1.5 text-center">{t("entryTime")}</th>
              <th className="border px-2 py-1.5 text-center">{t("closeTime")}</th>
              <th className="border px-2 py-1.5 text-center">{t("normHours")}</th>
              <th className="border px-2 py-1.5 text-center">{t("spentHours")}</th>
              <th className="border px-2 py-1.5 text-center">{t("overrunHours")}</th>
              <th className="border px-2 py-1.5 text-left">{t("delayReason")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={cn("hover:bg-gray-50", i % 2 === 1 && "bg-gray-50/40")}
              >
                <td className="border px-2 py-1 text-center text-gray-400">{i + 1}</td>
                <td className="border px-2 py-1 font-medium whitespace-nowrap">
                  {[row.locomotive_name, row.locomotive_model_name]
                    .filter(Boolean)
                    .join(" ")}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">{row.branch_name}</td>
                <td className="border px-2 py-1 text-center">{row.inspection_type_name}</td>
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {fmtTime(row.entry_time)}
                </td>
                <td className="border px-2 py-1 text-center whitespace-nowrap">
                  {fmtTime(row.close_time)}
                </td>
                <td className="border px-2 py-1 text-center text-gray-500">
                  {fmtNum(row.interval_hours)}
                </td>
                <td className="border px-2 py-1 text-center">
                  {fmtNum(row.delayed_hours)}
                </td>
                <td className="border px-2 py-1 text-center font-semibold text-red-600">
                  {fmtNum(overrun(row))}
                </td>
                <td className="border px-2 py-1">
                  {row.delay_reason_code ? (
                    <>
                      <span className="font-medium">
                        {delayLabel(row.delay_reason_code)}
                      </span>
                      {row.delay_reason_details && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {row.delay_reason_details}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/reports/unified/
git commit -m "feat(unified-report): add the three detail sections"
```

---

### Task 6: The page, route, and sidebar entry

**Files:**
- Create: `app/unified-inspection-report/page.tsx`
- Modify: `layout/sidebar.tsx` (reports children, around line 421)

**Interfaces:**
- Consumes: everything from Tasks 3-5.
- Produces: the `/unified-inspection-report` route.

- [ ] **Step 1: Write the page**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { CalendarIcon, FileDown, FileSpreadsheet, Loader2, RotateCcw } from "lucide-react";
import { withRole } from "@/components/withRole";
import { Calendar } from "@/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useBranches } from "@/api/hooks/use-branches";
import { useGetInspectionTypes } from "@/api/hooks/use-inspection-types";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import {
  ReportOrganizationSelect,
  useReportOrganization,
  REPORT_FILTER_LABEL,
} from "@/components/reports/report-organization-select";
import { useUnifiedReportData } from "@/components/reports/unified/use-unified-report-data";
import { KpiStrip } from "@/components/reports/unified/kpi-strip";
import { TypeBreakdown } from "@/components/reports/unified/type-breakdown";
import { SectionInspections } from "@/components/reports/unified/section-inspections";
import { SectionDelayedEntry } from "@/components/reports/unified/section-delayed-entry";
import { SectionDelayedDuration } from "@/components/reports/unified/section-delayed-duration";
import { generateUnifiedReportExcel } from "@/utils/unified-inspection-report-excel-export";
import { generateUnifiedReportPDF } from "@/utils/unified-inspection-report-pdf-export";

const DATE_FMT = "yyyy-MM-dd";

function UnifiedInspectionReportPage() {
  const t = useTranslations("UnifiedInspectionReport");
  const locale = useLocale();
  const { filters, setFilters } = useReportFilters();
  const { organizationId } = useReportOrganization();

  const defaults = useMemo(() => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return { from: format(monthAgo, DATE_FMT), to: format(today, DATE_FMT) };
  }, []);

  const fromDate = filters.fromDate || defaults.from;
  const toDate = filters.toDate || defaults.to;
  const branch = filters.branch || "all";
  const inspectionType = filters.inspectionType || "all";

  const { data: branches } = useBranches();
  const { data: inspectionTypes } = useGetInspectionTypes();

  const filteredBranches = useMemo(
    () => (branches ?? []).filter((b) => b.organization.id === organizationId),
    [branches, organizationId],
  );

  const typeName = (it: { name: string; name_uz: string; name_ru: string }) =>
    locale === "ru" ? it.name_ru || it.name : it.name_uz || it.name;

  const data = useUnifiedReportData({
    organization: organizationId,
    fromDate,
    toDate,
    branch: branch !== "all" ? Number(branch) : undefined,
    inspectionType: inspectionType !== "all" ? Number(inspectionType) : undefined,
  });

  const orgLabel =
    filteredBranches[0]?.organization?.name ??
    data.delayedDuration.rows[0]?.organization_name ??
    "";

  const [busy, setBusy] = useState<null | "pdf" | "excel">(null);

  const exportPayload = () => ({
    title: t("title"),
    organization: orgLabel,
    fromDate,
    toDate,
    generatedAt: format(new Date(), "dd.MM.yyyy HH:mm"),
    kpis: data.kpis,
    breakdown: data.breakdown,
    inspections: data.inspections.rows,
    delayedEntry: data.delayedEntry.groups,
    delayedDuration: data.delayedDuration.rows,
    labels: {
      period: t("period"),
      organization: t("organization"),
      generatedAt: t("generatedAt"),
      kpiTotal: t("kpiTotal"),
      kpiDelayedEntry: t("kpiDelayedEntry"),
      kpiDelayedDuration: t("kpiDelayedDuration"),
      kpiOnTime: t("kpiOnTime"),
      byType: t("byType"),
      sectionInspections: t("sectionInspections"),
      sectionDelayedEntry: t("sectionDelayedEntry"),
      sectionDelayedDuration: t("sectionDelayedDuration"),
      locomotive: t("locomotive"),
      branch: t("branch"),
      inspectionType: t("inspectionType"),
      entryTime: t("entryTime"),
      closeTime: t("closeTime"),
      normHours: t("normHours"),
      spentHours: t("spentHours"),
      overrunHours: t("overrunHours"),
      delayReason: t("delayReason"),
      hourKm: t("hourKm"),
      currentState: t("currentState"),
    },
  });

  const runExport = async (kind: "pdf" | "excel") => {
    setBusy(kind);
    try {
      const payload = exportPayload();
      if (kind === "pdf") await generateUnifiedReportPDF(payload);
      else await generateUnifiedReportExcel(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h1 className="text-gray-900 font-semibold text-base leading-tight">
              {t("title")}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {orgLabel && `${orgLabel} · `}
              {format(new Date(`${fromDate}T00:00:00`), "dd.MM.yyyy")} –{" "}
              {format(new Date(`${toDate}T00:00:00`), "dd.MM.yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => runExport("excel")}
              disabled={busy !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
            >
              {busy === "excel" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {busy === "excel" ? t("generating") : t("exportExcel")}
            </button>
            <button
              onClick={() => runExport("pdf")}
              disabled={busy !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
            >
              {busy === "pdf" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {busy === "pdf" ? t("generating") : t("exportPdf")}
            </button>
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="px-5 py-3 bg-gray-50/60 flex flex-wrap items-end gap-3">
          <ReportOrganizationSelect label={t("organization")} />

          <DateBox
            label={t("period")}
            date={new Date(`${fromDate}T00:00:00`)}
            onSelect={(d) => setFilters({ fromDate: d ? format(d, DATE_FMT) : "" })}
          />
          <DateBox
            label="—"
            date={new Date(`${toDate}T00:00:00`)}
            onSelect={(d) => setFilters({ toDate: d ? format(d, DATE_FMT) : "" })}
          />

          <div className="flex flex-col gap-1">
            <span className={REPORT_FILTER_LABEL}>{t("branch")}</span>
            <Select
              value={branch}
              onValueChange={(v) => setFilters({ branch: v === "all" ? "" : v })}
            >
              <SelectTrigger className="w-[190px] h-9 text-sm mb-0 sm:mb-0">
                <SelectValue placeholder={t("branch")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {filteredBranches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className={REPORT_FILTER_LABEL}>{t("inspectionType")}</span>
            <Select
              value={inspectionType}
              onValueChange={(v) =>
                setFilters({ inspectionType: v === "all" ? "" : v })
              }
            >
              <SelectTrigger className="w-[170px] h-9 text-sm mb-0 sm:mb-0">
                <SelectValue placeholder={t("inspectionType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {inspectionTypes?.map((it) => (
                  <SelectItem key={it.id} value={String(it.id)}>
                    {typeName(it)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={() =>
              setFilters({ fromDate: "", toDate: "", branch: "", inspectionType: "" })
            }
            title={t("reset")}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <KpiStrip kpis={data.kpis} />
      <TypeBreakdown rows={data.breakdown} />
      <SectionInspections {...data.inspections} />
      <SectionDelayedEntry {...data.delayedEntry} />
      <SectionDelayedDuration {...data.delayedDuration} />
    </div>
  );
}

function DateBox({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date;
  onSelect: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={REPORT_FILTER_LABEL}>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 h-9 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap border border-gray-200 rounded-lg bg-white shadow-sm">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            {format(date, "dd.MM.yyyy")}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onSelect}
            captionLayout="dropdown"
            locale={uz}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default withRole(UnifiedInspectionReportPage, ["admin"]);
```

- [ ] **Step 2: Add the sidebar entry**

In `layout/sidebar.tsx`, inside the reports children block, add an admin-only entry **before** the existing `/delayed-report` push (so it reads first in the menu):

```tsx
    if (role === "admin") {
      reportsChildren.push({
        name: t("nav.unified_inspection_report"),
        href: "/unified-inspection-report",
      });
    }
```

- [ ] **Step 3: Add the nav label to both message files**

In `messages/uz.json` under `Sidebar.nav`:

```json
"unified_inspection_report": "Yagona ko'riklar hisoboti"
```

In `messages/ru.json` under `Sidebar.nav`:

```json
"unified_inspection_report": "Единый отчёт по осмотрам"
```

Confirm the exact nesting first — read the `Sidebar` namespace in `messages/uz.json` and match how `delayed_report` and `inspection_report` are keyed.

- [ ] **Step 4: Verify in the browser**

Run `npm run dev`, log in as an admin, and open `/unified-inspection-report`. Confirm: the four KPI tiles render, the type breakdown bars render, all three sections load, and changing branch/type/date updates the numbers. Confirm a non-admin does not see the sidebar entry.

- [ ] **Step 5: Commit**

```bash
git add app/unified-inspection-report layout/sidebar.tsx messages/
git commit -m "feat(unified-report): add page, route and admin sidebar entry"
```

---

### Task 7: Excel export

**Files:**
- Create: `utils/unified-inspection-report-excel-export.ts`

**Interfaces:**
- Consumes: the payload shape built by `exportPayload()` in Task 6.
- Produces: `generateUnifiedReportExcel(payload): Promise<void>`.

- [ ] **Step 1: Read the existing exporter to match conventions**

Read `utils/inspection-report-excel-export.ts` and `utils/delayed-repair-duration-report-excel-export.ts`. Match their exceljs usage, column-width approach, header styling, and the filename helper in `utils/format-filename.ts`. Reuse those helpers rather than re-implementing them.

- [ ] **Step 2: Write the exporter**

Define and export a `UnifiedReportExportData` interface matching `exportPayload()`, then build a workbook with four sheets:

1. **Summary** — organization, period, generated-at, then the four KPI rows (label, value, delta), then the type-breakdown table (type, total, overran).
2. **Inspections** — the section-1 columns: №, locomotive, branch, type, entry, close.
3. **Delayed to enter** — flattened from the nested groups to columns: train type, inspection type, locomotive, hours, km. Include the `currentState` label in the sheet header so the snapshot nature survives the export.
4. **Delayed by duration** — the section-3 columns including the computed overrun.

Reuse `overrun()` and `fmtTime()` by importing them from
`@/components/reports/unified/section-delayed-duration`, so the exported numbers are computed by the same code the screen uses.

- [ ] **Step 3: Verify**

Click Excel on the page, open the workbook, and confirm all four sheets are present and the numbers match the screen exactly.

- [ ] **Step 4: Commit**

```bash
git add utils/unified-inspection-report-excel-export.ts
git commit -m "feat(unified-report): add Excel export"
```

---

### Task 8: PDF export

**Files:**
- Create: `utils/unified-inspection-report-pdf-export.tsx`

**Interfaces:**
- Consumes: the same payload as Task 7.
- Produces: `generateUnifiedReportPDF(payload): Promise<void>`.

- [ ] **Step 1: Read the existing PDF exporters**

Read `utils/inspections-pdf-export.tsx` and `utils/delayed-report-pdf-export.tsx`. Match their `@react-pdf/renderer` setup — font registration (Cyrillic support matters for the ru locale), `StyleSheet` conventions, page size/orientation, and how they trigger the download.

- [ ] **Step 2: Write the exporter**

Landscape A4. Document order mirrors the screen exactly:

1. Title block — report title, organization, period, generated-at.
2. KPI row — four boxes with label, value and delta. The delayed-entry box carries the `currentState` marker instead of a delta.
3. Type breakdown table — type, total, overran.
4. Section 1 table, section 2 table (flattened as in Task 7), section 3 table — each with its numbered heading and count.

Repeat table headers across page breaks (`fixed` on the header `View`) so a multi-page section stays readable.

- [ ] **Step 3: Verify**

Click PDF on the page. Confirm the document opens, Cyrillic renders correctly when the locale is `ru`, headers repeat across pages, and every number matches the screen.

- [ ] **Step 4: Commit**

```bash
git add utils/unified-inspection-report-pdf-export.tsx
git commit -m "feat(unified-report): add PDF export"
```

---

## Self-Review Notes

**Spec coverage:** Access (Task 6) · filter contract incl. branch plumbing (Tasks 1, 6) · KPI definitions (Task 3) · trend deltas with no delta on the snapshot tile (Tasks 3, 4) · stacked layout (Tasks 4-6) · component structure (Tasks 3-6) · per-section loading with no misleading zeros (Tasks 3, 4, 5) · exports mirroring the screen (Tasks 7, 8) · i18n namespace (Task 2). All covered.

**Type consistency:** `UnifiedKpis`, `TypeBreakdownRow` and `UnifiedFilters` are defined once in Task 3 and consumed by name in Tasks 4-8. `overrun()` and `fmtTime()` are defined once in Task 5 and imported by Task 7 rather than reimplemented.

**Known deviation:** the repo has no test framework, so tasks verify by browser rendering and by parsing the JSON message files rather than by unit tests. Introducing a test harness was judged out of scope for this feature.
