"use client";

import { Button } from "@/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { generateExcel, type ExcelExportData } from "@/utils/excel-export";

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

  return (
    <Button
      onClick={handleExport}
      disabled={isGenerating}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {isGenerating ? "Generating..." : "Export Excel"}
    </Button>
  );
}
