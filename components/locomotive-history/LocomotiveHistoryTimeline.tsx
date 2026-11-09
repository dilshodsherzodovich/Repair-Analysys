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
      badgeBgColor: "bg-success",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-success",
      label: t("inspection_opened"),
    },
    inspection_closed: {
      icon: ClipboardCheck,
      badgeBgColor: "bg-destructive",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-destructive",
      label: t("inspection_closed"),
    },
    location_changed: {
      icon: MapPin,
      badgeBgColor: "bg-primary",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-primary",
      label: t("location_changed"),
    },
    reserve_started: {
      icon: Flag,
      badgeBgColor: "bg-warning",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-warning",
      label: t("reserve_started"),
    },
    reserve_ended: {
      icon: Flag,
      badgeBgColor: "bg-warning",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-warning",
      label: t("reserve_ended"),
    },
    assignment_started: {
      icon: ArrowRight,
      badgeBgColor: "bg-category-violet",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-category-violet",
      label: t("assignment_started"),
    },
    assignment_ended: {
      icon: ArrowLeft,
      badgeBgColor: "bg-category-pink",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-category-pink",
      label: t("assignment_ended"),
    },
    rental_started: {
      icon: Briefcase,
      badgeBgColor: "bg-category-indigo",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-category-indigo",
      label: t("rental_started"),
    },
    rental_ended: {
      icon: Briefcase,
      badgeBgColor: "bg-category-teal",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-category-teal",
      label: t("rental_ended"),
    },
    opened: {
      icon: ClipboardCheck,
      badgeBgColor: "bg-success",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-success",
      label: t("opened"),
    },
    closed: {
      icon: ClipboardCheck,
      badgeBgColor: "bg-destructive",
      badgeTextColor: "text-primary-foreground",
      nodeColor: "bg-destructive",
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
      <div className="absolute left-[120px] top-0 bottom-0 w-0.5 bg-border-strong" />

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
                <div className="text-sm font-medium text-foreground-secondary">
                  {timeStr}
                </div>
                {index === 0 ||
                format(new Date(sortedLogs[index - 1].created_time), "dd MMM yyyy", {
                  locale: uz,
                }) !== dateStr ? (
                  <div className="text-xs text-muted-foreground">{dateStr}</div>
                ) : null}
              </div>

              {/* Timeline Node */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-background shadow-md",
                    config.nodeColor
                  )}
                />
              </div>

              {/* Event Card - Everything in one line with uniform background */}
              <div className="flex-1 rounded-lg border border-border bg-background p-2 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md flex-shrink-0 bg-muted">
                    <Icon className="w-4 h-4 text-foreground-secondary" />
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
                    <p className="text-sm text-foreground-secondary truncate flex-1 min-w-0">
                      {log.message}
                    </p>
                  )}
                  {log.author && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
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
