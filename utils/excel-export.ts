"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use browser build of exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";

export interface ExcelLocomotiveRow {
  name: string;
  codes: string;
  total: string;
  count: number;
}

export interface ExcelRepairGroup {
  name: string;
  locomotives: Array<{
    name: string;
    inspection_started_time?: string;
    inspection_closed_time?: string | null;
  }>;
}

export interface ExcelDelayedGroup {
  title: string; // e.g., "Elektrovoz-yuk"
  inspection_types: Array<{
    name: string;
    locomotives: Array<{ name: string; hour?: number; mileage?: number }>;
  }>;
}

export interface ExcelReservedGroup {
  title: string;
  locomotives: Array<{
    loco_name: string;
    reserve_started_time?: string;
    reserve_closed_time?: string | null;
  }>;
}

export interface ExcelExportData {
  title: string;
  date: string;
  time: string;
  translations: Record<string, string>;
  activeLocomotives: ExcelLocomotiveRow[];
  switcherLocomotives: ExcelLocomotiveRow[];
  maintenanceLocomotives: ExcelLocomotiveRow[];
  rentedLocomotives: ExcelLocomotiveRow[];
  txk2Electric: ExcelRepairGroup[];
  electricRepair: ExcelRepairGroup[];
  dieselRepair: ExcelRepairGroup[];
  delayedGroups: ExcelDelayedGroup[];
  reservedGroups: ExcelReservedGroup[];
}

type BorderStyle = Partial<ExcelJS.Borders>;

const borderThin: BorderStyle = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

// Soft blue fill for top-level section/category headers only
const headerFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFDBEAFE" },
};

function setTableHeader(row: ExcelJS.Row, bold = true) {
  row.eachCell((cell: ExcelJS.Cell) => {
    cell.font = { bold };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = borderThin;
    // Keep headers bold with borders only (no fill)
  });
}

function setTableBody(row: ExcelJS.Row) {
  row.eachCell((cell: ExcelJS.Cell) => {
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = borderThin;
  });
}

