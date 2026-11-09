# Design System Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every page, component and layout onto the design tokens and the one-component-per-job UI kit, then lock it in with a strict check.

**Architecture:** The foundation (tokens in `app/globals.css`, re-skinned `ui/` components, `/ui-kit` page, `lint:tokens` and `migrate-colors` scripts) is already built. This plan first finishes the toolkit (notifications, duplicate removal, grid table), then migrates the app in six area batches, each one mechanical colour rewrite + a short list of manual fixes + a strict check on the batch's files, and finally removes the legacy aliases and turns the check strict for the whole repo.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4 (CSS-variable tokens via `@theme inline`), Radix UI, class-variance-authority, next-intl, Node scripts (`scripts/*.mjs`).

**Spec:** `docs/superpowers/specs/2026-11-09-design-system-design.md`

## Global Constraints

- Primary colour is `#2354BF` (`primary`); never introduce another blue.
- No hex colours in class names (`[#…]`) and no Tailwind palette colour classes (`bg-blue-600`, `text-gray-500`, …) in `app/`, `components/`, `layout/`, `ui/`. Use token classes listed in the spec.
- Categorical data-viz colours only through `chart-1` … `chart-5`, or in a file whose first comment contains `tokens-allow-file: <reason>`.
- Notifications only through `useSnackbar()` from `@/providers/snackbar-provider`.
- Keep the current look: a batch must not change layout, spacing or sizes beyond what the token mapping implies.
- No test framework exists and the team does not run `tsc` / `next build` as part of this work; verification per task is `npm run lint:tokens -- --strict <files>` plus a visual check of the listed pages by the user.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Colour mapping (used by `scripts/migrate-colors.mjs`, repeated here for manual fixes)

| Old | Token class (bg / border / ring) | As text |
|---|---|---|
| `#2354BF` `#2563EB` `#4978CE` `#3B82F6` `blue-500/600` | `primary` | `text-primary` |
| `#1D4ED8` `#1E40AF` `blue-700/800` | `primary-hover` | `text-primary-hover` |
| `#EFF6FF` `#DBEAFE` `blue-50/100` | `primary-subtle` | — |
| `#0F172B` `#1F2937` `#1E293B` `#111827` `gray/slate-800/900` | `foreground` | `text-foreground` |
| `#374151` `#475569` `#334155` `gray/slate-600/700` | `foreground-secondary` | `text-foreground-secondary` |
| `#6B7280` `#64748B` `gray/slate-500` | `muted-foreground` | `text-muted-foreground` |
| `#9CA3AF` `#94A3B8` `#90A1B9` `gray/slate-400` | `foreground-subtle` | `text-foreground-subtle` |
| `#D1D5DB` `#CAD5E2` `#CBD5E1` `gray/slate-300` | `border-strong` | `text-foreground-subtle` |
| `#E5E7EB` `#E2E8F0` `gray/slate-200` | `border` | `text-foreground-subtle` |
| `#F3F4F6` `#F1F5F9` `gray/slate-100` | `muted` | — |
| `#F9FAFB` `#F8FAFC` `gray/slate-50` | `surface-muted` | — |
| `#10B981` `#059669` `green/emerald-500…700` | `success` | `text-success` |
| `green/emerald-50/100` | `success-subtle` | — |
| `#F59E0B` `#D97706` `amber/yellow/orange-500…700` | `warning` | `text-warning` |
| `amber/yellow/orange-50/100` | `warning-subtle` | — |
| `#DC2626` `#FF5959` `#EF4444` `red-500…700` | `destructive` | `text-destructive` |
| `red-50/100` | `destructive-subtle` | — |
| status `-200/-300` | `<status>/30` | — |

**Manual rules for what the script leaves:**

| Leftover | Replace with |
|---|---|
| Lighter / darker shade of a status (`green-800`, `red-400`, `blue-300`, `amber-400`) | the base token; for borders `<token>/30`, for hover `<token>/90` |
| `text-white` on a coloured fill | `text-primary-foreground` / `text-success-foreground` / `text-destructive-foreground` / `text-warning-foreground` |
| Categorical series colours (purple, indigo, rose, teal, cyan, `#644AC4`, `#927BE3`, `#214B66`) in charts or per-category chips | `chart-1` … `chart-5`; if more categories than chart tokens, add `tokens-allow-file: categorical colours` to the file's first comment |
| Hand-written error box `rounded-xl border border-red-200 bg-red-50 … text-red-700` | `<Alert variant="destructive"><AlertDescription>…</AlertDescription></Alert>` from `@/ui/alert` |
| Hand-written green Excel / export button | `<Button variant="success">` |
| Hand-written List / Group toggle (`TabsTrigger` with `data-[state=active]:bg-blue-600`) | `<SegmentedTabs>` from `@/ui/segmented-tabs` |
| Hand-written stat / KPI tile | `<StatCard>` from `@/ui/stat-card` |

