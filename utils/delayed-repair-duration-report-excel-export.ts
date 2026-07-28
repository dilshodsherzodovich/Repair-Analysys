"use client";

// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import type { DelayedRepairDurationRow } from "@/api/types/delayed-repair-duration-report";

export interface DelayedRepairDurationExcelData {
  title: string;
  orgName: string | undefined;
  dateFrom: string;
  dateTo: string;
  /** Column headers in display order (index column excluded). */
  headers: string[];
  rows: DelayedRepairDurationRow[];
  /** Maps a delay_reason_code to its translated label. */
  delayReasonLabels: Record<string, string>;
  metaLabels: { organization: string; period: string };
}

const borderThin = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
} as const;

const fill = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const HEADER_FILL = fill("FFF1F5F9");
const ZEBRA_FILL = fill("FFFAFBFC");

// Time fields arrive as "yyyy-MM-dd HH:mm" (or ISO, or null). Show "dd.MM HH:mm".
function fmtTime(value: string | null): string {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${dd}.${mo} ${hh}:${mm}`;
  }
  return value;
}

function fmtNum(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

function delayReasonCell(
  row: DelayedRepairDurationRow,
  labels: Record<string, string>,
): string {
  if (!row.delay_reason_code) return "—";
  const label = labels[row.delay_reason_code] || row.delay_reason_code;
  return row.delay_reason_details ? `${label} — ${row.delay_reason_details}` : label;
}

// Overrun = spent time − norm time. Null if either side is missing.
function delayedAmount(row: DelayedRepairDurationRow): number | null {
  if (row.delayed_hours == null || row.interval_hours == null) return null;
  return row.delayed_hours - row.interval_hours;
}

function rowToCells(
  row: DelayedRepairDurationRow,
  delayReasonLabels: Record<string, string>,
): (string | number)[] {
  return [
    [row.locomotive_name, row.locomotive_model_name].filter(Boolean).join(" "),
    row.branch_name ?? "",
    row.inspection_type_name ?? "",
    fmtTime(row.entry_time),
    fmtTime(row.kanava_entry_time),
    fmtTime(row.close_time),
    fmtNum(row.interval_hours),
    fmtNum(row.delayed_hours),
    fmtNum(delayedAmount(row)),
    delayReasonCell(row, delayReasonLabels),
  ];
}

// Column widths (index col + 10 data cols).
const COL_WIDTHS = [5, 22, 24, 14, 18, 18, 18, 12, 14, 16, 40];

export async function generateDelayedRepairDurationExcel(
  data: DelayedRepairDurationExcelData,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dejurniy";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Report");
  const totalCols = COL_WIDTHS.length;

  ws.columns = COL_WIDTHS.map((width) => ({ width }));

  let r = 1;

  // ── Title ──
  ws.mergeCells(r, 1, r, totalCols);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = data.title;
  titleCell.font = { bold: true, size: 16, color: { argb: "FF1E293B" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 28;
  r++;

  // ── Meta row (org + period) ──
  ws.mergeCells(r, 1, r, totalCols);
  const metaCell = ws.getCell(r, 1);
  const parts = [
    data.orgName ? `${data.metaLabels.organization}: ${data.orgName}` : null,
    `${data.metaLabels.period}: ${data.dateFrom} — ${data.dateTo}`,
  ].filter(Boolean);
  metaCell.value = parts.join("    •    ");
  metaCell.font = { size: 10, color: { argb: "FF64748B" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 18;
  r++;

  // Spacer
  r++;

  // ── Header row ──
  const headerRowIdx = r;
  const headerRow = ws.getRow(r);
  const headerCells = ["#", ...data.headers];
  headerCells.forEach((label, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = label;
    c.font = { bold: true, size: 9, color: { argb: "FF475569" } };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.fill = HEADER_FILL;
    c.border = borderThin as any;
  });
  headerRow.height = 40;
  r++;

  // ── Data rows ──
  data.rows.forEach((row, idx) => {
    const dataRow = ws.getRow(r);
    const zebra = idx % 2 === 1;
    const cells: (string | number)[] = [
      idx + 1,
      ...rowToCells(row, data.delayReasonLabels),
    ];

    cells.forEach((value, i) => {
      const c = dataRow.getCell(i + 1);
      c.value = value;
      c.font = { size: 10, color: { argb: "FF1E293B" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      if (zebra) c.fill = ZEBRA_FILL;
      c.border = borderThin as any;
    });

    dataRow.height = 18;
    r++;
  });

  // ── Empty state ──
  if (data.rows.length === 0) {
    ws.mergeCells(r, 1, r, totalCols);
    const empty = ws.getCell(r, 1);
    empty.value = "—";
    empty.font = { italic: true, color: { argb: "FF94A3B8" } };
    empty.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(r).height = 24;
  }

  // Freeze the header so the table stays readable while scrolling.
  ws.views = [{ state: "frozen", ySplit: headerRowIdx }];

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `delayed_repair_duration_${data.dateFrom}_${data.dateTo}.xlsx`,
  );
}
