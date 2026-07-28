"use client";

import { LogEntry, LogAction } from "@/api/types/logs";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  ClipboardCheck,
  MapPin,
  Flag,
  Briefcase,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/ui/badge";

interface LocomotiveHistoryTimelineProps {
  logs: LogEntry[];
  t: (key: string) => string;
}

type EventConfig = {
  icon: React.ComponentType<{ className?: string }>;
  badgeBgColor: string;
  badgeTextColor: string;
  nodeColor: string;
  label: string;
};

const getEventConfig = (action: LogAction, t: (key: string) => string): EventConfig => {
  const configs: Record<LogAction, EventConfig> = {
    inspection_opened: {
      icon: ClipboardCheck,
      badgeBgColor: "bg-green-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-green-500",
      label: t("inspection_opened"),
    },
    inspection_closed: {
      icon: ClipboardCheck,
      badgeBgColor: "bg-red-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-red-500",
      label: t("inspection_closed"),
    },
    location_changed: {
      icon: MapPin,
      badgeBgColor: "bg-blue-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-blue-500",
      label: t("location_changed"),
    },
    reserve_started: {
      icon: Flag,
      badgeBgColor: "bg-yellow-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-yellow-500",
      label: t("reserve_started"),
    },
    reserve_ended: {
      icon: Flag,
      badgeBgColor: "bg-orange-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-orange-500",
      label: t("reserve_ended"),
    },
    assignment_started: {
      icon: ArrowRight,
      badgeBgColor: "bg-purple-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-purple-500",
      label: t("assignment_started"),
    },
    assignment_ended: {
      icon: ArrowLeft,
      badgeBgColor: "bg-pink-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-pink-500",
      label: t("assignment_ended"),
    },
    rental_started: {
      icon: Briefcase,
      badgeBgColor: "bg-indigo-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-indigo-500",
      label: t("rental_started"),
    },
    rental_ended: {
      icon: Briefcase,
      badgeBgColor: "bg-teal-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-teal-500",
      label: t("rental_ended"),
    },
    opened: {
      icon: ClipboardCheck,
      badgeBgColor: "bg-green-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-green-500",
      label: t("opened"),
    },
    closed: {
      icon: ClipboardCheck,
      badgeBgColor: "bg-red-500",
      badgeTextColor: "text-white",
      nodeColor: "bg-red-500",
      label: t("closed"),
    },
  };

  return configs[action] || configs.inspection_opened;
};

export function LocomotiveHistoryTimeline({
  logs,
  t,
}: LocomotiveHistoryTimelineProps) {
  // Sort logs by created_time
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      return (
        new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
      );
    });
  }, [logs]);

  if (sortedLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No events found in the selected period.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-[120px] top-0 bottom-0 w-0.5 bg-gray-300" />

      {/* Events */}
      <div className="space-y-3 pb-6">
        {sortedLogs.map((log, index) => {
          const config = getEventConfig(log.action, t);
          const Icon = config.icon;
          const eventDate = new Date(log.created_time);
          const timeStr = format(eventDate, "HH:mm");
          const dateStr = format(eventDate, "dd MMM yyyy", { locale: uz });

          return (
            <div key={log.id} className="relative flex items-center gap-2">
              {/* Timestamp */}
              <div className="w-[80px] text-right flex-shrink-0">
                <div className="text-sm font-medium text-gray-700">
                  {timeStr}
                </div>
                {index === 0 ||
                format(new Date(sortedLogs[index - 1].created_time), "dd MMM yyyy", {
                  locale: uz,
                }) !== dateStr ? (
                  <div className="text-xs text-gray-500">{dateStr}</div>
                ) : null}
              </div>

              {/* Timeline Node */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-white shadow-md",
                    config.nodeColor
                  )}
                />
              </div>

              {/* Event Card - Everything in one line with uniform background */}
              <div className="flex-1 rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md flex-shrink-0 bg-gray-100">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <Badge
                    className={cn(
                      "px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
                      config.badgeBgColor,  
                      config.badgeTextColor
                    )}
                  >
                    {config.label}
                  </Badge>
                  {log.message && (
                    <p className="text-sm text-gray-600 truncate flex-1 min-w-0">
                      {log.message}
                    </p>
                  )}
                  {log.author && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {t("author")}: {log.author.first_name}{" "}
                      {log.author.last_name}
                    </span>
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
