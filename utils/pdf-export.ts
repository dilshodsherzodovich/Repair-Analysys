import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { formatDate } from "./formatDate";

export interface LocomotivePDFData {
  title: string;
  date: string;
  time: string;
  totalLocomotives: number;
  activeLocomotives: Array<{
    name: string;
    codes: string;
    total: string;
    count: number;
  }>;
  switcherLocomotives: Array<{
    name: string;
    codes: string;
    total: string;
    count: number;
  }>;
  maintenanceLocomotives: Array<{
    name: string;
    codes: string;
    total: string;
    count: number;
  }>;
  rentedLocomotives: Array<{
    name: string;
    codes: string;
    total: string;
    count: number;
  }>;
  electricRepair: Array<{
    name: string;
    locomotives: Array<{
      name: string;
      inspection_started_time: string;
      inspection_closed_time?: string;
    }>;
  }>;
  dieselRepair: Array<{
    name: string;
    locomotives: Array<{
      name: string;
      inspection_started_time: string;
      inspection_closed_time?: string;
    }>;
  }>;
  txk2Repair: Array<{
    name: string;
    locomotives: Array<{
      name: string;
      inspection_started_time: string;
      inspection_closed_time?: string;
    }>;
  }>;
  delayedLocomotives: Array<{
    name: string;
    inspection_types: Array<{
      name: string;
      locomotives: Array<{
        name: string;
        hour: number;
        mileage: number;
      }>;
    }>;
  }>;
  reservedLocomotives: Record<
    string,
    Array<{
      loco_id: number;
      loco_name: string;
      reserve_started_time: string;
      reserve_closed_time: string | null;
    }>
  >;
  totals: {
    active: number;
    switcher: number;
    maintenance: number;
    rented: number;
    electricRepair: number;
    dieselRepair: number;
    delayed: number;
    total: number;
  };
  locale: string;
  translations: Record<string, string>;
}

// Alias to keep component imports stable
export type PDFExportData = LocomotivePDFData;