## Batch procedure (every migration task follows these steps)

1. Run the colour rewrite on the task's files:
   `node scripts/migrate-colors.mjs <files>` — prints, per file, how many classes it replaced and which it left.
2. Fix every leftover by hand using the manual rules above, plus the task's own manual items.
3. Run `npm run lint:tokens -- --strict <files>` — expected output ends with `0 hardcoded colour(s)` and exit code 0.
4. Ask the user to open the task's pages and confirm nothing looks broken; fix what they report.
5. Commit the task's files.

---

### Task 1: Commit the foundation

**Files:**
- Commit: `app/globals.css`, `app/ui-kit/page.tsx`, `ui/*.tsx` (re-skinned), `ui/segmented-tabs.tsx`, `ui/stat-card.tsx`, `scripts/check-tokens.mjs`, `scripts/migrate-colors.mjs`, `package.json`, `docs/superpowers/specs/2026-11-09-design-system-design.md`, `docs/superpowers/plans/2026-11-09-design-system-migration.md`

**Interfaces:**
- Produces: token classes listed in the spec; `npm run lint:tokens`; `node scripts/migrate-colors.mjs [--dry] <files>`; `<SegmentedTabs value onValueChange options>`; `<StatCard label hint value caption selected muted onClick>`; `Button` prop `loading` and variant `success`; Badge variants `neutral|primary|success|warning|danger|*_solid`; Alert variants `info|success|warning|destructive`.

- [ ] **Step 1: Check the working tree contains only the foundation**

Run: `git status --short`
Expected: only the files listed above (modified `ui/*`, `app/globals.css`, `package.json`; new `app/ui-kit/`, `scripts/`, `ui/segmented-tabs.tsx`, `ui/stat-card.tsx`, `docs/superpowers/...`).

- [ ] **Step 2: Check the kit's own files are clean**

Run: `npm run lint:tokens -- --strict app/ui-kit ui/button.tsx ui/badge.tsx ui/input.tsx ui/textarea.tsx ui/select.tsx ui/alert.tsx ui/card.tsx ui/page-header.tsx ui/tabs.tsx ui/empty-state.tsx ui/skeleton.tsx ui/snackbar.tsx ui/filters.tsx ui/paginated-table.tsx ui/pagination.tsx ui/date-picker.tsx ui/datetime-picker.tsx ui/time-picker.tsx ui/file-upload.tsx ui/confirmation-dialog.tsx ui/error-card.tsx ui/sidebar.tsx ui/segmented-tabs.tsx ui/stat-card.tsx`
Expected: `0 hardcoded colour(s)`, exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/ui-kit ui scripts package.json docs/superpowers/specs/2026-11-09-design-system-design.md docs/superpowers/plans/2026-11-09-design-system-migration.md
git commit -m "feat(ui): design tokens, UI kit page and token tooling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Tooling — allow marker and font-size mapping

**Files:**
- Modify: `scripts/check-tokens.mjs` (file loop)
- Modify: `scripts/migrate-colors.mjs` (add font-size rewrite after the colour rewrite)

**Interfaces:**
- Produces: files whose first 5 lines contain `tokens-allow-file:` are skipped by `lint:tokens`; `migrate-colors` also rewrites `text-[9px]`, `text-[10px]`, `text-[11px]` → `text-2xs` and `text-[12px]` → `text-xs`.

- [ ] **Step 1: Prove the gap — a marked file is still reported**

```bash
mkdir -p .tmp-tokens && printf '// tokens-allow-file: categorical colours\nexport const a = "bg-violet-500";\n' > .tmp-tokens/a.tsx
node scripts/check-tokens.mjs .tmp-tokens
```
Expected: `1 hardcoded colour(s) in 1 of 1 file(s).`

- [ ] **Step 2: Skip marked files in `check-tokens.mjs`**

In the `for (const file of files)` loop, right after `const lines = readFileSync(file, "utf8").split("\n");`, add:

```js
  // Files that legitimately need raw colours (categorical chart series) opt out
  if (lines.slice(0, 5).some((line) => line.includes("tokens-allow-file:"))) {
    continue;
  }
```

- [ ] **Step 3: Verify the marker works and plain files still fail**

