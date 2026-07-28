"use client";

// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import type { DelayedLocomotivesResponse } from "@/api/types/reports";

export interface DelayedReportExcelData {
  title: string;
  date: string;
  time: string;
  org: string | undefined;
  delayedLocomotives: DelayedLocomotivesResponse[];
  translations: Record<string, string>;
}

const PER_ROW = 3;
const COLS_PER_TYPE = 2;
const TOTAL_COLS = PER_ROW * COLS_PER_TYPE; // 6

const borderThin = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
} as const;

const borderTypeRight = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "medium", color: { argb: "FFC7D2FE" } },
} as const;

const fill = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const TRAIN_TYPE_FILL = fill("FFDCE3F0");
const INSP_TYPE_FILL = fill("FFEEF2FF");
const HEADER_FILL = fill("FFF1F5F9");
const ZEBRA_FILL = fill("FFFAFBFC");
const SUMMARY_FILL = fill("FFEEF2FF");

function trainTypeName(name: string, tr: Record<string, string>): string {
  if (name === "electric_freight_locos")
    return tr.freightLocos ?? "Elektrovoz-yuk";
  if (name === "electric_switches_locos")
    return tr.switcherLocos ?? "Elektrovoz-manevr";
  if (name === "passenger_locos") return tr.passengerLocs ?? "Yo'lovchi";
  return tr.dieselLocs ?? "Teplovoz";
}

function formatHourMileage(
  hour: number | string | null | undefined,
  mileage: number | string | null | undefined,
  tr: Record<string, string>
): string {
  // API may return these as numbers OR strings (e.g. DRF Decimal fields),
  // so coerce before checking — matches the page's truthy display logic.
  const hourNum = Number(hour);
  const mileageNum = Number(mileage);
  const hasHour = hour != null && hour !== "" && !isNaN(hourNum);
  const hasMileage = mileage != null && mileage !== "" && !isNaN(mileageNum);
  const parts: string[] = [];
  if (hasHour) parts.push(`${hourNum} ${(tr.hour ?? "soat").toLowerCase()}`);
  if (hasMileage) parts.push(`${mileageNum} ${(tr.km ?? "km").toLowerCase()}`);
  return parts.join(" / ");
}

