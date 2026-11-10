"use client";

import { useState } from "react";
import { generateExcel, type ExcelExportData } from "@/utils/excel-export";
import { ExportActions } from "@/ui/export-actions";

interface ExcelExportButtonProps {
  data: ExcelExportData;
  className?: string;
}

export function ExcelExportButton({ data, className }: ExcelExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      await generateExcel(data);
    } catch (error) {
      console.error("Error generating Excel:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return <ExportActions onExcel={handleExport} busy={isGenerating ? "excel" : null} />;
}
