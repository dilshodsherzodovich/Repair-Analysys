import type { Inspection } from "@/api/types/report-inspection";
import type { DelayedInspectionsLocomotive } from "@/api/types/delayed-inspections-report";
import type { DelayedRepairDurationRow } from "@/api/types/delayed-repair-duration-report";
import type {
  TypeBreakdownRow,
  UnifiedKpis,
} from "@/components/reports/unified/use-unified-report-data";

/**
 * Parses the several datetime shapes the three endpoints return.
 *
 * `/delayed-inspections-report/` sends pre-formatted *local* strings
 * ("YYYY-MM-DD HH:MM") while the other two send ISO with an offset. A bare local
 * string gets "T" spliced in rather than a "Z", so it is read in local time and
 * the clock reading is preserved; an offset string is parsed as-is.
 *
 * Returns a real Date so exports can carry a true date value — Excel can then
 * sort and filter the column instead of comparing text.
 */
export function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/** Display form used wherever a Date cannot be carried as a value (the PDF). */
export function formatDateTime(value: Date | null): string {
  if (!value) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(value.getDate())}.${p(value.getMonth() + 1)}.${value.getFullYear()} ${p(value.getHours())}:${p(value.getMinutes())}`;
}

/** Which detail section the screen is drilled into. `null` = all of them. */
export type ExportSection = "inspections" | "duration" | "entry";

/**
 * One exported cell.
 *
 * `null` means "no value" and is written as a dash. Numbers stay numbers all the
 * way into the sheet — formatting them into strings here would leave a workbook
 * whose columns cannot be summed, sorted or charted.
 */
export type ExportCell = string | number | Date | null;

/**
 * Everything the unified report exports need.
 *
 * Both exporters take exactly what the screen rendered — the same derived KPIs,
 * the same rows, the same drill-down — so a downloaded file can never disagree
 * with what the user was looking at when they clicked.
 */
export interface UnifiedReportExportData {
  title: string;
  organization: string;
  fromDate: string;
  toDate: string;
  generatedAt: string;
  /** Only this section is exported when set. */
  section: ExportSection | null;
  /** Inspection-type name being filtered on, shown in the meta line. */
  typeFilter: string | null;
  kpis: UnifiedKpis;
  breakdown: TypeBreakdownRow[];
  inspections: Inspection[];
  delayedEntry: DelayedInspectionsLocomotive[];
  delayedDuration: DelayedRepairDurationRow[];
  /** Delay reason code → translated label, resolved by the page. */
  delayReasonLabels: Record<string, string>;
  labels: {
    period: string;
    organization: string;
    generatedAt: string;
    inspectionTypeFilter: string;
    sheetSummary: string;
    sheetInspections: string;
    sheetLeftLate: string;
    sheetEnteredLate: string;
    kpiTotal: string;
    kpiDelayedEntry: string;
    kpiDelayedDuration: string;
    byType: string;
    sectionInspections: string;
    sectionDelayedEntry: string;
    sectionDelayedDuration: string;
    no: string;
    locomotive: string;
    branch: string;
    inspectionType: string;
    entryTime: string;
    closeTime: string;
    normHours: string;
    spentHours: string;
    overrunHours: string;
    delayReason: string;
    openedAt: string;
    delayKind: string;
    delayTypeHour: string;
    delayTypeMileage: string;
    delayTypeBoth: string;
    hoursLabel: string;
    mileageLabel: string;
    actual: string;
    interval: string;
    overrunLabel: string;
    delayedLocomotivesCount: string;
    total: string;
  };
}

/** Whether a section belongs in the export, honouring the screen's drill-down. */
export const includesSection = (
  data: UnifiedReportExportData,
  section: ExportSection,
) => data.section === null || data.section === section;

// ── Section 1: inspections performed ─────────────────────────────────────────

export function inspectionsExportHeaders({ labels }: UnifiedReportExportData) {
  return [
    labels.no,
    labels.locomotive,
    labels.branch,
    labels.inspectionType,
    labels.entryTime,
    labels.closeTime,
  ];
}

export function inspectionsExportRows(
  data: UnifiedReportExportData,
): ExportCell[][] {
  return data.inspections.map((row, i) => [
    i + 1,
    [row.locomotive?.name, row.locomotive?.locomotive_model?.name]
      .filter(Boolean)
      .join(" "),
    row.branch?.name ?? "",
    row.inspection_type?.name ?? "",
    parseDateTime(row.created_time),
    parseDateTime(row.is_closed_time),
  ]);
}

// ── Section 2: ran past the repair norm ──────────────────────────────────────

export function delayedDurationExportHeaders({
  labels,
}: UnifiedReportExportData) {
  return [
    labels.no,
    labels.locomotive,
    labels.branch,
    labels.inspectionType,
    labels.entryTime,
    labels.closeTime,
    labels.normHours,
    labels.spentHours,
    labels.overrunHours,
    labels.delayReason,
  ];
}

export function delayedDurationExportRows(
  data: UnifiedReportExportData,
): ExportCell[][] {
  return data.delayedDuration.map((row, i) => {
    const overrun =
      row.delayed_hours == null || row.interval_hours == null
        ? null
        : row.delayed_hours - row.interval_hours;

    const reason = row.delay_reason_code
      ? [
          data.delayReasonLabels[row.delay_reason_code] ?? row.delay_reason_code,
          row.delay_reason_details,
        ]
          .filter(Boolean)
          .join(" — ")
      : null;

    return [
      i + 1,
      [row.locomotive_name, row.locomotive_model_name].filter(Boolean).join(" "),
      row.branch_name ?? "",
      row.inspection_type_name ?? "",
      parseDateTime(row.entry_time),
      parseDateTime(row.close_time),
      row.interval_hours,
      row.delayed_hours,
      overrun,
      reason,
    ];
  });
}

// ── Section 3: entered late ──────────────────────────────────────────────────

export function delayedEntryExportHeaders({ labels }: UnifiedReportExportData) {
  return [
    labels.no,
    labels.locomotive,
    labels.inspectionType,
    labels.branch,
    labels.openedAt,
    labels.delayKind,
    `${labels.hoursLabel} · ${labels.actual}`,
    `${labels.hoursLabel} · ${labels.interval}`,
    `${labels.hoursLabel} · ${labels.overrunLabel}`,
    `${labels.mileageLabel} · ${labels.actual}`,
    `${labels.mileageLabel} · ${labels.interval}`,
    `${labels.mileageLabel} · ${labels.overrunLabel}`,
  ];
}

/**
 * Flattens the delayed-entry groups into export rows.
 *
 * `interval === null` means the dimension is not tracked for that model/type
 * pair. It stays null — written as a dash — because a 0 would read as an
 * on-target value.
 */
export function delayedEntryExportRows(
  data: UnifiedReportExportData,
): ExportCell[][] {
  const { labels } = data;
  const kindLabel = (k: "hour" | "mileage" | "both") =>
    k === "hour"
      ? labels.delayTypeHour
      : k === "mileage"
      ? labels.delayTypeMileage
      : labels.delayTypeBoth;

  const overrun = (m: { is_delayed: boolean; overrun: number | null }) =>
    m.is_delayed ? m.overrun : null;

  const rows: ExportCell[][] = [];
  for (const loco of data.delayedEntry) {
    for (const insp of loco.inspections) {
      rows.push([
        rows.length + 1,
        [loco.locomotive_name, loco.locomotive_model_name]
          .filter(Boolean)
          .join(" "),
        insp.inspection_type_name ?? "",
        insp.branch_name ?? "",
        parseDateTime(insp.created_time),
        kindLabel(insp.delay_type),
        insp.hours.actual,
        insp.hours.interval,
        overrun(insp.hours),
        insp.mileage.actual,
        insp.mileage.interval,
        overrun(insp.mileage),
      ]);
    }
  }
  return rows;
}

/** Characters Windows forbids in a filename, plus quotes and apostrophes. */
const UNSAFE_FILENAME = /[\\/:*?"<>|'’]/g;

/**
 * Builds the download name from the translated report title, so a file saved in
 * Uzbek is not named in English.
 */
export function exportFileName(
  data: UnifiedReportExportData,
  extension: string,
) {
  const stem = data.title
    .replace(UNSAFE_FILENAME, "")
    .replace(/[\s—–-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  // Dates are "dd.MM.yyyy"; the dots would read as extensions.
  const stamp = `${data.fromDate}_${data.toDate}`.replace(/\./g, "-");
  return `${stem || "report"}_${stamp}.${extension}`;
}

/**
 * Excel rejects worksheet names over 31 chars or containing : \ / ? * [ ], and
 * will not accept a leading or trailing apostrophe.
 */
export function sheetName(name: string, fallback: string) {
  const cleaned = name
    .replace(/[:\\/?*\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31)
    .replace(/^'+|'+$/g, "")
    .trim();
  return cleaned || fallback;
}
