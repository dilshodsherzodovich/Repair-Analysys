"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { SpecialComponent } from "@/api/types/locomotive";

/**
 * Crankshaft workbook: the table as it is on screen (filters applied), with
 * the koren and shatun headers tinted apart like on the page. Styling follows the duty-uzel and bandages exports.
 */

type Translate = (key: string, values?: Record<string, unknown>) => string;

interface ExportContext {
  t: Translate;
  tModal: Translate;
}

export interface CrankshaftExportLocomotive {
  index: number;
  name: string;
  modelName: string;
  components: SpecialComponent[];
}

const NAVY = "FF1E3A5F";
const KOREN_HEAD = "FF1E40AF"; // blue-800
const SHATUN_HEAD = "FF9A3412"; // orange-800
const ZEBRA = "FFF8FAFC"; // slate-50
const MUTED_TXT = "FF64748B"; // slate-500
const INK = "FF0F172A"; // slate-900

const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

const solid = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const DASH = "—";

const fieldNumber = (field: string) => {
  const match = field.match(/(\d+)$/);
  return match ? Number(match[1]) : field;
};

/** Numbers stay numbers so Excel can sort and sum them; the rest as text. */
const cellValue = (value: unknown): string | number => {
  if (value === null || value === undefined || value === "") return DASH;
  if (typeof value === "number") return value;
  const text = String(value).trim();
  const number = Number(text.replace(",", "."));
  return text !== "" && Number.isFinite(number) ? number : text;
};

const textValue = (value: unknown): string =>
  value === null || value === undefined || value === "" ? DASH : String(value);

function fileName(name: string): string {
  return `${name.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 60)}_${format(
    new Date(),
    "yyyy-MM-dd",
  )}.xlsx`;
}

function styleHeaderCell(cell: ExcelJS.Cell, fill: string) {
  cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.fill = solid(fill);
  cell.border = border;
}

export async function exportCrankshaftExcel(
  {
    groups,
    korenFields,
    shatunFields,
  }: {
    groups: CrankshaftExportLocomotive[];
    korenFields: string[];
    shatunFields: string[];
  },
  { t, tModal }: ExportContext,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Repair Analysys";
  const ws = wb.addWorksheet(t("excel.sheet").slice(0, 31) || "Crankshaft");

  const infoColumns = 5; // №, locomotive, section, year, factory number
  const korenStart = infoColumns + 1;
  const shatunStart = korenStart + korenFields.length;
  const columnCount = infoColumns + korenFields.length + shatunFields.length;

  // Title
  ws.mergeCells(1, 1, 1, columnCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = t("title");
  titleCell.font = { bold: true, size: 13, color: { argb: NAVY } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, columnCount);
  const subtitleCell = ws.getCell(2, 1);
  subtitleCell.value = `${t("excel.date")}: ${format(new Date(), "dd.MM.yyyy")}`;
  subtitleCell.font = { size: 10, italic: true, color: { argb: MUTED_TXT } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 18;

  // Two header rows: block names over their numbered columns
  const top = 3;
  const sub = 4;
  [
    t("columns.no"),
    t("columns.locomotive"),
    t("columns.section"),
    tModal("year_of_manufacture"),
    tModal("factory_number"),
  ].forEach((label, index) => {
    ws.mergeCells(top, index + 1, sub, index + 1);
    const cell = ws.getCell(top, index + 1);
    cell.value = label;
    styleHeaderCell(cell, NAVY);
  });

  const writeBlock = (
    fields: string[],
    start: number,
    label: string,
    fill: string,
  ) => {
    if (!fields.length) return;
    ws.mergeCells(top, start, top, start + fields.length - 1);
    const cell = ws.getCell(top, start);
    cell.value = label;
    styleHeaderCell(cell, fill);
    fields.forEach((field, index) => {
      const numberCell = ws.getCell(sub, start + index);
      numberCell.value = fieldNumber(field);
      styleHeaderCell(numberCell, fill);
    });
  };
  writeBlock(korenFields, korenStart, tModal("koren_prefix"), KOREN_HEAD);
  writeBlock(shatunFields, shatunStart, tModal("shatun_prefix"), SHATUN_HEAD);
  ws.getRow(top).height = 30;
  ws.getRow(sub).height = 18;

  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 16;
  for (let col = korenStart; col <= columnCount; col++) {
    ws.getColumn(col).width = 8;
  }
  ws.views = [{ state: "frozen", xSplit: 3, ySplit: sub }];

  const valueFields = [...korenFields, ...shatunFields];
  let row = sub + 1;
  groups.forEach((group, groupIndex) => {
    const firstRow = row;
    const zebra = groupIndex % 2 === 1;

    group.components.forEach((component, componentIndex) => {
      const values: (string | number)[] = [
        group.index,
        `${group.name}-${group.modelName}`,
        component.section?.name ?? `${tModal("section")} ${componentIndex + 1}`,
        // Kept as text: factory numbers can carry leading zeros
        textValue(component.year_of_manufacture),
        textValue(component.factory_number),
        ...valueFields.map((field) => cellValue(component[field])),
      ];
      values.forEach((value, index) => {
        const cell = ws.getCell(row, index + 1);
        cell.value = value;
        cell.font = {
          size: 10,
          bold: index === 1,
          color: { argb: index === 3 || index === 4 ? MUTED_TXT : INK },
        };
        cell.alignment = {
          horizontal: index === 1 ? "left" : "center",
          vertical: "middle",
        };
        cell.border = border;
        if (zebra) cell.fill = solid(ZEBRA);
      });
      row++;
    });

    // № and locomotive span the locomotive's section rows
    if (row - firstRow > 1) {
      ws.mergeCells(firstRow, 1, row - 1, 1);
      ws.mergeCells(firstRow, 2, row - 1, 2);
    }
  });

  if (groups.length === 0) {
    ws.mergeCells(row, 1, row, columnCount);
    const cell = ws.getCell(row, 1);
    cell.value = t("empty");
    cell.font = { size: 10, italic: true, color: { argb: MUTED_TXT } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = border;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, fileName(t("title")));
}
