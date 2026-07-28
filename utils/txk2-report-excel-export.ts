"use client";

// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import type { Txk2ReportRow, NextInspectionType } from "@/api/types/txk2-report";

export interface Txk2ReportExcelData {
  title: string;
  orgName: string | undefined;
  dateFrom: string;
  dateTo: string;
  /** Column headers in display order (index column excluded). */
  headers: string[];
  rows: Txk2ReportRow[];
  locale: string;
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

// Mirror the page's display formatting so the export matches the table.
function fmtTime(value: string | null): string {
  if (!value) return "—";
  if (value.includes("T")) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }
  return value;
}

function fmtNum(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

function nextTypeName(value: NextInspectionType, locale: string): string {
  if (!value) return "—";
  if (typeof value === "string") return value || "—";
  if (locale === "ru") return value.name_ru || value.name || value.name_uz;
  return value.name_uz || value.name || value.name_ru;
}

function rowToCells(
  row: Txk2ReportRow,
  locale: string,
  delayReasonLabels: Record<string, string>,
): (string | number)[] {
  return [
    row.locomotive?.split("|").join(" ") ?? "",
    row.branch ?? "",
    row.inspection_type ?? "",
    fmtTime(row.entry_time),
    fmtNum(row.fixed_maneuver_time),
    fmtTime(row.kanava_entry_time),
    fmtNum(row.standard_duration),
    fmtNum(row.technical_service_hours),
    fmtTime(row.kanava_exit_time),
    nextTypeName(row.next_inspection_type, locale),
    fmtTime(row.next_entry_time),
    fmtTime(row.next_exit_time),
    fmtNum(row.total_time_hours),
    fmtNum(row.time_except_inspection),
    delayReasonCell(row, delayReasonLabels),
  ];
}

// Delay reason + details, combined into a single cell ("Reason — details").
function delayReasonCell(row: Txk2ReportRow, labels: Record<string, string>): string {
  if (!row.delay_reason_code) return "—";
  const label = labels[row.delay_reason_code] || row.delay_reason_code;
  return row.delay_reason_details ? `${label} — ${row.delay_reason_details}` : label;
}

// Column widths (index col + 16 data cols). Long-header columns get more room.
const COL_WIDTHS = [5, 22, 28, 12, 14, 18, 16, 20, 16, 16, 18, 18, 18, 18, 20, 36];

export async function generateTxk2ReportExcel(data: Txk2ReportExcelData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dejurniy";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("TXK-2");
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
    c.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    c.fill = HEADER_FILL;
    c.border = borderThin as any;
  });
  headerRow.height = 48;
  r++;

  // ── Data rows ──
  data.rows.forEach((row, idx) => {
    const dataRow = ws.getRow(r);
    const zebra = idx % 2 === 1;
    const cells: (string | number)[] = [
      idx + 1,
      ...rowToCells(row, data.locale, data.delayReasonLabels),
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
    `txk2_report_${data.dateFrom}_${data.dateTo}.xlsx`,
  );
}
