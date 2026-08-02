"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { Button } from "@gameverse/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gameverse/ui/dropdown-menu";
import { exportAnalyticsData } from "../_actions/analytics";
import type { AnalyticsFilters, AnalyticsExportFormat } from "@gameverse/types";
import { logger } from "@/lib/logger";

interface ExportButtonProps {
  filters: AnalyticsFilters;
  disabled?: boolean;
}

export function ExportButton({ filters, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: AnalyticsExportFormat) => {
    setIsExporting(true);
    try {
      const result = await exportAnalyticsData("registrations", format, filters);
      if (result.success && result.data) {
        const blob = new Blob([result.data.content], {
          type: result.data.mimeType,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error({ err: error }, "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <File className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
