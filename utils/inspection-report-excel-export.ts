"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { Inspection } from "@/api/types/report-inspection";
import { formatDate } from "./formatDate";

export interface InspectionReportExcelData {
  inspectionsByType: Record<string, { count: number; inspections: Inspection[] }>;
  startDate: Date;
  endDate: Date;
  title: string;
  translations: {
    inspectionCountsByType: string;
    inspectionsList: string;
    no: string;
    locomotive: string;
    branch: string;
    createdTime: string;
    closeTime: string;
    total: string;
  };
}

const border = {
  top: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
  left: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
  right: { style: "thin" as const, color: { argb: "FFCBD5E1" } },
};

const navyFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E3A5F" },
};

const blueFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFDBEAFE" },
};

const altFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF0F6FF" },
};

const fmtDay = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

/**
 * Excel counterpart to the inspection report PDF: a summary of counts by type
 * followed by one table per inspection type, matching the on-screen report.
 */
export async function generateInspectionReportExcel(data: InspectionReportExcelData) {
  const tr = data.translations;
  const sorted = Object.entries(data.inspectionsByType).sort(
    (a, b) => b[1].count - a[1].count,
  );
  const totalCount = sorted.reduce((sum, [, d]) => sum + d.count, 0);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dejurniy";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Hisobot");
  const COLS = 5;
  ws.columns = [{ width: 6 }, { width: 30 }, { width: 26 }, { width: 22 }, { width: 22 }];

  let r = 1;

  // ─── Title ──
  ws.mergeCells(r, 1, r, COLS);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = data.title;
  titleCell.font = { size: 15, bold: true, color: { argb: "FF1E3A5F" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 32;
  r++;

  // ─── Meta (period + total) ──
  ws.mergeCells(r, 1, r, COLS);
  const metaCell = ws.getCell(r, 1);
  metaCell.value = `${fmtDay(data.startDate)} — ${fmtDay(data.endDate)}   |   ${tr.total}: ${totalCount}`;
  metaCell.font = { size: 11, italic: true, color: { argb: "FF374151" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 20;
  r++;
  r++; // spacer

  // ─── Counts by type ──
  ws.mergeCells(r, 1, r, COLS);
  const countsTitle = ws.getCell(r, 1);
  countsTitle.value = tr.inspectionCountsByType;
  countsTitle.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  countsTitle.fill = navyFill;
  countsTitle.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(r).height = 22;
  r++;

  sorted.forEach(([typeName, d], idx) => {
    const row = ws.getRow(r);
    ws.mergeCells(r, 1, r, 4);
    const nameCell = row.getCell(1);
    nameCell.value = typeName;
    nameCell.alignment = { horizontal: "left", vertical: "middle" };
    const countCell = row.getCell(5);
    countCell.value = d.count;
    countCell.alignment = { horizontal: "center", vertical: "middle" };
    countCell.font = { bold: true, color: { argb: "FF1D4ED8" } };
    [1, 2, 3, 4, 5].forEach((c) => {
      const cell = row.getCell(c);
      cell.border = border;
      cell.font = cell.font ?? { size: 10 };
      if (idx % 2 === 1) cell.fill = altFill;
    });
    row.height = 20;
    r++;
  });
  r++; // spacer

  // ─── Inspections list, grouped by type ──
  ws.mergeCells(r, 1, r, COLS);
  const listTitle = ws.getCell(r, 1);
  listTitle.value = tr.inspectionsList;
  listTitle.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  listTitle.fill = navyFill;
  listTitle.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(r).height = 22;
  r++;

  sorted.forEach(([typeName, d]) => {
    // Group label
    ws.mergeCells(r, 1, r, COLS);
    const groupCell = ws.getCell(r, 1);
    groupCell.value = `${typeName} (${d.count})`;
    groupCell.font = { bold: true, size: 10, color: { argb: "FF1D4ED8" } };
    groupCell.fill = blueFill;
    groupCell.alignment = { horizontal: "left", vertical: "middle" };
    ws.getRow(r).height = 20;
    r++;

    // Column header
    const headerLabels = [tr.no, tr.locomotive, tr.branch, tr.createdTime, tr.closeTime];
    const headerRow = ws.getRow(r);
    headerLabels.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = navyFill;
      cell.border = border;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });
    headerRow.height = 24;
    r++;

    // Rows
    d.inspections.forEach((ins, li) => {
      const row = ws.getRow(r);
      const locoName =
        [ins.locomotive?.name, ins.locomotive?.locomotive_model?.name]
          .filter(Boolean)
          .join(" ") || "-";
      const values: (string | number)[] = [
        li + 1,
        locoName,
        ins.branch?.name ?? "-",
        (ins.created_time ? formatDate(ins.created_time) : "-") ?? "-",
        (ins.is_closed_time ? formatDate(ins.is_closed_time) : "-") ?? "-",
      ];
      values.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.border = border;
        cell.font = { size: 10 };
        if (li % 2 === 1) cell.fill = altFill;
        cell.alignment = {
          horizontal: colIdx === 0 ? "center" : "left",
          vertical: "middle",
        };
      });
      row.height = 20;
      r++;
    });
    r++; // spacer between groups
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const fmtFile = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  saveAs(blob, `inspection-report_${fmtFile(data.startDate)}_${fmtFile(data.endDate)}.xlsx`);
}
