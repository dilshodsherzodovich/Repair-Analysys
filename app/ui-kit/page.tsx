"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  LayoutList,
  List,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { authService } from "@/api/services/auth.service";
import UnauthorizedPage from "@/app/unauthorized/page";
import { useSnackbar } from "@/providers/snackbar-provider";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/ui/alert";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Checkbox } from "@/ui/checkbox";
import { EmptyState } from "@/ui/empty-state";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Modal } from "@/ui/modal";
import { PageHeader } from "@/ui/page-header";
import { SearchableSelect } from "@/ui/select";
import { SegmentedTabs } from "@/ui/segmented-tabs";
import { Skeleton } from "@/ui/skeleton";
import { StatCard } from "@/ui/stat-card";
import { Switch } from "@/ui/switch";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Textarea } from "@/ui/textarea";
import { GridTable, gridCellClass, gridHeadClass } from "@/ui/grid-table";

/**
 * The design system reference: every token and the standard component for
 * each job, rendered from the real code. Open in development, admins only in
 * production. Not linked from the sidebar.
 */

const COLOR_GROUPS: {
  title: string;
  tokens: { name: string; use: string; text?: boolean }[];
}[] = [
  {
    title: "Brand",
    tokens: [
      { name: "primary", use: "Buttons, links, active and selected states" },
      { name: "primary-hover", use: "Hover / pressed on primary" },
      { name: "primary-subtle", use: "Selected rows, highlighted cells, info" },
    ],
  },
  {
    title: "Text",
    tokens: [
      { name: "foreground", use: "Titles, table values, body text", text: true },
      { name: "foreground-secondary", use: "Labels, table headers", text: true },
      { name: "muted-foreground", use: "Hints, captions, descriptions", text: true },
      { name: "foreground-subtle", use: "Placeholders, empty dashes, disabled", text: true },
    ],
  },
  {
    title: "Surfaces & lines",
    tokens: [
      { name: "background", use: "Page, cards, inputs" },
      { name: "surface-muted", use: "Table headers, zebra rows, sidebar" },
      { name: "muted", use: "Hover fills, chips, skeletons" },
      { name: "scrim", use: "Modal overlay, always with opacity: bg-scrim/50" },
      { name: "border", use: "Cell lines, dividers, card borders" },
      { name: "border-strong", use: "Outline of tables, inputs, boxes" },
    ],
  },
  {
    title: "Status",
    tokens: [
      { name: "success", use: "Saved, positive, Excel export" },
      { name: "success-subtle", use: "Success backgrounds" },
      { name: "warning", use: "Needs attention" },
      { name: "warning-subtle", use: "Warning backgrounds" },
      { name: "destructive", use: "Errors, delete, out of limit" },
      { name: "destructive-subtle", use: "Error backgrounds" },
    ],
  },
  {
    title: "Category (no status meaning)",
    tokens: [
      { name: "category-purple", use: "Reserve, hours and other neutral groups" },
      { name: "category-purple-subtle", use: "Their backgrounds" },
    ],
  },
];

const TYPE_SCALE = [
  { cls: "text-3xl", px: 30, use: "Rare: hero numbers" },
  { cls: "text-2xl", px: 24, use: "Page title, stat numbers" },
  { cls: "text-xl", px: 20, use: "Section title" },
  { cls: "text-lg", px: 18, use: "Dialog title, card title" },
  { cls: "text-base", px: 16, use: "Large body" },
  { cls: "text-sm", px: 14, use: "Default: body, inputs, tables" },
  { cls: "text-xs", px: 12, use: "Captions, sub-headers, badges" },
  { cls: "text-2xs", px: 11, use: "Dense tables only" },
];

const RADII = [
  { cls: "rounded-sm", px: 4, use: "Checkboxes, small chips" },
  { cls: "rounded-md", px: 6, use: "Inner items, menu rows" },
  { cls: "rounded-lg", px: 8, use: "Default: buttons, inputs, cards, tables" },
  { cls: "rounded-xl", px: 12, use: "Dialogs, large panels" },
  { cls: "rounded-full", px: null, use: "Badges, avatars" },
];

const SHADOWS = [
  { cls: "shadow-xs", use: "Inputs, buttons" },
  { cls: "shadow-sm", use: "Cards, active tab" },
  { cls: "shadow-md", use: "Dropdowns, popovers, selected card" },
  { cls: "shadow-lg", use: "Dialogs, notifications" },
];

const SPACING = [
  { rule: "Between page sections", cls: "space-y-6", px: 24 },
  { rule: "Card / panel padding", cls: "p-4", px: 16 },
  { rule: "Gap inside a group", cls: "gap-2 / gap-3", px: "8 / 12" },
  { rule: "Table cell padding", cls: "px-3 py-2.5", px: "12 × 10" },
  { rule: "Control heights", cls: "h-8 / h-9 / h-10", px: "32 / 36 / 40" },
];

