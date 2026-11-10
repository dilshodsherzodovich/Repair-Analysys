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

### Anatomy (classic header + filter card, decided 2026-11-10)

```
Home › Reports                                                          breadcrumbs (optional)
Title                                         [view switch] [Add] [Excel][PDF]
one meta line (org · period · "holatiga")
┌──────────────────────────────────────────────────────────────────┐
│ LABEL          LABEL                        LABEL                │  filter card
│ [control  ▾]   [📅 dd.MM.yyyy – dd.MM.yyyy] [control ▾] [↺ Tozalash]
└──────────────────────────────────────────────────────────────────┘
  page content (tiles, tables) below, 24px gap
```

### PageHeader

- One header for every page (list pages and reports): breadcrumbs
  (optional), the title (xl / 2xl bold) with one meta line under it,
  optional `leading` (Back). No card, no icon tile.
- Filters go in the `filters` slot and render in the filter card under the
  header. The page's actions live in the same card, on the right and
  bottom-aligned with the controls; never split between title and card.
  Only a page without filters shows its actions next to the title.
  Sections use `FilterPanel`, the same card with their actions.
- Actions order, left to right: view switch (SegmentedTabs /
  ListStatsSwitch), page actions (AddButton, ...), then ExportActions.
- A page with a list and statistics shows one at a time: `ListStatsSwitch`
  (Ro'yxat / Statistika, `?view=stats`) first in the actions. In the
  statistics view the filter card holds the statistics filters.
- Section tabs use the kit `Tabs` as is: a compact grey track, left-aligned.

### Dropdowns and dates

- Select and multi-select fields are 36px and one line. Their list is at
  least as wide as the field and grows for long options (up to 24rem).
- A multi-select shows the first choice and "+N"; its list has checkboxes.
- Calendars follow the app language (uz / ru) and start weeks on Monday.

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

### Page spacing

- Every page's root is `<Page>` (sections 24px apart). The app layout already
  pads the page and paints the background.
- Sections never add their own page gutters or gaps (`px-6`, `py-4`, `mt-6`,
  `mb-4`, `pb-12`, `min-h-screen`, page background). A section that renders
  several blocks (a tab, a report body) uses `<Page>` as its own root.

### Summary tiles

- Every count / total tile is a `StatCard` in a `StatGrid`: small uppercase
  label (+ optional icon), the number (text-2xl bold, tabular), optional
  caption (a note, a share, a progress bar or a sparkline).
- `tone` (neutral / primary / success / warning / danger / violet) colours
  the top accent bar and the number; nothing else colours a tile.
- A tile that filters the page takes `onClick` + `selected`; the others
  become `muted` while one is selected.
- Cards with richer content (sub-rows, per-month bars) are `CardButton`s.

### Tables

- Record lists use `PaginatedTable`; report and matrix tables use the kit
  `Table` parts. `GridTable` is gone: a dense measurement grid is
  `<Table frame maxHeight bordered>`.
- The table owns the look: header on surface-muted with small
  foreground-secondary text, the same cell padding and lines, row hover
  tint, no zebra striping. A table chooses only `bordered` (full grid),
  `density="compact"` and `frame` (+ `maxHeight` for a pinned header).
- Cells set only content decisions: alignment, width, pinning (with a solid
  background), and status highlights (primary-subtle, destructive-subtle,
  ...). No per-cell backgrounds, borders, padding or text sizes.
- A table's scroll box is `frame`, never a hand-built wrapper div.

### Forms

- Every labelled control is a `Field`: label (sm, medium,
  foreground-secondary) above the control, a red `*` when `required`, then
  either `hint` or `error` (xs; error in destructive). A control in error
  also gets `aria-invalid`, which turns its border red.
- Fields sit in a `FieldGrid` (`columns` 1–4, 16px gaps, one column on
  phones); `span="full"` takes a whole row. Long forms group fields in
  `FormSection`s (title, optional description and actions, a line between).
- One control height: inputs, selects, pickers and buttons are 36px. Controls
  carry no outer margin; only the grid spaces them.
- A form's blocks are `space-y-5`.

### Modals

- `Modal` is the only dialog (`ui/dialog.tsx` re-exports its parts for kit
  internals). Title bar with an optional one-line description, a body that
  scrolls inside 90vh, sizes sm 448 / md 512 / lg 672 / xl 896 / 2xl 1152.
- Actions are a `ModalFooter`, the body's (or the form's) last child, which
  sticks to the bottom edge: Cancel (outline) then the primary action,
  right-aligned; a Delete goes on the far left. Read-only modals have a
  single outline Close.
- No Card wrappers, hand-built button rows or own scroll containers inside a
  modal.

### Data states

- Every place that loads data shows the same three states from
  `ui/empty-state.tsx`: `LoadingState` (spinner + "Yuklanmoqda…"),
  `EmptyState` (inbox icon + "Ma'lumot topilmadi", optional description and
  action) and `ErrorState` (warning icon, message, Retry).
- `size`: `page` fills the content area, `section` (default) sits in a card,
  panel or modal, `compact` fits small panels and table rows. Inside a table
  the state goes in `TableStateRow` under the header; `PaginatedTable` does
  this itself (and now shows its error).
- A failed load with nothing to show is an `ErrorState`; a failure while the
  page still shows content is a destructive `Alert` above it. Results of an
  action go to the snackbar.
- Inline progress (a "Saving…" next to a toolbar, a spinner in a button)
  stays inline; it is not a data state.
- Default texts come from `Common` (loading, no_data, load_error, retry).

### Badges

- Status pills are `Badge` with a subtle variant: neutral, primary, success,
  warning, danger. Solid variants (`*_solid`) are for counts and strong
  emphasis only. `size="sm"` inside dense table cells. No hand-made
  rounded-full spans; the old alias names (info, destructive, *_outline,
  secondary, default, outline) are gone.

### Formats

- Display formatting goes through `lib/format`: `formatNumber` (thousands
  grouped with a space, optional `digits`), `formatMoney` ("1 234 so'm"),
  `formatDate` (dd.MM.yyyy), `formatDateTime` (dd.MM.yyyy HH:mm),
  `formatTime` (HH:mm), `formatShortDateTime` (dd.MM HH:mm, dense report
  cells). A missing value prints "—".
- API parameters keep "yyyy-MM-dd". Timeline headings may spell the month
  ("10 noy 2026"); nowhere else.

### Wording

- Shared actions and states read from `Common` (add, edit, delete, save,
  cancel, reset, search, all, loading, no_data, load_error, retry, close,
  back); no hard-coded copies in components.