export async function generateDelayedReportExcel(data: DelayedReportExcelData) {
  const tr = data.translations;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dejurniy";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Delayed Report");

  // Alternating widths: locomotive (narrower) | hour/km (wider) × 3
  ws.columns = Array.from({ length: TOTAL_COLS }, (_, i) => ({
    width: i % 2 === 0 ? 20 : 30,
  }));

  let r = 1;

  // ── Title ──
  ws.mergeCells(r, 1, r, TOTAL_COLS);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = data.title;
  titleCell.font = { bold: true, size: 16, color: { argb: "FF1E293B" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 28;
  r++;

  // ── Meta row ──
  ws.mergeCells(r, 1, r, TOTAL_COLS);
  const metaCell = ws.getCell(r, 1);
  const orgLabel = tr.organization ?? "Tashkilot";
  const dateLabel = tr.date ?? "Sana";
  const timeLabel = tr.time ?? "Vaqt";
  const parts = [
    data.org ? `${orgLabel}: ${data.org}` : null,
    `${dateLabel}: ${data.date}`,
    `${timeLabel}: ${data.time}`,
  ].filter(Boolean);
  metaCell.value = parts.join("    •    ");
  metaCell.font = { size: 10, color: { argb: "FF64748B" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 18;
  r++;

  // ── Summary row (counts per train type) ──
  const presentTypes = data.delayedLocomotives.filter((tt) =>
    tt.inspection_types.some((it) => it.locomotives.length > 0)
  );

  if (presentTypes.length > 0) {
    ws.mergeCells(r, 1, r, TOTAL_COLS);
    const summary = ws.getCell(r, 1);
    summary.value = presentTypes
      .map((tt) => {
        const c = tt.inspection_types.reduce(
          (s, it) => s + it.locomotives.length,
          0
        );
        return `${trainTypeName(tt.name, tr)}: ${c}`;
      })
      .join("    |    ");
    summary.font = { bold: true, size: 10, color: { argb: "FF3730A3" } };
    summary.alignment = { horizontal: "center", vertical: "middle" };
    summary.fill = SUMMARY_FILL;
    summary.border = borderThin as any;
    ws.getRow(r).height = 20;
    r++;
  }

  // Spacer
  r++;

  // ── Per train type sections ──
  for (const trainType of data.delayedLocomotives) {
    const filtered = trainType.inspection_types.filter(
      (t) => t.locomotives.length > 0
    );
    if (!filtered.length) continue;

    const sectionTotal = filtered.reduce(
      (s, it) => s + it.locomotives.length,
      0
    );

    // Train type heading
    ws.mergeCells(r, 1, r, TOTAL_COLS);
    const ttCell = ws.getCell(r, 1);
    ttCell.value = `  ${trainTypeName(
      trainType.name,
      tr
    )}    (${sectionTotal})`;
    ttCell.font = { bold: true, size: 12, color: { argb: "FF1E293B" } };
    ttCell.alignment = { horizontal: "left", vertical: "middle" };
    ttCell.fill = TRAIN_TYPE_FILL;
    ttCell.border = borderThin as any;
    ws.getRow(r).height = 22;
    r++;

    // Process inspection types in bands of up to 3
    for (let bandStart = 0; bandStart < filtered.length; bandStart += PER_ROW) {
      const band = filtered.slice(bandStart, bandStart + PER_ROW);

      // Helper: column ranges for slot k (0..PER_ROW-1)
      const slotCols = (k: number) => {
        const sc = k * COLS_PER_TYPE + 1;
        return { sc, locoCol: sc, valCol: sc + 1, ec: sc + COLS_PER_TYPE - 1 };
      };

      // Row 1: inspection type names (each merged across its 2 cols)
      band.forEach((type, k) => {
        const { sc, ec } = slotCols(k);
        ws.mergeCells(r, sc, r, ec);
        const c = ws.getCell(r, sc);
        c.value = type.name;
        c.font = { bold: true, size: 10, color: { argb: "FF3730A3" } };
        c.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        c.fill = INSP_TYPE_FILL;
        c.border = (k < band.length - 1 ? borderTypeRight : borderThin) as any;
      });
      ws.getRow(r).height = 22;
      r++;

      // Row 2: column headers (Locomotive | Hour/Km) per slot
      band.forEach((_, k) => {
        const { locoCol, valCol } = slotCols(k);
        const row = ws.getRow(r);
        const locoCell = row.getCell(locoCol);
        locoCell.value = tr.locomotive ?? "Lokomotiv";
        locoCell.font = { bold: true, size: 9, color: { argb: "FF475569" } };
        locoCell.alignment = { horizontal: "center", vertical: "middle" };
        locoCell.fill = HEADER_FILL;
        locoCell.border = borderThin as any;

        const valCell = row.getCell(valCol);
        valCell.value = tr.hourKm ?? `${tr.hour ?? "soat"} / ${tr.km ?? "km"}`;
        valCell.font = { bold: true, size: 9, color: { argb: "FF475569" } };
        valCell.alignment = { horizontal: "center", vertical: "middle" };
        valCell.fill = HEADER_FILL;
        valCell.border = (
          k < band.length - 1 ? borderTypeRight : borderThin
        ) as any;
      });
      ws.getRow(r).height = 18;
      r++;

      // Data rows: pad to the longest column in this band
      const maxLen = Math.max(...band.map((t) => t.locomotives.length));
      for (let li = 0; li < maxLen; li++) {
        const row = ws.getRow(r);
        const zebra = li % 2 === 1;

        band.forEach((type, k) => {
          const { locoCol, valCol } = slotCols(k);
          const loc = type.locomotives[li];
          const locoCell = row.getCell(locoCol);
          const valCell = row.getCell(valCol);

          if (loc) {
            locoCell.value = loc.name;
            locoCell.font = {
              size: 10,
              bold: true,
              color: { argb: "FF1E293B" },
            };
            valCell.value = formatHourMileage(loc.hour, loc.mileage, tr) || "—";
            valCell.font = { size: 10, color: { argb: "FF334155" } };
          } else {
            locoCell.value = "";
            valCell.value = "";
          }

          [locoCell, valCell].forEach((c, j) => {
            c.alignment = { horizontal: "center", vertical: "middle" };
            if (zebra) c.fill = ZEBRA_FILL;
            c.border = (
              k < band.length - 1 && j === 1 ? borderTypeRight : borderThin
            ) as any;
          });
        });

        row.height = 18;
        r++;
      }

      // Band spacer
      r++;
    }

    // Section spacer
    r++;
  }

  // ── Empty state ──
  if (presentTypes.length === 0) {
    ws.mergeCells(r, 1, r, TOTAL_COLS);
    const empty = ws.getCell(r, 1);
    empty.value = tr.noData ?? "—";
    empty.font = { italic: true, color: { argb: "FF94A3B8" } };
    empty.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(r).height = 24;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `delayed_report_${data.date.replace(/\./g, "-")}.xlsx`
  );
}
