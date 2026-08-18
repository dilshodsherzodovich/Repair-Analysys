# Unified Inspection Report — Design

**Date:** 2026-08-17
**Route:** `/unified-inspection-report`
**Status:** design approved through layout; open questions listed at the end

## Problem

Three separate pages each answer part of one question — "how did inspections go this
period?" A manager who wants the whole picture must open all three, re-apply the same
organization and date filters in each, and reconcile the numbers by hand. Nothing
ties them together, and nothing is handover-ready.

## What this is

One new page that presents all three in a single stacked document. The three existing
pages stay exactly as they are, for deep work.

## The three sources, and why they are not interchangeable

| Source | Grain | Endpoint | Note |
|---|---|---|---|
| Inspections performed | inspection event | `/inspection-count-stats/`, `/inspections/report/` | the denominator |
| Entered **late** | inspection event opened past its interval | `/delayed-inspections-report/` | a strict **subset** of inspections performed |
| Delayed **by duration** | inspection event that overran its repair norm | `/delayed-repair-duration-report/` | a strict **subset** of inspections performed |

All three share the inspection event as their grain, over the same window, which is what
makes the page add up. Both delay reports are subsets of the denominator.

The one thing the page must not do is **add the two subsets together**. A single
inspection can be both entered late *and* overrun its repair norm, so the sets overlap;
their union is unknown from these responses. They are presented as two independent facts
about the same denominator, never summed into a "total delayed".

A third endpoint, `/delayed-locomotives-report/`, answers "which locomotives are overdue
*right now*". That is a live snapshot at a different grain and is **not** part of this
page — it remains the standalone `/delayed-report`.

## Layout — stacked executive page

One continuous scroll, mapping 1:1 onto the exported PDF. No tabs: a reviewer must never
have to click to discover a delay, and tabs do not survive printing.

```
┌───────────────────────────────────────────────────┐
│ Texnik ko'riklar — yagona hisobot   [Excel] [PDF] │
│ "Toshkent" MTU · 01.07 – 31.07.2026               │
│ [Org ▾] [From] [To] [Filial ▾] [Turi ▾]       [↻] │
└───────────────────────────────────────────────────┘
┌─ JAMI ───────┬─ KECH KIRGAN ─┬─ CHO'ZILGAN ──┐
│     100      │      20       │      30       │
│ ko'rik ▲ 12  │ 🔴 ▼ 4        │ 🟠 ko'rik ▼ 3 │
│              │ 14 lokomotiv  │               │
└──────────────┴───────────────┴───────────────┘
┌─ Ko'rik turlari bo'yicha ─────────────────────────┐
│ ┌ TXK-1 ──────┐ ┌ TXK-2 ──────┐ ┌ TXK-3 ──────┐   │
│ │ 45          │ │ 28          │ │ 17          │   │
│ │ ● kech   12 │ │ ● kech    9 │ │ ● kech    4 │   │
│ │ ● cho'z.  8 │ │ ● cho'z.  6 │ │ ● cho'z.  3 │   │
│ └─────────────┘ └─────────────┘ └─────────────┘   │
└───────────────────────────────────────────────────┘
┌─ 1. Bajarilgan ko'riklar (100) ───────────────────┐
├─ 2. Davomiylikdan cho'zilgan (30) ────────────────┤
├─ 3. Ko'rikka kech kirgan (20)  soat/km/ikkalasi ──┤
└───────────────────────────────────────────────────┘
```

Its KPI tile sits in **second** position, where the number is most visible, while its
detail table comes **last** — it is the widest and most granular of the three.

## KPI definitions

- **Jami** — sum of the values from `/inspection-count-stats/`. Uses the fast aggregate
  endpoint, not the heavy row list.
- **Kech kirgan** — `summary.delayed_inspections_count`. The tile also shows
  `summary.delayed_locomotives_count` as a secondary figure, since "9 560 late entries
  across 461 locomotives" is a different story from 9 560 across 20.
- **Davomiylikdan cho'zilgan** — `response.count` from the duration report.

There is no on-time percentage tile. It was dropped after review: three numbers carry the
report, and a derived ratio competed with them for attention without adding a fact the
reader could act on.

## Access

