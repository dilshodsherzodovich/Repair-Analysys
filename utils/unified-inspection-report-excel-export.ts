"use client";

// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import type {
  ExportCell,
  UnifiedReportExportData,
} from "./unified-inspection-report-export-data";
import {
  exportFileName,
  sheetName,
  delayedDurationExportHeaders,
  delayedDurationExportRows,
  delayedEntryExportHeaders,
  delayedEntryExportRows,
  includesSection,
  inspectionsExportHeaders,
  inspectionsExportRows,
} from "./unified-inspection-report-export-data";

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

/** Thousands-separated integers; blanks stay blank rather than showing 0. */
const NUM_FMT = "#,##0";
/** In Excel codes the "mm" after "hh" reads as minutes, not months. */
const DATE_FMT = "dd.mm.yyyy hh:mm";
const DASH = "—";

type Sheet = ExcelJS.Worksheet;

/** Title + meta block shared by every sheet. Returns the next free row. */
function writeHeading(
  ws: Sheet,
  data: UnifiedReportExportData,
  heading: string,
  totalCols: number,
) {
  let r = 1;

  ws.mergeCells(r, 1, r, totalCols);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = heading;
  titleCell.font = { bold: true, size: 15, color: { argb: "FF1E293B" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 26;
  r++;

  ws.mergeCells(r, 1, r, totalCols);
  const metaCell = ws.getCell(r, 1);
  metaCell.value = [
    data.organization
      ? `${data.labels.organization}: ${data.organization}`
      : null,
    `${data.labels.period}: ${data.fromDate} — ${data.toDate}`,
    // An export taken while a type is selected must say so, or it reads as if
    // it covered everything.
    data.typeFilter
      ? `${data.labels.inspectionTypeFilter}: ${data.typeFilter}`
      : null,
    `${data.labels.generatedAt}: ${data.generatedAt}`,
  ]
    .filter(Boolean)
    .join("    •    ");
  metaCell.font = { size: 10, color: { argb: "FF64748B" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 18;
  r++;

  r++; // spacer
  return r;
}

/**
 * Header row + zebra-striped body.
 *
 * Numeric cells are written as numbers with a display format, never as
 * pre-formatted text, so the columns stay sortable and summable in Excel.
 */
function writeTable(
  ws: Sheet,
  startRow: number,
  headers: string[],
  rows: ExportCell[][],
  opts: { autoFilter?: boolean; freeze?: boolean; numFmt?: string } = {},
) {
  let r = startRow;

  const headerRow = ws.getRow(r);
  headers.forEach((label, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = label;
    c.font = { bold: true, size: 9, color: { argb: "FF475569" } };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.fill = HEADER_FILL;
    c.border = borderThin as any;
  });
  headerRow.height = 34;
  const headerRowIdx = r;
  r++;

  rows.forEach((cells, idx) => {
    const dataRow = ws.getRow(r);
    const zebra = idx % 2 === 1;
    cells.forEach((value, i) => {
      const c = dataRow.getCell(i + 1);
      const isNum = typeof value === "number";
      const isDate = value instanceof Date;

      c.value = value == null ? DASH : value;
      if (isNum) c.numFmt = opts.numFmt ?? NUM_FMT;
      // A real date value, so the column sorts and filters chronologically
      // rather than alphabetically.
      if (isDate) c.numFmt = DATE_FMT;

      c.font = { size: 10, color: { argb: "FF1E293B" } };
      c.alignment = {
        horizontal: isNum ? "right" : "center",
        vertical: "middle",
      };
      if (zebra) c.fill = ZEBRA_FILL;
      c.border = borderThin as any;
    });
    dataRow.height = 18;
    r++;
  });

  if (rows.length === 0) {
    ws.mergeCells(r, 1, r, headers.length);
    const empty = ws.getCell(r, 1);
    empty.value = DASH;
    empty.font = { italic: true, color: { argb: "FF94A3B8" } };
    empty.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(r).height = 24;
    r++;
  }

  // Only the detail sheets get these: the summary sheet stacks two tables, and
  // freezing or filtering on one of them would misbehave on the other.
  if (opts.freeze) ws.views = [{ state: "frozen", ySplit: headerRowIdx }];
  if (opts.autoFilter && rows.length > 0) {
    ws.autoFilter = {
      from: { row: headerRowIdx, column: 1 },
      to: { row: headerRowIdx + rows.length, column: headers.length },
    };
  }

  return r;
}

/**
 * The KPI block, laid out to the same width as the breakdown table beneath it:
 * the label merges across every column but the last, which holds the figure.
 */
function writeKpiBlock(
  ws: Sheet,
  startRow: number,
  totalLabel: string,
  rows: [string, number | null][],
  cols: number,
) {
  let r = startRow;

  const paint = (row: number, from: number, to: number, header: boolean) => {
    for (let c = from; c <= to; c++) {
      const cell = ws.getCell(row, c);
      if (header) {
        cell.font = { bold: true, size: 9, color: { argb: "FF475569" } };
        cell.fill = HEADER_FILL;
      } else {
        cell.font = { size: 10, color: { argb: "FF1E293B" } };
      }
      cell.border = borderThin as any;
    }
  };

  ws.mergeCells(r, 1, r, cols - 1);
  ws.getCell(r, cols).value = totalLabel;
  ws.getCell(r, cols).alignment = { horizontal: "center", vertical: "middle" };
  paint(r, 1, cols, true);
  ws.getRow(r).height = 24;
  r++;

  for (const [label, value] of rows) {
    ws.mergeCells(r, 1, r, cols - 1);
    const labelCell = ws.getCell(r, 1);
    labelCell.value = label;
    labelCell.alignment = { horizontal: "left", vertical: "middle" };

    const valueCell = ws.getCell(r, cols);
    valueCell.value = value == null ? DASH : value;
    if (typeof value === "number") valueCell.numFmt = NUM_FMT;
    valueCell.alignment = { horizontal: "right", vertical: "middle" };

    paint(r, 1, cols, false);
    ws.getRow(r).height = 20;
    r++;
  }

  return r;
}

/** One detail sheet: heading, then a filterable table. */
function addDetailSheet(
  workbook: ExcelJS.Workbook,
  data: UnifiedReportExportData,
  name: string,
  fallbackName: string,
  heading: string,
  widths: number[],
  headers: string[],
  rows: ExportCell[][],
) {
  const ws = workbook.addWorksheet(sheetName(name, fallbackName));
  ws.columns = widths.map((width) => ({ width }));
  const r = writeHeading(ws, data, heading, headers.length);
  writeTable(ws, r, headers, rows, { autoFilter: true, freeze: true });
}

export async function generateUnifiedReportExcel(data: UnifiedReportExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Repair Analysys";
  workbook.created = new Date();

  const { labels, kpis } = data;

  // ── Summary ────────────────────────────────────────────────────────────────
  {
    const ws = workbook.addWorksheet(
      sheetName(labels.sheetSummary, "Summary"),
    );
    ws.columns = [{ width: 38 }, { width: 16 }, { width: 28 }, { width: 26 }];
    let r = writeHeading(ws, data, data.title, 4);

    r = writeKpiBlock(
      ws,
      r,
      labels.total,
      [
        [labels.kpiTotal, kpis.total],
        [labels.kpiDelayedEntry, kpis.delayedEntry],
        [labels.kpiDelayedDuration, kpis.delayedDuration],
      ],
      4,
    );

    r++; // spacer
    writeTable(
      ws,
      r,
      [
        labels.inspectionType,
        labels.total,
        labels.kpiDelayedEntry,
        labels.kpiDelayedDuration,
      ],
      data.breakdown.map((b) => [
        b.name,
        b.total,
        b.delayedEntry,
        b.delayedDuration,
      ]),
    );
  }

  // ── Detail sheets, matching whatever the screen is showing ─────────────────
  if (includesSection(data, "inspections")) {
    addDetailSheet(
      workbook,
      data,
      labels.sheetInspections,
      "Inspections",
      labels.sectionInspections,
      [6, 24, 24, 16, 20, 20],
      inspectionsExportHeaders(data),
      inspectionsExportRows(data),
    );
  }

  if (includesSection(data, "duration")) {
    addDetailSheet(
      workbook,
      data,
      labels.sheetLeftLate,
      "Left late",
      labels.sectionDelayedDuration,
      [6, 24, 22, 16, 20, 20, 14, 14, 14, 40],
      delayedDurationExportHeaders(data),
      delayedDurationExportRows(data),
    );
  }

  if (includesSection(data, "entry")) {
    addDetailSheet(
      workbook,
      data,
      labels.sheetEnteredLate,
      "Entered late",
      labels.sectionDelayedEntry,
      [6, 26, 16, 22, 20, 12, 12, 12, 12, 12, 12, 12],
      delayedEntryExportHeaders(data),
      delayedEntryExportRows(data),
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    exportFileName(data, "xlsx"),
  );
}
