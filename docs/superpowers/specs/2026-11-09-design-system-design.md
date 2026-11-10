# Design system: tokens, UI kit and migration

**Date:** 2026-11-09
**Status:** Approved (tokens, component set, kit page); foundation built, migration pending.

## Problem

Pages style themselves. Across `app/`, `components/`, `layout/` there are ~2,450
hardcoded colours (hex like `text-[#0F172B]`, palette classes like `bg-blue-600`)
against ~720 uses of the existing CSS-variable tokens. One role has several
colours (primary: `#2354BF`, `#2563EB`, `blue-600`, `#4978CE`; borders:
`#E2E8F0`, `#CAD5E2`, `#D1D5DB`, `#E5E7EB`), and several components do the same
job (`button` / `enhanced-button` / `loading-button`, `toast` / `snackbar`, ...).

## Decisions

- **Direction:** keep the current look, standardised. No redesign.
- **Primary:** `#2354BF`.
- **Approach:** semantic tokens as CSS variables in `app/globals.css`, exposed
  as Tailwind classes. Components in `ui/` use only tokens; pages use components
  plus token classes. Light mode only; tokens are structured so a dark theme can
  be added later.
- **Notifications:** the snackbar (`useSnackbar`) is the one system.
- **Kit page:** route `/ui-kit` in the app, rendering the real components. Open
  in development, admins only in production, not in the sidebar.

## Tokens

| Token | Value | Use |
|---|---|---|
| `primary` / `primary-hover` / `primary-subtle` | `#2354BF` / `#1D4699` / `#EFF6FF` | actions, selection, highlights |
| `foreground` | `#0F172B` | titles, values, body |
| `foreground-secondary` | `#475569` | labels, table headers |
| `muted-foreground` | `#64748B` | hints, captions |
| `foreground-subtle` | `#94A3B8` | placeholders, dashes, disabled |
| `background` / `surface-muted` / `muted` | `#FFFFFF` / `#F8FAFC` / `#F1F5F9` | page, header & zebra, hover & chips |
| `border` / `border-strong` | `#E2E8F0` / `#CAD5E2` | cell lines / outer outlines |
| `success`, `warning`, `destructive` (+ `-subtle`) | `#059669`, `#D97706`, `#DC2626` (`#ECFDF5`, `#FFFBEB`, `#FEF2F2`) | status |

Type: Tailwind `text-xs`…`text-3xl` plus `text-2xs` (11px) for dense tables.
Weights 400 / 500 / 600, 700 only for big numbers. Radius: `sm` 4, `md` 6,
`lg` 8 (default), `xl` 12, `full`. Shadow: `xs` inputs, `sm` cards, `md`
dropdowns, `lg` dialogs. Spacing: 24px between sections, 16px panel padding,
8/12px group gaps, controls 32/36/40px.

Added during the migration:

- `scrim` (`#000000`, always with opacity, e.g. `bg-scrim/50`) for overlays.
- `shadow-pin-start` / `shadow-pin-end` for pinned table columns.
- Category scale for groups with no status meaning (inspection types, reserve,
  hours): `category-violet`, `-rose`, `-pink`, `-indigo`, `-teal`, `-cyan`,
  `-lime`, `-fuchsia`; lighter shades via opacity (`bg-category-teal/10`).
- Brand identity, login screen and logo only: `brand-navy`, `brand-purple`
  (`-light`, `-dark`, `-deep`), `brand-blue` (`-light`), `brand-violet`.

The legacy names (`brand`, `error`, `dimmed`, `background-secondary`,
`corporate-*`) and the stale `.dark` block were removed once nothing used them.

## Components (one per job)

Button (`default`, `outline`, `secondary`, `ghost`, `destructive`, `success`,
`link`; `loading`), Badge (`neutral`, `primary`, `success`, `warning`, `danger`,
`*_solid`), Input / Textarea / Select / SearchableSelect / pickers / Checkbox /
Switch, Alert (`default`, `info`, `success`, `warning`, `destructive`), Card,
PageHeader, SegmentedTabs, StatCard, EmptyState, Skeleton / TableSkeleton,
snackbar, Modal (+ ConfirmationDialog), Table / PaginatedTable / Filters, and a
bordered grid table for dense measurement tables (added during migration).