export const generatePDF = (data: LocomotivePDFData) => {
  const doc = new jsPDF();

  const { date, time, totalLocomotives } = data;

  doc.setFontSize(18);
  doc.text(data.title || "MA'LUMOTNOMA", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Sana: ${date}`, 14, 30);
  doc.text(`Vaqti: ${time}`, 14, 37);
  doc.text(`Umumiy lokomotivlar soni: ${totalLocomotives}`, 14, 44);

  const sectionMap: {
    title: string;
    items: typeof data.activeLocomotives | typeof data.electricRepair;
    isRepair?: boolean;
  }[] = [
    { title: "Foydalanishda", items: data.activeLocomotives },
    { title: "Manevr elektrovozlar", items: data.switcherLocomotives },
    { title: "Xo'jalik ishlari uchun", items: data.maintenanceLocomotives },
    { title: "Ijaradagi teplovozlar", items: data.rentedLocomotives },
    {
      title: "Ta'mirdagi elektrovozlar",
      items: data.electricRepair,
      isRepair: true,
    },
    {
      title: "Ta'mirdagi teplovozlar",
      items: data.dieselRepair,
      isRepair: true,
    },
  ];

  let currentY = 52;

  for (const { title, items, isRepair } of sectionMap) {
    if (!items || items.length === 0) continue;

    doc.setFontSize(13);
    doc.text(title, 105, currentY, { align: "center" });
    currentY += 4;

    if (isRepair) {
      // For repair sections, create separate tables for each repair station
      const repairItems = items as typeof data.electricRepair;

      for (const repairStation of repairItems) {
        if (
          !repairStation.locomotives ||
          repairStation.locomotives.length === 0
        )
          continue;

        // Add repair station name as header spanning the table width
        doc.setFontSize(10);
        // doc.setFont("helvetica", "bold");
        doc.text(repairStation.name, 14, currentY, { align: "left" });
        currentY += 2;

        autoTable(doc, {
          startY: currentY,
          head: [["Lokomotiv", "Ko'rik boshlanish vaqti"]],
          body: repairStation.locomotives.map((loc) => [
            loc.name,
            formatDate(loc.inspection_started_time, "datetime"),
          ]),
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 110 },
          },
          theme: "grid",
          headStyles: { fillColor: [0, 0, 0], textColor: 255 },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }
    } else {
      // For non-repair sections, use the original table format
      autoTable(doc, {
        startY: currentY,
        head: [["Stansiya", "Lokomotivlar", "Jami"]],
        body: (items as typeof data.activeLocomotives).map((item) => [
          item.name,
          item.codes,
          item.total,
        ]),
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 60 },
          2: { cellWidth: 70 },
        },
        theme: "grid",
        headStyles: { fillColor: [0, 0, 0], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  doc.save("malumotnoma.pdf");
};

// Pixel-perfect capture of an element to PDF (A4, multi-page)
export const generatePDFFromElement = async (
  element: HTMLElement,
  filename = "malumotnoma.pdf"
) => {
  // Whole element snapshot; slice canvas per page to avoid duplication
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const pageWidthPx = canvas.width; // scale image to full page width
  const pageHeightPx = Math.floor((pageWidthPx * pageHeight) / pageWidth);

  // If page markers exist, collect ALL of them and ensure we break at their positions
  const markerNodes = Array.from(
    element.querySelectorAll<HTMLElement>("[data-pdf-separate-page]")
  );
  const forcedBreakYs: number[] = markerNodes
    .map((node) => {
      const rect = node.getBoundingClientRect();
      const parentRect = element.getBoundingClientRect();
      const relativeY = rect.top - parentRect.top + element.scrollTop; // CSS px
      const scale = canvas.height / element.scrollHeight; // canvas px per CSS px
      return Math.max(0, Math.floor(relativeY * scale));
    })
    .filter((y, idx, arr) => Number.isFinite(y) && arr.indexOf(y) === idx)
    .sort((a, b) => a - b);

  // Collect block regions we should keep intact on a single page
  const blockNodes = Array.from(
    element.querySelectorAll<HTMLElement>("[data-pdf-block]")
  );
  const scale = canvas.height / element.scrollHeight;
  const blocks = blockNodes
    .map((node) => {
      const rect = node.getBoundingClientRect();
      const parentRect = element.getBoundingClientRect();
      const top = Math.max(
        0,
        Math.floor((rect.top - parentRect.top + element.scrollTop) * scale)
      );
      const bottom = Math.max(
        top,
        Math.floor((rect.bottom - parentRect.top + element.scrollTop) * scale)
      );
      return { top, bottom, height: bottom - top };
    })
    .filter((b) => b.height > 0)
    .sort((a, b) => a.top - b.top);

  // Build page slices: fill up to page capacity, but if a row would be cut,
  // pull the end up to the start of that row. Also honor explicit break markers.
  const pageSlices: Array<{ start: number; end: number }> = [];
  const pageCapacity = pageHeightPx; // canvas px
  let pageStart = 0;
  let nextMarkerIdx = 0;

  while (pageStart < canvas.height) {
    let candidateEnd = Math.min(pageStart + pageCapacity, canvas.height);

    // If the next forced break falls within this page, end at the break
    while (
      nextMarkerIdx < forcedBreakYs.length &&
      forcedBreakYs[nextMarkerIdx] <= pageStart
    ) {
      nextMarkerIdx++;
    }
    if (
      nextMarkerIdx < forcedBreakYs.length &&
      forcedBreakYs[nextMarkerIdx] > pageStart &&
      forcedBreakYs[nextMarkerIdx] < candidateEnd
    ) {
      candidateEnd = forcedBreakYs[nextMarkerIdx];
    }

    // If any protected block (row) crosses candidateEnd, move end up to the start of that block
    const crossingBlock = blocks.find(
      (b) => b.top < candidateEnd && b.bottom > candidateEnd
    );
    if (crossingBlock) {
      // Avoid infinite loops if the block starts at or before pageStart
      if (crossingBlock.top <= pageStart) {
        // Force this very large row to a new page boundary by ending at candidateEnd
        // This will slice the row only if it exceeds the full page height (rare)
      } else {
        candidateEnd = Math.max(pageStart, crossingBlock.top);
      }
    }

    // Safety: ensure progress
    if (candidateEnd <= pageStart) {
      candidateEnd = Math.min(pageStart + pageCapacity, canvas.height);
    }

    pageSlices.push({ start: pageStart, end: candidateEnd });
    pageStart = candidateEnd;
  }

  let firstPage = true;
  for (const slice of pageSlices) {
    const y = slice.start;
    const sliceHeight = slice.end - slice.start;
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) continue;
    ctx.drawImage(
      canvas,
      0,
      y,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );
    const imgData = pageCanvas.toDataURL("image/png");
    if (!firstPage) pdf.addPage();
    firstPage = false;
    const drawWidth = pageWidth;
    const drawHeight = (sliceHeight * drawWidth) / canvas.width;
    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      drawWidth,
      drawHeight,
      undefined,
      "FAST"
    );
  }

  pdf.save(filename);
};