```bash
node scripts/check-tokens.mjs .tmp-tokens
printf 'export const b = "text-[#0F172B]";\n' > .tmp-tokens/b.tsx
node scripts/check-tokens.mjs .tmp-tokens
```
Expected: first run `0 hardcoded colour(s) in 0 of 1 file(s).`; second run `1 hardcoded colour(s) in 1 of 2 file(s).`

- [ ] **Step 4: Add the font-size rewrite to `migrate-colors.mjs`**

Above `const args = process.argv.slice(2);` add:

```js
// Arbitrary font sizes -> the type scale (11px step for dense tables)
const FONT_SIZES = { "9px": "text-2xs", "10px": "text-2xs", "11px": "text-2xs", "12px": "text-xs" };
const FONT_SIZE = /\btext-\[(9px|10px|11px|12px)\](?![\w-])/g;
```

and replace

```js
  const output = source.replace(CLASS, (match, prefix, color, opacity = "") => {
```

with

```js
  const output = source
    .replace(FONT_SIZE, (_match, size) => {
      changes++;
      return FONT_SIZES[size];
    })
    .replace(CLASS, (match, prefix, color, opacity = "") => {
```

(the rest of the callback and its closing `});` stay as they are).

- [ ] **Step 5: Verify the rewrite**

```bash
printf 'export const c = "text-[11px] text-[12px] text-[13px] bg-[#2354BF]";\n' > .tmp-tokens/c.tsx
node scripts/migrate-colors.mjs .tmp-tokens/c.tsx && cat .tmp-tokens/c.tsx
rm -r .tmp-tokens
```
Expected: `.tmp-tokens/c.tsx: 3 replaced` and file content `text-2xs text-xs text-[13px] bg-primary`.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-tokens.mjs scripts/migrate-colors.mjs
git commit -m "chore(tokens): allow-file marker and font-size mapping in token scripts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: One notification system (fixes silent toasts)

`<Toaster />` is not mounted anywhere, so every `toast()` call is silently dropped today — including the save / error messages on bandages, crankshaft and the locomotive passport. Moving them to the snackbar makes them visible.

**Files:**
- Modify: `app/bandages/[orgId]/components/bandages-table.tsx`
- Modify: `app/bandages/[orgId]/page.tsx`
- Modify: `app/crankshaft/[orgId]/page.tsx`
- Modify: `app/depo/[id]/locomotive/[locomotiveId]/components/locomotive-passport-classic.tsx`
- Modify: `app/depo/[id]/locomotive/[locomotiveId]/components/locomotive-passport-form.tsx`
- Delete: `ui/toast.tsx`, `ui/toaster.tsx`, `ui/use-toast.ts`, `ui/sonner.tsx`

**Interfaces:**
- Consumes: `useSnackbar()` → `{ showSuccess(title, message?), showError(title, message?), showWarning(title, message?), showInfo(title, message?) }`.

- [ ] **Step 1: List every toast call**

Run: `grep -rn "toast(" app/bandages app/crankshaft "app/depo/[id]/locomotive/[locomotiveId]/components"`
Expected: the calls in the five files above, nothing else.

- [ ] **Step 2: Convert each file**

In each file replace the import

```tsx
import { toast } from "@/ui/use-toast";
```

with

```tsx
import { useSnackbar } from "@/providers/snackbar-provider";
```

add at the top of the component that calls `toast` (for `bandages-table.tsx` inside `LocomotiveRows`; for the crankshaft page inside both `LocomotiveRows` and `CrankshaftPageContent`; for the bandages page inside `BandagesPageContent`):

```tsx
  const { showSuccess, showError } = useSnackbar();
```

and convert calls by this rule:

```tsx
// before
toast({ title: A, description: B });
toast({ variant: "destructive", title: A, description: B });
// after
showSuccess(A, B);
showError(A, B);
```

`description` may be `undefined`; pass it through as the second argument unchanged. For `useCallback` hooks that call `toast`, add `showError` / `showSuccess` to the dependency array.

- [ ] **Step 3: Delete the old system and confirm nothing imports it**

```bash
git rm ui/toast.tsx ui/toaster.tsx ui/use-toast.ts ui/sonner.tsx
grep -rnE 'ui/(toast|toaster|use-toast|sonner)"' app components layout providers ui
```
Expected: the grep prints nothing.

- [ ] **Step 4: Visual check**

Ask the user to save a bandage edit, save a crankshaft edit, and export a passport, and confirm a snackbar appears top-right each time (green on success, red on a forced error such as a non-numeric bandage value).

- [ ] **Step 5: Commit**

