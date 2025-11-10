"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
} from "lucide-react";
import { EnhancedButton } from "@/ui/enhanced-button";

export interface DocumentViewerProps {
  documentUrl: string;
  documentName: string;
  documentType: "pdf" | "image" | "text" | "office";
  canEdit?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  className?: string;
}

const DocumentViewer = React.forwardRef<HTMLDivElement, DocumentViewerProps>(
  (
    {
      documentUrl,
      documentName,
      documentType,
      canEdit = false,
      canDelete = false,
      canShare = false,
      onEdit,
      onDelete,
      onShare,
      onDownload,
      className,
      ...props
    },
    ref
  ) => {
    const [zoom, setZoom] = React.useState(100);
    const [rotation, setRotation] = React.useState(0);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
    const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
    const handleFullscreen = () => setIsFullscreen(!isFullscreen);

    const renderViewer = () => {
      switch (documentType) {
        case "pdf":
          return (
            <iframe
              src={documentUrl}
              className="w-full h-full border-0"
              title={documentName}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              }}
            />
          );
        case "image":
          return (
            <img
              src={documentUrl || "/placeholder.svg"}
              alt={documentName}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              }}
            />
          );
        case "text":
          return (
            <div
              className="w-full h-full p-4 overflow-auto bg-white text-[#1f2937]"
              style={{ fontSize: `${zoom}%` }}
            >
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {/* Document content */}
              </pre>
            </div>
          );
        default:
          return (
            <div className="flex items-center justify-center h-full bg-[#f9fafb] text-[#6b7280]">
              <div className="text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Предварительный просмотр недоступен</p>
                <p className="text-sm mt-2">
                  Нажмите "Скачать" для просмотра файла
                </p>
              </div>
            </div>
          );
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-lg border shadow-sm",
          isFullscreen && "fixed inset-0 z-50 rounded-none",
          className
        )}
        {...props}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb]">
          <div>
            <h3 className="font-medium text-[#1f2937] truncate">
              {documentName}
            </h3>
            <p className="text-sm text-[#6b7280]">Масштаб: {zoom}%</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom controls */}
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <EnhancedButton
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="w-4 h-4" />
              </EnhancedButton>
              <span className="text-sm px-2">{zoom}%</span>
              <EnhancedButton
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="w-4 h-4" />
              </EnhancedButton>
            </div>

            {/* Rotate */}
            <EnhancedButton size="sm" variant="ghost" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </EnhancedButton>

            {/* Fullscreen */}
            <EnhancedButton
              size="sm"
              variant="ghost"
              onClick={handleFullscreen}
            >
              <Maximize className="w-4 h-4" />
            </EnhancedButton>

            {/* Actions */}
            <div className="flex items-center space-x-1 border-l pl-2 ml-2">
              {onDownload && (
                <EnhancedButton size="sm" variant="ghost" onClick={onDownload}>
                  <Download className="w-4 h-4" />
                </EnhancedButton>
              )}
              {canShare && onShare && (
                <EnhancedButton size="sm" variant="ghost" onClick={onShare}>
                  <Share2 className="w-4 h-4" />
                </EnhancedButton>
              )}
              {canEdit && onEdit && (
                <EnhancedButton size="sm" variant="ghost" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </EnhancedButton>
              )}
              {canDelete && onDelete && (
                <EnhancedButton size="sm" variant="ghost" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 text-[#ff5959]" />
                </EnhancedButton>
              )}
            </div>
          </div>
        </div>

        {/* Viewer */}
        <div className="h-96 overflow-hidden">{renderViewer()}</div>
      </div>
    );
  }
);
DocumentViewer.displayName = "DocumentViewer";

export { DocumentViewer };