Admin only, for now. The page is gated with `withRole(Page, ["admin"])` and its sidebar
entry is shown under the same condition. All three sections render for that single role,
so there is no per-section gating to reason about.

## Filter contract

Shared across the page: organization, date range, branch, inspection type. Every backing
endpoint accepts `organization` and `branch`, so all four filters are applied server-side
and every section stays consistently scoped.

Two call sites need a small change to pass `branch` through — the parameter exists in the
backend but the frontend never sent it:

- `ReportDateRangeParams` (`api/types/reports.ts`) gains an optional `branch?: number`.
  It is the shared params type for all five reports endpoints, so this also unblocks the
  other dashboard queries.
- `useDelayedLocomotives` forwards `branch` to `getDelayedLocomotives`.

Applied per filter:

- **Organization** — sent to all three. Always a concrete organization; never unscoped.
- **Branch** — now sent to all three as an API parameter. The inspections list drops its
  client-side branch filtering in favour of the server-side one.
- **Inspection type** — applies to sections 1 and 3 as an API parameter. In section 2 it
  filters the rendered groups by name, since that response is shaped as
  train type → inspection type → locomotives.
- **Date range** — passed to all three. `/delayed-inspections-report/` requires
  `fromDate`/`toDate` and 400s without them, so its query stays disabled until both are
  known.

## Component structure

Kept small and single-purpose rather than one large page file:

- `app/unified-inspection-report/page.tsx` — filters, layout, export triggers
- `components/reports/unified/use-unified-report-data.ts` — composes the three queries,
  derives the KPIs, exposes one typed result
- `components/reports/unified/kpi-strip.tsx`
- `components/reports/unified/type-breakdown.tsx`
- `components/reports/unified/section-inspections.tsx`
- `components/reports/unified/section-delayed-entry.tsx`
- `components/reports/unified/section-delayed-duration.tsx`

The data hook is the seam: sections receive plain derived data and render it, so each can
be reasoned about without knowing which endpoint fed it.

## Loading and error behaviour

The three queries are independent. Each section renders its own spinner and its own empty
state; one slow or failing endpoint never blanks the page. KPI tiles whose source has not
resolved show a skeleton, not a zero — reporting `0` for data that simply has not arrived
would be a lie in a document meant for handover.

## Exports

Two new generators, mirroring the screen exactly:

- `utils/unified-inspection-report-pdf-export.tsx` — title block (organization, period,
  generation timestamp), KPI summary, then the three sections in order
- `utils/unified-inspection-report-excel-export.ts` — summary sheet plus one sheet per
  section

Both consume the same derived data the screen renders, so an export can never disagree
with what was on screen.

## i18n

New `UnifiedInspectionReport` namespace in `messages/uz.json` and `messages/ru.json`.
Existing keys are reused where they already exist rather than duplicated.

## Trend deltas

The KPI tiles compare against the immediately preceding window of equal length (a 31-day
window compares against the 31 days before it). This costs two extra queries:
`/inspection-count-stats/` for the prior window, and the duration report for the prior
window. Both are cheap — the first is an aggregate, and the second returns only *delayed*
inspections, a small subset rather than the full inspection list.

Deltas appear on all three tiles — every figure is now period-scoped.

Deltas render as "—" when the prior window returns no data, never as `0%` or `▲ 0`.

## Delayed-entry detail (section 3)

Source: `/delayed-inspections-report/`, which groups by locomotive with a nested
`inspections[]`. The section flattens that into one row per late inspection — the report
reads better as a single table, and flattening in one place means the screen and both
exports share a row order.

Per row the table shows the delay dimension as a badge (hour / mileage / both) and, for
each dimension, actual vs interval vs overrun.

Two API details the rendering must respect:

- **`interval === null` means the dimension is not tracked** for that locomotive model +
  inspection type pair. It is rendered as a dash, never as `0` — a zero would read as an
  on-target value. It can never by itself cause a delay.
- **Datetimes are pre-formatted local-time strings** (`"YYYY-MM-DD HH:MM"`), not ISO. They
  are displayed as-is; re-parsing them as UTC would shift every clock reading.

The `summary` block is shown as chips in the section header. Its `hour_delayed_count` and
`mileage_delayed_count` both include the `both_delayed_count` rows, so the chips are
presented as separate facts and never added up.