/** Reads the live value of a CSS variable so swatches never drift from globals.css. */
function useCssVar(name: string) {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(
      getComputedStyle(document.documentElement)
        .getPropertyValue(`--${name}`)
        .trim()
        .toUpperCase(),
    );
  }, [name]);
  return value;
}

function Swatch({ name, use, text }: { name: string; use: string; text?: boolean }) {
  const value = useCssVar(name);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
      <div
        className="size-10 shrink-0 rounded-md border border-border"
        style={{ background: `var(--${name})` }}
      />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <code className="text-sm font-semibold text-foreground">{name}</code>
          <span className="font-mono text-xs text-muted-foreground">{value}</span>
        </div>
        <p className="text-xs text-muted-foreground">{use}</p>
        <p className="font-mono text-2xs text-foreground-subtle">
          {text ? `text-${name}` : `bg-${name} · text-${name} · border-${name}`}
        </p>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border-strong bg-background p-4", className)}>
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

const NAV = [
  ["colors", "Colors"],
  ["typography", "Typography"],
  ["radius-shadow", "Radius & shadow"],
  ["spacing", "Spacing"],
  ["buttons", "Buttons"],
  ["badges", "Badges"],
  ["forms", "Form controls"],
  ["feedback", "Feedback"],
  ["layout", "Cards & stats"],
  ["table", "Table"],
  ["overlays", "Overlays"],
] as const;

// Sample rows for the table section
const SAMPLE_ROWS = [
  { loco: "0012-3VL80S", section: "A", left: 52.0, right: 53.5 },
  { loco: "0012-3VL80S", section: "B", left: 85.0, right: 86.0 },
  { loco: "0047-UzEL", section: "A", left: 37.0, right: 39.5 },
  { loco: "0105-TE10M", section: "A", left: null, right: 55.0 },
];

function UiKit() {
  const { showSuccess, showError, showWarning, showInfo } = useSnackbar();
  const [view, setView] = useState("list");
  const [selectedStat, setSelectedStat] = useState<string | null>("50");
  const [selectValue, setSelectValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fakeSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="UI kit"
        description="Design tokens and the standard component for each job. Build pages only from these."
      />

      <nav className="flex flex-wrap gap-2">
        {NAV.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-border-strong bg-background px-3 py-1 text-xs font-medium text-foreground-secondary transition-colors hover:border-primary hover:text-primary"
          >
            {label}
          </a>
        ))}
      </nav>

      <Alert variant="info">
        <Info />
        <AlertTitle>Rules</AlertTitle>
        <AlertDescription>
          Use token classes (bg-primary, text-muted-foreground, border-border-strong…),
          never hex values (text-[#…]) or Tailwind palette classes (bg-blue-…).
          Reach for a component here before writing markup by hand.
        </AlertDescription>
      </Alert>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="colors"
        title="Colors"
        description="Every colour in the app. Values are read live from app/globals.css."
      >
        <div className="space-y-4">
          {COLOR_GROUPS.map((group) => (
            <Panel key={group.title} title={group.title}>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {group.tokens.map((token) => (
                  <Swatch key={token.name} {...token} />
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="typography"
        title="Typography"
        description="Inter. Weights: 400 body, 500 labels, 600 headings and buttons, 700 only for big numbers."
      >
        <Panel>
          <div className="divide-y divide-border">
            {TYPE_SCALE.map((step) => (
              <div
                key={step.cls}
                className="grid grid-cols-[110px_60px_1fr] items-baseline gap-3 py-2.5 sm:grid-cols-[130px_60px_1fr_1fr]"
              >
                <code className="text-xs text-primary">{step.cls}</code>
                <span className="text-xs text-muted-foreground">{step.px}px</span>
                <span className={cn(step.cls, "truncate text-foreground")}>
                  Lokomotiv 0012-3VL80S
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {step.use}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="radius-shadow" title="Radius & shadow">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Radius">
            <div className="grid grid-cols-5 gap-3">
              {RADII.map((radius) => (
                <div key={radius.cls} className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={cn(
                      "size-14 border-2 border-primary bg-primary-subtle",
                      radius.cls,
                    )}
                  />
                  <code className="text-2xs text-foreground">{radius.cls}</code>
                  <span className="text-2xs text-muted-foreground">
                    {radius.px === null ? "pill" : `${radius.px}px`}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Default is <code>rounded-lg</code>. {RADII[2].use}.
            </p>
          </Panel>
          <Panel title="Shadow">
            <div className="grid grid-cols-4 gap-4 bg-surface-muted p-4 rounded-md">
              {SHADOWS.map((shadow) => (
                <div key={shadow.cls} className="flex flex-col items-center gap-2 text-center">
                  <div className={cn("size-14 rounded-lg bg-background", shadow.cls)} />
                  <code className="text-2xs text-foreground">{shadow.cls}</code>
                  <span className="text-2xs text-muted-foreground">{shadow.use}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="spacing"
        title="Spacing"
        description="Tailwind's 4px scale, with fixed choices for the common cases."
      >
        <Panel>
          <div className="divide-y divide-border">
            {SPACING.map((item) => (
              <div
                key={item.rule}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5"
              >
                <span className="text-sm text-foreground">{item.rule}</span>
                <code className="text-xs text-primary">{item.cls}</code>
                <span className="w-24 text-right text-xs text-muted-foreground">
                  {item.px}px
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="buttons"
        title="Buttons"
        description="<Button variant=… size=… loading>. One primary action per area."
      >
        <Panel title="Variants">
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <Plus /> Qo&apos;shish
            </Button>
            <Button variant="outline">
              <Pencil /> Tahrirlash
            </Button>
            <Button variant="secondary">Bekor qilish</Button>
            <Button variant="ghost">Batafsil</Button>
            <Button variant="destructive">
              <Trash2 /> O&apos;chirish
            </Button>
            <Button variant="success">
              <FileSpreadsheet /> Excel
            </Button>
            <Button variant="link">Havola</Button>
          </div>
        </Panel>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Sizes">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" variant="outline" aria-label="Download">
                <Download />
              </Button>
            </div>
          </Panel>
          <Panel title="States">
            <div className="flex flex-wrap items-center gap-3">
              <Button loading={loading} onClick={fakeSave}>
                {loading ? "Saqlanmoqda…" : "Saqlash (click)"}
              </Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
            </div>
          </Panel>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="badges"
        title="Badges"
        description="Subtle variants by default; solid ones for counts and strong emphasis."
      >
        <Panel>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">Qoralama</Badge>
              <Badge variant="primary">Jarayonda</Badge>
              <Badge variant="success">
                <CheckCircle2 className="size-3" /> Bajarildi
              </Badge>
              <Badge variant="warning">Kutilmoqda</Badge>
              <Badge variant="danger">Rad etildi</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary_solid">12</Badge>
              <Badge variant="success_solid">4</Badge>
              <Badge variant="warning_solid">2</Badge>
              <Badge variant="danger_solid">1</Badge>
            </div>
          </div>
        </Panel>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="forms"
        title="Form controls"
        description="All fields share one style: border-strong outline, primary on focus, destructive when invalid."
      >
        <Panel>
          <div className="grid gap-x-6 gap-y-1 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="kit-input">Lokomotiv raqami</Label>
              <Input id="kit-input" placeholder="Masalan, 0012" />
            </div>
            <div className="space-y-1.5">
              <Label>Depo</Label>
              <SearchableSelect
                value={selectValue}
                onValueChange={setSelectValue}
                placeholder="Depo tanlang"
                searchable
                options={[
                  { value: "1", label: "Toshkent depo" },
                  { value: "2", label: "Qo'qon depo" },
                  { value: "3", label: "Buxoro depo" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kit-invalid">Invalid</Label>
              <Input id="kit-invalid" aria-invalid defaultValue="abc" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kit-disabled">Disabled</Label>
              <Input id="kit-disabled" disabled defaultValue="Read only" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="kit-textarea">Izoh</Label>
              <Textarea id="kit-textarea" placeholder="Sababini yozing…" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox defaultChecked /> Checkbox
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Switch defaultChecked /> Switch
              </label>
            </div>
          </div>
        </Panel>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="feedback"
        title="Feedback"
        description="Alert for inline messages, the snackbar for results of an action, EmptyState and Skeleton for lists."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Alert variant="info">
            <Info />
            <AlertTitle>Ma&apos;lumot</AlertTitle>
            <AlertDescription>Filtrlar faqat tanlangan depoga qo&apos;llanadi.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Saqlandi</AlertTitle>
            <AlertDescription>O&apos;zgarishlar muvaffaqiyatli saqlandi.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>Diqqat</AlertTitle>
            <AlertDescription>Ba&apos;zi qiymatlar kiritilmagan.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Xatolik</AlertTitle>
            <AlertDescription>Maʼlumotlarni yuklashda xatolik yuz berdi.</AlertDescription>
          </Alert>
        </div>
        <Panel title="Snackbar — useSnackbar()">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => showSuccess("Saqlandi", "O'zgarishlar saqlandi.")}>
              showSuccess
            </Button>
            <Button variant="outline" size="sm" onClick={() => showError("Xatolik", "Saqlashda xatolik yuz berdi.")}>
              showError
            </Button>
            <Button variant="outline" size="sm" onClick={() => showWarning("Diqqat", "Ba'zi qiymatlar yo'q.")}>
              showWarning
            </Button>
            <Button variant="outline" size="sm" onClick={() => showInfo("Ma'lumot", "Hisobot tayyorlanmoqda.")}>
              showInfo
            </Button>
          </div>
        </Panel>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="EmptyState">
            <EmptyState
              className="py-6"
              icon={<AlertCircle className="size-10" />}
              title="Ma'lumot topilmadi"
              description="Filtrlarni o'zgartirib ko'ring."
            />
          </Panel>
          <Panel title="Skeleton">
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-4/5" />
              <Skeleton className="h-9 w-3/5" />
            </div>
          </Panel>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="layout"
        title="Cards & stats"
        description="Card for grouped content, StatCard for summary numbers (clickable ones act as filters), SegmentedTabs to switch views."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Card description in muted text.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-foreground">
              Content uses text-foreground; secondary details use text-muted-foreground.
            </CardContent>
          </Card>
          <Panel title="SegmentedTabs">
            <SegmentedTabs
              value={view}
              onValueChange={setView}
              aria-label="View"
              options={[
                { value: "list", label: "Ro'yxat", icon: <List /> },
                { value: "group", label: "Guruh bo'yicha", icon: <LayoutList /> },
              ]}
            />
          </Panel>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { key: "40", hint: "(40–48)", value: "2 ta KP", caption: "1 ta lokomotiv" },
            { key: "50", hint: "(49–55)", value: "4 ta KP", caption: "2 ta lokomotiv" },
            { key: "60", hint: "(56–65)", value: "0 ta KP", caption: "0 ta lokomotiv" },
            { key: "90", hint: "(81–95)", value: "6 ta KP", caption: "1 ta lokomotiv" },
          ].map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.key}
              hint={stat.hint}
              value={stat.value}
              caption={stat.caption}
              muted={stat.value.startsWith("0")}
              selected={selectedStat === stat.key}
              onClick={() =>
                setSelectedStat((prev) => (prev === stat.key ? null : stat.key))
              }
            />
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="table"
        title="Table"
        description="GridTable + gridHeadClass / gridCellClass (stickyCol to pin columns). Highlight with primary-subtle, flag with destructive-subtle."
      >
        <GridTable maxHeight="none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["№", "Lokomotiv", "Sektsiya", "Chap", "O'ng", "Holat"].map(
                  (head, index) => (
                    <TableHead
                      key={head}
                      className={cn(
                        gridHeadClass,
                        "last:border-r-0",
                        index >= 3 && "text-center",
                      )}
                    >
                      {head}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_ROWS.map((row, index) => {
                const uneven =
                  row.left !== null && row.right !== null && Math.abs(row.left - row.right) >= 2;
                const cell = cn(gridCellClass, "last:border-r-0");
                const value = (v: number | null) =>
                  v === null ? <span className="text-foreground-subtle">—</span> : v.toFixed(1);
                return (
                  <TableRow key={index} className="hover:bg-surface-muted">
                    <TableCell className={cn(cell, "text-muted-foreground")}>{index + 1}</TableCell>
                    <TableCell className={cn(cell, "font-medium text-foreground")}>{row.loco}</TableCell>
                    <TableCell className={cn(cell, "text-foreground")}>{row.section}</TableCell>
                    {[row.left, row.right].map((v, i) => (
                      <TableCell
                        key={i}
                        className={cn(
                          cell,
                          "text-center text-foreground",
                          uneven && "bg-destructive-subtle font-semibold text-destructive",
                          index === 0 && "bg-primary-subtle font-semibold text-primary",
                        )}
                      >
                        {value(v)}
                      </TableCell>
                    ))}
                    <TableCell className={cn(cell, "text-center")}>
                      {uneven ? (
                        <Badge variant="danger">Farq ≥ 2</Badge>
                      ) : (
                        <Badge variant="success">Me&apos;yorda</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
        </GridTable>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="overlays"
        title="Overlays"
        description="Modal is the one dialog: sizes sm / md / lg / xl, actions right-aligned, primary last."
      >
        <Panel>
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
        </Panel>
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Lokomotivni tahrirlash"
          size="md"
        >
          <div className="space-y-1.5">
            <Label htmlFor="kit-modal-input">Zavod raqami</Label>
            <Input id="kit-modal-input" defaultValue="36539" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={() => setModalOpen(false)}>Saqlash</Button>
          </div>
        </Modal>
      </Section>
    </div>
  );
}

export default function UiKitPage() {
  const [allowed, setAllowed] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let user = null;
    try {
      user = authService.getUser();
    } catch {
      user = null;
    }
    setAllowed(process.env.NODE_ENV === "development" || user?.role === "admin");
  }, []);

  if (allowed === undefined) return null;
  if (!allowed) return <UnauthorizedPage />;
  return <UiKit />;
}