```bash
git add -A app/bandages app/crankshaft "app/depo/[id]/locomotive/[locomotiveId]/components" ui
git commit -m "fix(ui): route all notifications through the snackbar

The shadcn Toaster was never mounted, so toast() calls showed nothing.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Remove duplicate and unused components

**Files:**
- Modify: `components/delays/delay-modal.tsx`, `components/document/document-actions.tsx`, `components/document/document-search.tsx`, `components/document/document-viewer.tsx`, `components/organizations/organization-modal.tsx`, `components/users/user-modal.tsx`
- Delete: `ui/enhanced-button.tsx`, `ui/enhanced-input.tsx`, `ui/enhanced-select.tsx`, `ui/enhanced-textarea.tsx`, `ui/enhanced-card.tsx`, `ui/loading-button.tsx`, `ui/page-layout.tsx`, `ui/grid-layout.tsx`, `ui/content-container.tsx`, `ui/form-section.tsx`, `ui/form-wrapper.tsx`, `ui/field-group.tsx`, `ui/data-list.tsx`, `ui/multi-step-form.tsx`, `ui/loading-card.tsx`, `ui/drawer.tsx`, `ui/alert-dialog.tsx`, `ui/validation-message.tsx`, `styles/globals.css`

**Interfaces:**
- Consumes: `Button` (`variant`, `size`, `loading`), `Input`, `SearchableSelect` / `Select*` from `@/ui/select`.

- [ ] **Step 1: See exactly what the six files use**

Run: `grep -nE 'Enhanced[A-Za-z]+|LoadingButton|from "@/ui/(enhanced-|loading-button)' components/delays/delay-modal.tsx components/document/document-actions.tsx components/document/document-search.tsx components/document/document-viewer.tsx components/organizations/organization-modal.tsx components/users/user-modal.tsx`

- [ ] **Step 2: Replace each usage with the standard component**

| Old | New |
|---|---|
| `<LoadingButton loading={x} …>` | `<Button loading={x} …>` |
| `<EnhancedButton variant="primary" loading={x} …>` | `<Button loading={x} …>` |
| `<EnhancedButton variant="secondary" / "outline">` | `<Button variant="outline">` |
| `<EnhancedButton variant="danger">` | `<Button variant="destructive">` |
| `<EnhancedInput label=… error=… …>` | `<div className="space-y-1.5"><Label>…</Label><Input aria-invalid={!!error} …/>{error && <p className="text-xs text-destructive">{error}</p>}</div>` |
| `<EnhancedSelect options=… value=… onChange=…>` | `<SearchableSelect options={…} value={…} onValueChange={…} />` |

Read each enhanced component's props first (`ui/enhanced-*.tsx`) so every prop in use has a mapped equivalent; keep labels, placeholders and handlers identical.

- [ ] **Step 3: Delete the files and confirm nothing imports them**

```bash
git rm ui/enhanced-button.tsx ui/enhanced-input.tsx ui/enhanced-select.tsx ui/enhanced-textarea.tsx ui/enhanced-card.tsx ui/loading-button.tsx ui/page-layout.tsx ui/grid-layout.tsx ui/content-container.tsx ui/form-section.tsx ui/form-wrapper.tsx ui/field-group.tsx ui/data-list.tsx ui/multi-step-form.tsx ui/loading-card.tsx ui/drawer.tsx ui/alert-dialog.tsx ui/validation-message.tsx styles/globals.css
grep -rnE 'ui/(enhanced-|loading-button|page-layout|grid-layout|content-container|form-section|form-wrapper|field-group|data-list|multi-step-form|loading-card|drawer|alert-dialog|validation-message)|styles/globals' app components layout providers ui hooks lib
```
Expected: the grep prints nothing.

- [ ] **Step 4: Confirm `ui/` is clean**

Run: `npm run lint:tokens -- --strict ui`
Expected: `0 hardcoded colour(s)`, exit 0.

- [ ] **Step 5: Visual check**

Ask the user to open: the delay create/edit modal, the documents page (search, view, actions), organization create modal, user create modal.

- [ ] **Step 6: Commit**

```bash
git add -A ui styles components/delays/delay-modal.tsx components/document components/organizations/organization-modal.tsx components/users/user-modal.tsx
git commit -m "refactor(ui): one component per job; remove duplicate and unused components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Grid table and inline editing in the kit

The bordered measurement table (sticky header, sticky leading columns, per-cell borders) is hand-written in bandages and crankshaft with identical class strings. Make it a kit piece and move inline editing next to it.

**Files:**
- Create: `ui/grid-table.tsx`
- Move: `components/locomotive-values/inline-edit.tsx` → `ui/inline-edit.tsx`
- Modify: `app/bandages/[orgId]/components/bandages-table.tsx`, `app/crankshaft/[orgId]/page.tsx` (use the new pieces)
- Modify: `app/ui-kit/page.tsx` (table section uses `GridTable`)