export async function generateExcel(data: ExcelExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dejurniy";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Report");
  // Prepare 24 columns to allow side-by-side tables
  const totalCols = 24;
  const cols = Array.from({ length: totalCols }, () => ({ width: 16 }));
  ws.columns = cols as any;

  // Title
  ws.mergeCells(1, 1, 1, 12);
  ws.getCell(1, 1).value = data.title;
  ws.getCell(1, 1).font = { size: 16, bold: true };
  ws.getCell(1, 1).alignment = { horizontal: "left" };
  ws.getCell(2, 1).value = `${data.translations.date}: ${data.date}`;
  ws.getCell(3, 1).value = `${data.translations.time}: ${data.time}`;

  let currentRow = 5;

  // No frozen panes per request
  ws.views = [{ state: "normal" } as any];

  // Default styles for the whole sheet
  ws.eachRow((row: ExcelJS.Row) => {
    row.height = 22;
  });

  // Helper: set Excel cell as Date if parseable, else keep text/dash
  function setDateCell(cell: ExcelJS.Cell, value?: string | null) {
    if (!value) {
      cell.value = "-";
      return;
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      cell.value = date as any;
      (cell as any).numFmt = "dd/mm/yyyy hh:mm";
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        shrinkToFit: true,
        wrapText: false,
      } as any;
    } else {
      cell.value = value;
    }
  }

  // Helper: draw a section ribbon
  function drawSectionHeader(title: string, startCol: number, endCol: number) {
    ws.mergeCells(currentRow, startCol, currentRow, endCol);
    const c = ws.getCell(currentRow, startCol);
    c.value = title;
    c.font = { bold: true };
    c.alignment = { horizontal: "center" };
    c.fill = headerFill;
    currentRow += 1;
  }

  // Helper: draw a 3-column table where each logical column spans 4 Excel cells (total width 12)
  function drawActiveTable(rows: ExcelLocomotiveRow[], startCol: number) {
    const colA = startCol; // spans colA..colA+3
    const colB = startCol + 4; // spans colB..colB+3
    const colC = startCol + 8; // spans colC..colC+3

    // Header merged pairs
    ws.mergeCells(currentRow, colA, currentRow, colA + 3);
    ws.mergeCells(currentRow, colB, currentRow, colB + 3);
    ws.mergeCells(currentRow, colC, currentRow, colC + 3);
    const headerRow = ws.getRow(currentRow);
    headerRow.getCell(colA).value = "Stansiya";
    headerRow.getCell(colB).value = "Lokomotivlar";
    headerRow.getCell(colC).value = "Jami";
    setTableHeader(headerRow);
    currentRow += 1;

    // Body rows (merge pairs for each logical column)
    rows.forEach((r) => {
      ws.mergeCells(currentRow, colA, currentRow, colA + 3);
      ws.mergeCells(currentRow, colB, currentRow, colB + 3);
      ws.mergeCells(currentRow, colC, currentRow, colC + 3);
      const rr = ws.getRow(currentRow);
      rr.getCell(colA).value = r.name;
      rr.getCell(colB).value = r.codes;
      rr.getCell(colC).value = r.total;
      setTableBody(rr);
      currentRow += 1;
    });

    // Totals row
    const sum = rows.reduce((acc, cur) => acc + (cur.count || 0), 0);
    ws.mergeCells(currentRow, colA, currentRow, colA + 3);
    ws.mergeCells(currentRow, colB, currentRow, colB + 3);
    ws.mergeCells(currentRow, colC, currentRow, colC + 3);
    const totalRow = ws.getRow(currentRow);
    totalRow.getCell(colA).value = data.translations.total || "Jami";
    totalRow.getCell(colC).value = sum;
    totalRow.font = { bold: true } as any;
    setTableBody(totalRow);
    currentRow += 2;
  }

  // Active section (full width 12 cells)
  if ((data.activeLocomotives?.length || 0) > 0) {
    drawSectionHeader("Foydalanishda", 1, 12);
    drawActiveTable(data.activeLocomotives, 1);
    currentRow += 1;
  }

  // Three-category table: 3 blocks side-by-side, each 2 cols (Station, Codes)
  // Header row for categories across 12 cells: each block takes 4 cells
  if (
    (data.switcherLocomotives?.length || 0) > 0 ||
    (data.maintenanceLocomotives?.length || 0) > 0 ||
    (data.rentedLocomotives?.length || 0) > 0
  ) {
    const catsHeaderRow = ws.getRow(currentRow);
    function mergeAndTitle(colStart: number, width: number, title: string) {
      ws.mergeCells(currentRow, colStart, currentRow, colStart + width - 1);
      const c = ws.getCell(currentRow, colStart);
      c.value = title;
      c.alignment = { horizontal: "center" };
      c.fill = headerFill;
      c.font = { bold: true };
      c.border = borderThin;
    }
    // Each block header spans 4 cells (12 total)
    mergeAndTitle(1, 4, data.translations.switcher || "Elektrovoz manyovr");
    mergeAndTitle(5, 4, data.translations.maintenance || "Xo'jalik ishlarida");
    mergeAndTitle(9, 4, data.translations.rented || "Arendada");
    currentRow += 1;

    // Column headers
    const colsHeader = ws.getRow(currentRow);
    const blockStarts = [1, 5, 9];
    blockStarts.forEach((start) => {
      ws.mergeCells(currentRow, start, currentRow, start + 1);
      ws.mergeCells(currentRow, start + 2, currentRow, start + 3);
      colsHeader.getCell(start).value =
        data.translations.activeLocomotives || "Stansiya";
      colsHeader.getCell(start + 2).value = data.translations.codes || "Kodlar";
    });
    setTableHeader(colsHeader);
    currentRow += 1;

    const maxRowCount = Math.max(
      data.switcherLocomotives.length,
      data.maintenanceLocomotives.length,
      data.rentedLocomotives.length
    );
    for (let i = 0; i < maxRowCount; i += 1) {
      const r = ws.getRow(currentRow);
      const s = data.switcherLocomotives[i];
      const m = data.maintenanceLocomotives[i];
      const rent = data.rentedLocomotives[i];
      // Block 1 merges (4 cells per block column)
      ws.mergeCells(currentRow, 1, currentRow, 2);
      ws.mergeCells(currentRow, 3, currentRow, 4);
      r.getCell(1).value = s?.name || "";
      r.getCell(3).value = s?.codes || "";
      // Block 2 merges
      ws.mergeCells(currentRow, 5, currentRow, 6);
      ws.mergeCells(currentRow, 7, currentRow, 8);
      r.getCell(5).value = m?.name || "";
      r.getCell(7).value = m?.codes || "";
      // Block 3 merges
      ws.mergeCells(currentRow, 9, currentRow, 10);
      ws.mergeCells(currentRow, 11, currentRow, 12);
      r.getCell(9).value = rent?.name || "";
      r.getCell(11).value = rent?.codes || "";
      setTableBody(r);
      currentRow += 1;
    }
    currentRow += 1;
  }

  // Helper to render groups in a 12-cell wide grid
  function renderGroupGrid(
    title: string,
    groups: ExcelRepairGroup[],
    tablesPerRow: number,
    headers: string[]
  ) {
    // Ensure section spans full width
    drawSectionHeader(title, 1, 12);

    const tableWidth = Math.floor(12 / tablesPerRow); // e.g., 4 when tablesPerRow=3
    const colStarts: number[] = [];
    for (let i = 0; i < tablesPerRow; i += 1) {
      colStarts.push(i * tableWidth + 1);
    }

    // Compute spans per logical column so the total equals tableWidth
    function computeSpans(width: number, columns: number): number[] {
      const base = Math.floor(width / columns);
      let remainder = width - base * columns;
      const spans: number[] = new Array(columns).fill(base);
      for (let i = 0; i < columns && remainder > 0; i += 1) {
        spans[i] += 1;
        remainder -= 1;
      }
      return spans;
    }

    const spans = computeSpans(tableWidth, headers.length);

    // Filter out empty groups and expand remaining evenly in each row
    const nonEmpty = groups.filter((g) => (g.locomotives?.length || 0) > 0);
    for (let i = 0; i < nonEmpty.length; ) {
      const remaining = nonEmpty.length - i;
      const perRow = Math.min(tablesPerRow, remaining);
      const tableWidthDynamic = Math.floor(12 / perRow);
      const colStartsDyn: number[] = [];
      for (let k = 0; k < perRow; k += 1)
        colStartsDyn.push(k * tableWidthDynamic + 1);
      const slice = nonEmpty.slice(i, i + perRow);

      // Group titles across each table width
      slice.forEach((g, idx) => {
        const startCol = colStartsDyn[idx];
        ws.mergeCells(
          currentRow,
          startCol,
          currentRow,
          startCol + tableWidthDynamic - 1
        );
        const c = ws.getCell(currentRow, startCol);
        c.value = g.name;
        c.font = { bold: true } as any;
        c.alignment = { horizontal: "center" } as any;
        c.fill = headerFill;
        c.border = borderThin;
      });
      currentRow += 1;

      // Headers per table using computed spans
      slice.forEach((_, idx) => {
        const startCol = colStartsDyn[idx];
        const rowObj = ws.getRow(currentRow);
        let offset = 0;
        const spansDyn = computeSpans(tableWidthDynamic, headers.length);
        headers.forEach((h, hi) => {
          const span = spansDyn[hi];
          const from = startCol + offset;
          const to = from + span - 1;
          if (span > 1) ws.mergeCells(currentRow, from, currentRow, to);
          rowObj.getCell(from).value = h;
          offset += span;
        });
        setTableHeader(rowObj);
      });
      currentRow += 1;

      // Body rows
      const maxLen = Math.max(...slice.map((g) => g.locomotives.length));
      for (let rIdx = 0; rIdx < maxLen; rIdx += 1) {
        const bandRow = ws.getRow(currentRow);
        slice.forEach((g, idx) => {
          const startCol = colStartsDyn[idx];
          const l = g.locomotives[rIdx];
          let offset = 0;
          const values = [
            l?.name || "",
            l?.inspection_started_time,
            l?.inspection_closed_time,
          ];
          const spansDyn = computeSpans(tableWidthDynamic, headers.length);
          headers.forEach((_, hi) => {
            const span = spansDyn[hi];
            const from = startCol + offset;
            const to = from + span - 1;
            if (span > 1) ws.mergeCells(currentRow, from, currentRow, to);
            if (hi === 0) {
              bandRow.getCell(from).value = values[hi] ?? "";
            } else {
              setDateCell(
                bandRow.getCell(from),
                values[hi] as string | undefined
              );
            }
            // style applied to left cell of merged region
            for (let c = from; c <= to; c += 1) {
              const cell = bandRow.getCell(c);
              cell.border = borderThin;
              cell.alignment = {
                vertical: "middle",
                horizontal: "center",
                wrapText: true,
              } as any;
            }
            offset += span;
          });
        });
        currentRow += 1;
      }
      currentRow += 1;
      i += perRow;
    }
  }

  // TXK2 (12-cell band: 3 tables per row → 4 cells per table)
  if ((data.txk2Electric?.length || 0) > 0)
    renderGroupGrid(
      data.translations.txk2Electric || "Txk-2 ta'mirdagi elektrovozlar",
      data.txk2Electric,
      3,
      [
        data.translations.active || "Lokomotiv",
        data.translations.started || "Kirdi",
        data.translations.replaced || "Chiqdi",
      ]
    );

  // Electric Repair (12-cell band)
  if ((data.electricRepair?.length || 0) > 0)
    renderGroupGrid(
      data.translations.electricRepair || "Ta'mirdagi elektrovozlar",
      data.electricRepair,
      3,
      [
        data.translations.active || "Lokomotiv",
        data.translations.started || "Kirdi",
        data.translations.replaced || "Chiqdi",
      ]
    );

  // Diesel Repair (12-cell band)
  if ((data.dieselRepair?.length || 0) > 0)
    renderGroupGrid(
      data.translations.dieselRepair || "Ta'mirdagi teplovozlar",
      data.dieselRepair,
      3,
      [
        data.translations.active || "Lokomotiv",
        data.translations.started || "Kirdi",
        data.translations.replaced || "Chiqdi",
      ]
    );

  // Delayed Repairs: 12-cell band; skip empty types and expand remaining per row
  if ((data.delayedGroups?.length || 0) > 0) {
    drawSectionHeader(
      data.translations.delayed || "Kechikkan ta'mirlar",
      1,
      12
    );
    data.delayedGroups.forEach((trainGroup) => {
      // train group title
      ws.mergeCells(currentRow, 1, currentRow, 12);
      const tg = ws.getCell(currentRow, 1);
      tg.value = trainGroup.title;
      tg.font = { bold: true };
      tg.alignment = { horizontal: "left" };
      tg.fill = headerFill;
      currentRow += 1;

      const types = trainGroup.inspection_types.filter(
        (t) => (t.locomotives?.length || 0) > 0
      );
      for (let i = 0; i < types.length; ) {
        const remaining = types.length - i;
        const perRow = Math.min(6, remaining);
        const tableWidth = Math.floor(12 / perRow);
        const starts: number[] = [];
        for (let k = 0; k < perRow; k += 1) starts.push(k * tableWidth + 1);
        const slice = types.slice(i, i + perRow);
        // type titles
        slice.forEach((type, idx) => {
          const sc = starts[idx];
          ws.mergeCells(currentRow, sc, currentRow, sc + tableWidth - 1);
          const c = ws.getCell(currentRow, sc);
          c.value = type.name;
          c.font = { bold: true };
          c.alignment = { horizontal: "center" };
          c.border = borderThin;
        });
        currentRow += 1;
        // headers
        slice.forEach((_, idx) => {
          const sc = starts[idx];
          const r = ws.getRow(currentRow);
          const half = Math.max(1, Math.floor(tableWidth / 2));
          const leftEnd = sc + half - 1;
          const rightStart = leftEnd + 1;
          if (leftEnd > sc) ws.mergeCells(currentRow, sc, currentRow, leftEnd);
          if (sc + tableWidth - 1 > rightStart)
            ws.mergeCells(
              currentRow,
              rightStart,
              currentRow,
              sc + tableWidth - 1
            );
          r.getCell(sc).value = data.translations.active || "Lokomotiv";
          r.getCell(rightStart).value = `${
            data.translations.hour || "soat"
          } / ${data.translations.Km || "km"}`;
          setTableHeader(r);
        });
        currentRow += 1;
        const maxLen = Math.max(...slice.map((t) => t.locomotives.length));
        for (let rIdx = 0; rIdx < maxLen; rIdx += 1) {
          const rowObj = ws.getRow(currentRow);
          slice.forEach((t, idx) => {
            const sc = starts[idx];
            const l = t.locomotives[rIdx];
            const half = Math.max(1, Math.floor(tableWidth / 2));
            const leftEnd = sc + half - 1;
            const rightStart = leftEnd + 1;
            const rightEnd = sc + tableWidth - 1;
            // Always merge the two halves for visual cohesion
            if (leftEnd > sc)
              ws.mergeCells(currentRow, sc, currentRow, leftEnd);
            if (rightEnd > rightStart)
              ws.mergeCells(currentRow, rightStart, currentRow, rightEnd);
            if (l) {
              rowObj.getCell(sc).value = l.name;
              const hasHour = typeof l.hour === "number" && !isNaN(l.hour);
              const hasMileage =
                typeof l.mileage === "number" && !isNaN(l.mileage);
              let rightText = "";
              if (hasHour)
                rightText += `${l.hour} ${data.translations.hour || "soat"}`;
              if (hasHour && hasMileage) rightText += " / ";
              if (hasMileage)
                rightText += `${l.mileage} ${data.translations.Km || "km"}`;
              rowObj.getCell(rightStart).value = rightText;
            }
            for (let c = sc; c <= rightEnd; c += 1) {
              const cell = rowObj.getCell(c);
              cell.border = borderThin;
              cell.alignment = {
                vertical: "middle",
                horizontal: "center",
                wrapText: true,
              } as any;
            }
          });
          currentRow += 1;
        }
        currentRow += 1;
        i += perRow;
      }
    });
  }

  // Reserved: 4 tables per row, each 3 columns; skip empty groups
  const reservedCols = [1, 4, 7, 10];
  const reservedNonEmpty = (data.reservedGroups || []).filter(
    (g) => (g.locomotives?.length || 0) > 0
  );
  if (reservedNonEmpty.length > 0) {
    drawSectionHeader(
      data.translations.reserve || "Rezervdagi lokomotivlar",
      1,
      12
    );
    for (let i = 0; i < reservedNonEmpty.length; i += 4) {
      const slice = reservedNonEmpty.slice(i, i + 4);
      // titles
      slice.forEach((grp, idx) => {
        const sc = reservedCols[idx];
        ws.mergeCells(currentRow, sc, currentRow, sc + 2);
        const c = ws.getCell(currentRow, sc);
        c.value = grp.title;
        c.font = { bold: true };
        c.alignment = { horizontal: "center" };
        c.fill = headerFill;
        c.border = borderThin;
      });
      currentRow += 1;
      // headers
      slice.forEach((_, idx) => {
        const sc = reservedCols[idx];
        const r = ws.getRow(currentRow);
        r.getCell(sc).value = data.translations.active || "Lokomotiv";
        r.getCell(sc + 1).value =
          data.translations.reserve || "Rezerv boshlanishi";
        r.getCell(sc + 2).value =
          data.translations.replaced || "Rezerv tugashi";
        setTableHeader(r);
      });
      currentRow += 1;
      const maxLen = Math.max(...slice.map((g) => g.locomotives.length));
      for (let rIdx = 0; rIdx < maxLen; rIdx += 1) {
        const r = ws.getRow(currentRow);
        slice.forEach((g, idx) => {
          const sc = reservedCols[idx];
          const l = g.locomotives[rIdx];
          if (l) {
            r.getCell(sc).value = l.loco_name;
            setDateCell(r.getCell(sc + 1), l.reserve_started_time);
            setDateCell(r.getCell(sc + 2), l.reserve_closed_time);
          }
          r.getCell(sc).border = borderThin;
          r.getCell(sc + 1).border = borderThin;
          r.getCell(sc + 2).border = borderThin;
          r.getCell(sc).alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          };
          r.getCell(sc + 1).alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          };
          r.getCell(sc + 2).alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          };
        });
        currentRow += 1;
      }
      currentRow += 1;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const safeTitle = data.title
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_");
  const safeDate = data.date.replace(/[\\/:*?"<>|]/g, "-");
  const filename = `${safeTitle}_${safeDate}.xlsx`;
  saveAs(blob, filename);
}
