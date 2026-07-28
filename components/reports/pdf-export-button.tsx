"use client";

import { Button } from "@/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { generatePDFFromElement } from "@/utils/pdf-export";
import type { PDFExportData } from "@/utils/pdf-export";
import { generateReportsPDF } from "@/utils/reports-pdf-export";
import { useTranslations } from "next-intl";
import { useRef } from "react";

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

  return (
    <Button
      onClick={handleExport}
      disabled={isGenerating}
      className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {isGenerating ? t("generatingPDF") : t("exportPDF")}
    </Button>
  );
}
