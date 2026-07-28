"use client";

import { Inspection } from "@/api/types/report-inspection";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  ClipboardCheck,
  XCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  User,
  FileText,
} from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/ui/badge";

interface LocomotiveInspectionsTimelineProps {
  inspections: Inspection[];
  t: (key: string) => string;
}

export function LocomotiveInspectionsTimeline({
  inspections,
  t,
}: LocomotiveInspectionsTimelineProps) {
  // Sort inspections by created_time chronologically
  const sortedInspections = useMemo(() => {
    return [...inspections].sort((a, b) => {
      return (
        new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
      );
    });
  }, [inspections]);

  if (sortedInspections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("noData") || "No inspections found in the selected period."}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-[120px] top-0 bottom-0 w-0.5 bg-gray-300" />

      {/* Events */}
      <div className="space-y-3 pb-6">
        {sortedInspections.map((inspection, index) => {
          const eventDate = new Date(inspection.created_time);
          const timeStr = format(eventDate, "HH:mm");
          const dateStr = format(eventDate, "dd MMM yyyy", { locale: uz });
          const isClosed = inspection.is_closed;
          const isCancelled = inspection.is_cancelled;

          // Determine status badge color
          let statusBadgeColor = "bg-blue-500";
          let statusText = t("open") || "Open";
          if (isCancelled) {
            statusBadgeColor = "bg-red-500";
            statusText = t("canceled") || t("cancelled") || "Cancelled";
          } else if (isClosed) {
            statusBadgeColor = "bg-green-500";
            statusText = t("closed") || "Closed";
          }

          return (
            <div key={inspection.id} className="relative flex items-center gap-2">
              {/* Timestamp */}
              <div className="w-[80px] text-right flex-shrink-0">
                <div className="text-sm font-medium text-gray-700">
                  {timeStr}
                </div>
                {index === 0 ||
                format(
                  new Date(sortedInspections[index - 1].created_time),
                  "dd MMM yyyy",
                  { locale: uz }
                ) !== dateStr ? (
                  <div className="text-xs text-gray-500">{dateStr}</div>
                ) : null}
              </div>

              {/* Timeline Node */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-white shadow-md",
                    isCancelled
                      ? "bg-red-500"
                      : isClosed
                      ? "bg-green-500"
                      : "bg-blue-500"
                  )}
                />
              </div>

              {/* Inspection Card */}
              <div className="flex-1 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
                <div className="space-y-2">
                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-1.5 rounded-md flex-shrink-0 bg-blue-50">
                        <ClipboardCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {inspection.inspection_type?.name || "-"}
                        </h3>
                        {inspection.section && (
                          <p className="text-xs text-gray-500">
                            {t("section")}: {t(`sectionNames.${inspection.section}`) || inspection.section}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white",
                        statusBadgeColor
                      )}
                    >
                      {statusText}
                    </Badge>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {inspection.branch && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">{t("branch")}:</span>
                        <span className="truncate">{inspection.branch.name}</span>
                      </div>
                    )}
                    {inspection.locomotive?.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">{t("location")}:</span>
                        <span className="truncate">
                          {inspection.locomotive.location.name}
                        </span>
                      </div>
                    )}
                    {inspection.author && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">{t("author")}:</span>
                        <span className="truncate">
                          {inspection.author.first_name} {inspection.author.last_name}
                        </span>
                      </div>
                    )}
                    {inspection.is_closed_time && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                        <span className="font-medium">{t("closedTime")}:</span>
                        <span>
                          {format(new Date(inspection.is_closed_time), "dd MMM yyyy, HH:mm", {
                            locale: uz,
                          })}
                        </span>
                      </div>
                    )}
                    {inspection.is_cancelled_time && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
                        <span className="font-medium">{t("canceledTime")}:</span>
                        <span>
                          {format(new Date(inspection.is_cancelled_time), "dd MMM yyyy, HH:mm", {
                            locale: uz,
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-medium">{t("createdTime")}:</span>
                      <span>
                        {format(eventDate, "dd MMM yyyy, HH:mm", { locale: uz })}
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  {inspection.comment && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 pt-1 border-t border-gray-100">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">{t("comment")}:</span>
                        <p className="text-gray-700 mt-0.5">{inspection.comment}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