**Interfaces:**
- Produces:
  - `gridHeadClass: string`, `gridCellClass: string`
  - `GridTable({ maxHeight?: string, className?, children })` — frame + `<table>`
  - `stickyCol(left: number, width: number): { className: string; style: React.CSSProperties }`
  - `CellInput`, `EditActions`, `firstMessage` re-homed at `@/ui/inline-edit` with unchanged signatures.

- [ ] **Step 1: Create `ui/grid-table.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dense bordered table for measurements: outline in border-strong, header on
 * surface-muted, every cell draws its own right/bottom line. border-separate
 * (not collapse) so the lines stay with the sticky header and columns.
 */
export const gridHeadClass =
  "py-3 px-3 bg-surface-muted text-foreground-secondary font-medium border-r border-b border-border whitespace-nowrap";
export const gridCellClass =
  "py-2.5 px-3 border-r border-b border-border whitespace-nowrap";

export function GridTable({
  maxHeight = "75vh",
  className,
  children,
}: {
  maxHeight?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-auto rounded-lg border border-border-strong bg-background",
        className,
      )}
      style={{ maxHeight }}
    >
      <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

/**
 * Pins a column on horizontal scroll. `left` is the sum of the widths of the
 * pinned columns before it. Give pinned cells a solid background.
 */
export function stickyCol(left: number, width: number) {
  return {
    className: "sticky z-[5]",
    style: { left, width, minWidth: width, maxWidth: width } as React.CSSProperties,
  };
}
```

- [ ] **Step 2: Move inline editing and update its importers**

```bash
git mv components/locomotive-values/inline-edit.tsx ui/inline-edit.tsx
grep -rln "components/locomotive-values/inline-edit" app components | xargs sed -i 's#@/components/locomotive-values/inline-edit#@/ui/inline-edit#'
node scripts/migrate-colors.mjs ui/inline-edit.tsx
grep -rn "locomotive-values/inline-edit" app components
```
Expected: last grep prints nothing.

- [ ] **Step 3: Use the grid table in bandages and crankshaft**

In both files delete the local `headClass` / `cellClass` constants and import `gridHeadClass`, `gridCellClass`, `GridTable` from `@/ui/grid-table`; replace every `headClass` → `gridHeadClass`, `cellClass` → `gridCellClass`; replace

```tsx
<div className="rounded-lg border border-[#CAD5E2] overflow-auto max-h-[75vh] bg-white">
  <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
    …
  </table>
</div>
```

with

```tsx
<GridTable>
  …
</GridTable>
```

Keep the existing `stickyNo` / `stickyLocomotive` / `stickySection` Tailwind classes (they are static widths and already work); `stickyCol` is for new tables.

- [ ] **Step 4: Use `GridTable` in the kit's Table section**

In `app/ui-kit/page.tsx`, replace the table section's outer `div` + `table` with `<GridTable maxHeight="none">…</GridTable>` and the per-cell class strings with `gridHeadClass` / `gridCellClass`.

- [ ] **Step 5: Check and visual check**

Run: `npm run lint:tokens -- --strict ui/grid-table.tsx ui/inline-edit.tsx app/ui-kit`
Expected: `0 hardcoded colour(s)`.
Ask the user to open bandages, crankshaft and `/ui-kit#table`: tables look as before, sticky header and pinned columns still work, inline edit still works.

- [ ] **Step 6: Commit**