To be removed: `enhanced-*`, `loading-button`, `toast` / `toaster` /
`use-toast` / `sonner`, `page-layout`, `grid-layout`, `content-container`,
`form-section`, `form-wrapper`, `field-group`, `data-list`, `multi-step-form`,
`loading-card`, `drawer`, `alert-dialog`, `validation-message`,
`styles/globals.css`.

## Phase 2: kit everywhere (added 2026-11-10)

Pages use kit components, not raw elements: `Button` (adds `outline-success`,
`outline-warning`, `outline-destructive`; sizes `xs`, `icon-sm`), `Input`
(`variant="compact"` for toolbars / dropdown search / dense forms,
`variant="cell"` for editors inside table cells), `Label`, `Checkbox`,
`RadioGroup`, `SearchableSelect` (adds `clearable`, `loading`), `Table` parts
(`wrapper={false}` when the table sits in its own scroll frame),
`PageHeader` (`variant="card"` with `icon` / `filters` for report pages,
`leading` for a Back button), `SegmentedTabs` (`size="sm"`), and new
`CardButton` (clickable tiles), `Chip` (filter pills, removable filters) and
`DisclosureTrigger` (expandable rows). Real one-offs carry
`kit-allow: <reason>` (login / public-form heroes, sidebar navigation, the
railway stamp artwork).

## Guardrails

- `npm run lint:tokens` lists hardcoded values; `--strict` fails on any; it runs
  as part of `npm run lint`. It flags hex and palette colour classes,
  `white` / `black`, `bg-[var(--x)]`, colours set from JS (hex / rgb literals),
  arbitrary font sizes, shadows and radii, and radii above `xl`. Outside `ui/`
  it also flags raw `<button>`, `<input>`, `<table>`, `<label>` and page-level
  `<h1>`, and font weights off the scale.
- `scripts/migrate-colors.mjs` rewrites all of the above to tokens; dead
  `dark:` variants are removed. `scripts/codemods/error-box-to-alert.py` turns
  hand-written error boxes into `<Alert variant="destructive">`.
- Categorical data-viz colours (chart series, per-category chips) are allowed
  only through `chart-*` tokens or in files marked `tokens-allow-file`.

## Success

`npm run lint:tokens -- --strict` passes on `app/`, `components/`, `layout/`,
`ui/`; the removed components no longer exist; every page renders with the
standard components and no visible regressions.

## Page standards (binding, 2026-11-10)

Every page is built the same way. No page invents its own header, filter
strip, buttons or wording.

### Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│ [icon] Title                               [primary] [Excel][PDF] │  PageHeader
│        one meta line (org · period · "holatiga")                 │
├──────────────────────────────────────────────────────────────────┤
│ LABEL          LABEL                        LABEL                │  FilterBar
│ [control  ▾]   [📅 dd.MM.yyyy – dd.MM.yyyy] [control ▾] [↺ Tozalash]
└──────────────────────────────────────────────────────────────────┘
  page content (tables, cards) below, 24px gap
```

### PageHeader

- One style for every page (list pages and reports): the card. Icon tile
  (the page's sidebar icon), title, one meta line, actions on the right,
  FilterBar inside the card. Optional `leading` (Back) and breadcrumbs.
- Actions order, left to right: page actions (Add, Edit), then exports.
  Add is `Button` default size sm with a Plus icon and the label
  `Common.add`.

### FilterBar

- Every filter is a `FilterField` with a label (xs, uppercase, muted). No
  unlabelled controls, no placeholders standing in for labels.
- Every control is 36px tall (`h-9`). Widths: sm 140px, md 200px, lg 280px.
- Controls: `SearchInput` (Common.search), `SearchableSelect`,
  `DateRangeField` (one control for a period, optional time; never split
  date / time boxes), `Checkbox` group.
- Filters apply immediately (text after 400ms debounce, date range when the
  picker closes). There is no Apply / Yangilash / Qo'llash button.
- One `FilterReset` button at the end: outline, sm, RotateCcw icon +
  `Common.reset` ("Tozalash"); shown only when a filter differs from its
  default.

### Exports

- `ExportActions` only: `Excel` (success), `PDF` / `Word` (outline), size sm,
  icons FileSpreadsheet / FileDown / FileText, labels `Common.export_excel`
  / `export_pdf` / `export_word`, spinner while exporting.

### Wording

- Shared actions and labels come from `Common.*` (add, edit, delete, save,
  cancel, reset, search, all, organization, period, export_*, exporting).
  Pages do not define their own copies of these.
