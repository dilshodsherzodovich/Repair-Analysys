"use client";

import { useState } from "react";
import { generatePDFFromElement } from "@/utils/pdf-export";
import type { PDFExportData } from "@/utils/pdf-export";
import { generateReportsPDF } from "@/utils/reports-pdf-export";
import { useTranslations } from "next-intl";
import { ExportActions } from "@/ui/export-actions";

interface PDFExportButtonProps {
  data?: PDFExportData;
  className?: string;
  targetRef?: React.RefObject<HTMLElement | null>;
  filename?: string;
}

export function PDFExportButton({
  data,
  className,
  targetRef,
  filename,
}: PDFExportButtonProps) {
  const t = useTranslations("Reports");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      if (targetRef?.current) {
        // Add compact class to shrink layout and hide controls
        targetRef.current.classList.add("pdf-compact");
        await generatePDFFromElement(
          targetRef.current as HTMLElement,
          filename
        );
        targetRef.current.classList.remove("pdf-compact");
      } else if (data) {
        await generateReportsPDF(data);
      } else {
        throw new Error("No data or targetRef provided for PDF export");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      // You could add a toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  return <ExportActions onPdf={handleExport} busy={isGenerating ? "pdf" : null} />;
}