```bash
git add -A ui/grid-table.tsx ui/inline-edit.tsx components/locomotive-values app/bandages app/crankshaft app/ui-kit
git commit -m "feat(ui): grid table and inline editing as kit components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Batch 1 — Depo, bandages, crankshaft, duty-uzel (~330 colours)

**Files:**
- `app/bandages/[orgId]/page.tsx`, `app/bandages/[orgId]/components/bandage-group-cards.tsx`, `app/bandages/[orgId]/components/bandages-table.tsx`
- `app/crankshaft/[orgId]/page.tsx`
- `app/depo/[id]/components/locomotives-table.tsx`
- `app/depo/[id]/locomotive/[locomotiveId]/components/*.tsx` (13 files)
- `app/duty-uzel/[depoId]/page.tsx`, `app/duty-uzel/[depoId]/group/[groupId]/page.tsx`, `app/duty-uzel/[depoId]/components/component-group-accordion.tsx`, `app/duty-uzel/[depoId]/components/component-group-components.tsx`, `app/duty-uzel/[depoId]/components/component-registry-modal.tsx`

**Manual items for this batch:**
- `bandage-group-cards.tsx`: render each card with `<StatCard label hint value caption selected muted onClick>`; keep the grid wrapper and skeleton.
- Bandages / crankshaft: saved highlight `bg-[#F0FDF4]` → `bg-success-subtle`; `bg-[#F0F7FF]` (editing) → `bg-primary-subtle`; crankshaft header tints `bg-[#EFF6FF]` → `bg-primary-subtle`, `bg-[#FFF7ED]` → `bg-warning-subtle`; uneven / saved cell classes already map (`red-*`, `green-*`).
- Bandages / crankshaft / duty-uzel error boxes → `<Alert variant="destructive">`.
- `app/duty-uzel/[depoId]/page.tsx`: the List / Group `Tabs` toggle → `<SegmentedTabs>` with the same `value`, `onValueChange={handleViewChange}`, icons `List` / `LayoutList`, labels `t("view_list")` / `t("view_group")`.
- Excel colour constants in `utils/*-excel-export.ts` are ARGB strings for ExcelJS, not classes: leave them.

- [ ] **Step 1:** `node scripts/migrate-colors.mjs <the files above>`
- [ ] **Step 2:** Fix leftovers with the manual rules and the manual items above.
- [ ] **Step 3:** `npm run lint:tokens -- --strict app/bandages app/crankshaft app/depo app/duty-uzel` → expected `0 hardcoded colour(s)`.
- [ ] **Step 4:** Visual check by the user: bandages (cards, filter, edit, saved highlight, red uneven cells), crankshaft (edit, tints), depo list, locomotive passport (classic and `?design=new`), duty-uzel list + group view + group window.
- [ ] **Step 5:** Commit:

```bash
git add app/bandages app/crankshaft app/depo app/duty-uzel
git commit -m "refactor(depo): migrate depo, bandages, crankshaft and duty-uzel to design tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Batch 2 — Delays (~385 colours)

**Files:**
- `app/delays/page.tsx`, `app/delayed-report/page.tsx`, `app/delayed-repair-duration-report/page.tsx`
- `components/delays/delay-reports-filters.tsx`, `components/delays/delay-reports-table-by-delay-type.tsx`, `components/delays/delay-reports-table-freight.tsx`, `components/delays/depot-reason-reports-table.tsx`, `components/delays/sriv-payment-drilldown-modal.tsx`, `components/delays/sriv-payment-report.tsx`, `components/delays/upload-protocol-modal.tsx`, `components/delays/delay-modal.tsx`

**Manual items for this batch:**
- The freight / by-type report tables colour columns per delay category (purple, indigo, rose, teal…). Map up to five categories to `chart-1` … `chart-5`; if a table needs more, add `// tokens-allow-file: categorical delay-type colours` as the file's first comment and leave those classes.
- Totals rows: `bg-[#…]` greys → `bg-surface-muted` / `bg-muted`, bold `text-foreground`.

- [ ] **Step 1:** `node scripts/migrate-colors.mjs <the files above>`
- [ ] **Step 2:** Fix leftovers with the manual rules and the manual items above.
- [ ] **Step 3:** `npm run lint:tokens -- --strict app/delays app/delayed-report app/delayed-repair-duration-report components/delays` → expected `0 hardcoded colour(s)`.
- [ ] **Step 4:** Visual check by the user: delays list + create/edit modal + upload protocol, delayed report, delayed repair duration report, sriv payment report + drilldown, freight and by-type report tables.
- [ ] **Step 5:** Commit:

```bash
git add app/delays app/delayed-report app/delayed-repair-duration-report components/delays
git commit -m "refactor(delays): migrate delays and delay reports to design tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Batch 3 — Reports and dashboard (~560 colours)

**Files:**
- `app/page.tsx`, `app/inspection-report/page.tsx`, `app/unified-inspection-report/page.tsx`, `app/txk2-report/page.tsx`, `app/locomotive-gps-report/page.tsx`, `app/locomotive-mileage-report/page.tsx`, `app/locomotive-mileage-report/baseline-modal.tsx`, `app/locomotive-mileage-report/total-mileage-baseline-modal.tsx`, `app/locomotive-mileage-report/txk13-filters.tsx`, `app/replacement-schedule/components/replacement-modal.tsx`
- `components/reports/report-dashboard.tsx`, `components/reports/reports-date-filter.tsx`, `components/reports/report-organization-select.tsx`, `components/reports/excel-export-button.tsx`, `components/reports/inspections-excel-export-button.tsx`, `components/reports/pdf-export-button.tsx`, `components/reports/unified/*.tsx` (6 files)
- `components/statistics/stats-panel.tsx`

**Manual items for this batch:**
- `excel-export-button.tsx`, `inspections-excel-export-button.tsx`: hand-styled green buttons → `<Button variant="success" loading={…}>`. `pdf-export-button.tsx` → `<Button variant="destructive" …>` only if it is red today, else `variant="outline"`.
- `components/reports/unified/kpi-strip.tsx` and `stats-panel.tsx`: KPI tiles → `<StatCard>` where they are label + number + caption; keep their grid.
- Charts (recharts) series colours → `var(--chart-N)` / `chart-N` classes; more than five series → `tokens-allow-file: categorical chart series`.

- [ ] **Step 1:** `node scripts/migrate-colors.mjs <the files above>`
- [ ] **Step 2:** Fix leftovers with the manual rules and the manual items above.
- [ ] **Step 3:** `npm run lint:tokens -- --strict app/page.tsx app/inspection-report app/unified-inspection-report app/txk2-report app/locomotive-gps-report app/locomotive-mileage-report app/replacement-schedule components/reports components/statistics` → expected `0 hardcoded colour(s)`.
- [ ] **Step 4:** Visual check by the user: home dashboard, each report page above with data loaded, both Excel buttons, the PDF button, the mileage baseline modals.
- [ ] **Step 5:** Commit:

```bash
git add app/page.tsx app/inspection-report app/unified-inspection-report app/txk2-report app/locomotive-gps-report app/locomotive-mileage-report app/replacement-schedule components/reports components/statistics
git commit -m "refactor(reports): migrate reports and dashboard to design tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Batch 4 — Inspections, TU-152 / TU-137, annual plan (~545 colours)

**Files:**
- `app/tu-152/page.tsx`, `app/tu-137/page.tsx`, `app/tu-137/reports/page.tsx`
- `app/tu152-journal/page.tsx`, `app/tu152-journal/[locomotiveId]/page.tsx`, `app/tu152-journal/components/railway-stamp.tsx`, `app/tu152-journal/components/tu152-journal-modal.tsx`
- `app/annual-inspection-plan/page.tsx`, `app/annual-inspection-plan/plan-compare-grid.tsx`, `app/annual-inspection-plan/plan-grid-shared.ts`
- `app/inspections/page.tsx`, `components/inspections/inspection-grouped-table.tsx`
- `app/locomotive-passport-inspections/page.tsx`, `app/locomotive-passport-inspections/components/passport-inspection-modal.tsx`

**Manual items for this batch:**
- `plan-grid-shared.ts` holds class strings per inspection type (plan grid cells). Map status-like ones to tokens; per-type categorical colours → `chart-*` or `tokens-allow-file: inspection type colours`.
- `railway-stamp.tsx` imitates a printed stamp: keep its look; if its colours have no token, mark the file `tokens-allow-file: printed stamp`.

- [ ] **Step 1:** `node scripts/migrate-colors.mjs <the files above>`
- [ ] **Step 2:** Fix leftovers with the manual rules and the manual items above.
- [ ] **Step 3:** `npm run lint:tokens -- --strict app/tu-152 app/tu-137 app/tu152-journal app/annual-inspection-plan app/inspections components/inspections app/locomotive-passport-inspections` → expected `0 hardcoded colour(s)`.
- [ ] **Step 4:** Visual check by the user: TU-152, TU-137 + reports, TU-152 journal list / detail / modal, annual plan (plan grid + compare grid), inspections grouped table, passport inspections + modal.
- [ ] **Step 5:** Commit:

```bash
git add app/tu-152 app/tu-137 app/tu152-journal app/annual-inspection-plan app/inspections components/inspections app/locomotive-passport-inspections
git commit -m "refactor(inspections): migrate inspections, TU and annual plan to design tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Batch 5 — Defective works, rezerv, documents, history and the rest (~380 colours)

**Files:**
- `app/defective-works/page.tsx`, `app/defective-works/create/page.tsx`, `components/defective-works/*.tsx` (4 files)
- `app/rezerv/page.tsx`, `app/culprits/page.tsx`, `components/culprits/culprits-list-modal.tsx`, `app/locomotive-history/page.tsx`, `components/locomotive-history/LocomotiveHistoryTimeline.tsx`, `components/locomotive-history/LocomotiveInspectionsTimeline.tsx`
- `components/document/*.tsx` (5 files), `components/orders/order-modal.tsx`

**Manual items for this batch:**
- `components/document/document-status-badge.tsx`: hand-styled status pills → `<Badge variant="neutral|primary|success|warning|danger">`, mapping each status to the variant whose colour it has today.
- Timelines: dot / line colours per event type → status tokens where the meaning matches, otherwise `chart-*`.

- [ ] **Step 1:** `node scripts/migrate-colors.mjs <the files above>`
- [ ] **Step 2:** Fix leftovers with the manual rules and the manual items above.
- [ ] **Step 3:** `npm run lint:tokens -- --strict app/defective-works components/defective-works app/rezerv app/culprits components/culprits app/locomotive-history components/locomotive-history components/document components/orders` → expected `0 hardcoded colour(s)`.
- [ ] **Step 4:** Visual check by the user: defective works list + public create page + tabs + modals, rezerv, culprits + modal, locomotive history timelines, documents, order modal.
- [ ] **Step 5:** Commit:

```bash
git add app/defective-works components/defective-works app/rezerv app/culprits components/culprits app/locomotive-history components/locomotive-history components/document components/orders
git commit -m "refactor(app): migrate defective works, rezerv, documents and history to design tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Batch 6 — Login, auth, layout and admin (~230 colours)

**Files:**
- `app/login/page.tsx`, `app/auth/callback/page.tsx`, `app/unauthorized/page.tsx`
- `components/login/*.tsx` (4 files), `components/auth/auth-guard.tsx`
- `layout/header.tsx`, `layout/account-popover.tsx`
- `components/users/user-filters.tsx`, `components/users/user-modal.tsx`, `components/users/user-table.tsx`, `components/organizations/organization-filters.tsx`, `components/departments/department-filters.tsx`, `components/structure/structure-table.tsx`, `components/profile/password-change-modal.tsx`
- `components/language-switcher.tsx`, `components/page-loading.tsx`, `components/circular-progress.tsx`

**Manual items for this batch:**
- `components/login/brand-section.tsx` and `background-pattern.tsx` draw the brand panel (dark navy `#214B66`-style gradients). Navy has no token: add `--brand-navy: #214b66` to `:root` in `app/globals.css` with `--color-brand-navy: var(--brand-navy)` in `@theme inline`, add it to the kit's Brand colour group, and use `bg-brand-navy` / `from-brand-navy`.

- [ ] **Step 1:** `node scripts/migrate-colors.mjs <the files above>`
- [ ] **Step 2:** Fix leftovers with the manual rules and the manual items above.
- [ ] **Step 3:** `npm run lint:tokens -- --strict app/login app/auth app/unauthorized components/login components/auth layout components/users components/organizations components/departments components/structure components/profile components/language-switcher.tsx components/page-loading.tsx components/circular-progress.tsx` → expected `0 hardcoded colour(s)`.
- [ ] **Step 4:** Visual check by the user: login page, SSO callback, unauthorized page, header + account popover + language switcher, users / organizations / departments / structure admin pages and modals, password change modal.
- [ ] **Step 5:** Commit:

```bash
git add app/login app/auth app/unauthorized components layout app/globals.css app/ui-kit
git commit -m "refactor(app): migrate login, layout and admin pages to design tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Lock it in

**Files:**
- Modify: `app/globals.css` (remove legacy aliases)
- Modify: `package.json` (strict check)
- Modify: `app/ui-kit/page.tsx` (drop legacy note if any)

- [ ] **Step 1: Whole-repo strict check passes**

Run: `npm run lint:tokens -- --strict`
Expected: `0 hardcoded colour(s)`, exit 0. If not, migrate the listed files with the batch procedure before continuing.

- [ ] **Step 2: Remove legacy token names**

```bash
grep -rnE '\b(bg|text|border|ring|from|to|via)-(brand|brand-foreground|error|error-foreground|dimmed|background-secondary|corporate-[a-z]+)\b|corporate-(heading|subheading|body|card|button-primary|button-secondary)' app components layout ui
```

Replace each hit: `brand` → `primary-subtle`, `brand-foreground` → `primary`, `error` → `destructive`, `error-foreground` → `destructive-foreground`, `dimmed` → `foreground-subtle`, `background-secondary` → `surface-muted`, `corporate-primary` → `brand-navy`, `corporate-secondary` / `corporate-accent` → `primary`, `corporate-light` → `surface-muted`; `.corporate-*` utility classes → their token classes. Then delete from `app/globals.css`: the `--corporate-*` variables, the "Legacy names" block, their `--color-*` mappings, and the `.corporate-*` rules in `@layer base`. Re-run the grep; expected: nothing.

- [ ] **Step 3: Make the check part of linting**

In `package.json` change

```json
    "lint": "next lint",
```

to

```json
    "lint": "next lint && node scripts/check-tokens.mjs --strict",
```

- [ ] **Step 4: Visual check**

Ask the user to click through the sidebar once (one page per section) and `/ui-kit`.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css package.json app components layout ui
git commit -m "chore(ui): remove legacy tokens and enforce the token check in lint

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
