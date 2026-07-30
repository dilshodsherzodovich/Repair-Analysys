"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ChevronDown, ExternalLink } from "lucide-react";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
import { cn } from "@/lib/utils";
import { useComponentRegistryByGroup } from "@/api/hooks/use-component-registry";
import {
  ComponentGroupOverview,
  ComponentGroupOverviewGroup,
} from "@/api/types/component-registry";
import {
  ComponentGroupComponents,
  CountBadge,
} from "./component-group-components";

interface ComponentGroupAccordionProps {
  data?: ComponentGroupOverview;
  isLoading?: boolean;
  /** Depo in the URL — needed to build the standalone group link. */
  depoId: string;
  /** Date range passed on to the per-group details request and link. */
  startDate?: string;
  endDate?: string;
}

/**
 * Body of an expanded group: the details request fires only once the group is
 * opened, and each component inside collapses on its own.
 */
function GroupPanel({
  group,
  startDate,
  endDate,
}: {
  group: ComponentGroupOverviewGroup;
  startDate?: string;
  endDate?: string;
}) {
  const t = useTranslations("DutyUzelPage");

  const { data, isLoading, error } = useComponentRegistryByGroup({
    group_id: group.id,
    start_date: startDate,
    end_date: endDate,
  });

  if (isLoading) {
    return (
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
        {Array.from({ length: Math.min(group.components?.length || 3, 4) }).map(
          (_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md" />
          ),
        )}
      </div>
    );
  }

  if (error) {
    const payload = (error as any)?.response?.data;
    const message = Array.isArray(payload?.group_id)
      ? payload.group_id.join(" ")
      : payload?.detail || (error as Error)?.message || t("error_load");
    return (
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-red-700">
        {message}
      </div>
    );
  }

  return (
    <ComponentGroupComponents
      components={data?.components ?? []}
      className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-3"
    />
  );
}

export function ComponentGroupAccordion({
  data,
  isLoading,
  depoId,
  startDate,
  endDate,
}: ComponentGroupAccordionProps) {
  const t = useTranslations("DutyUzelPage");
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());

  const toggleGroup = (id: number) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const groupHref = (groupId: number) => {
    const params = new URLSearchParams();
    if (startDate) params.set("defect_date_start", startDate);
    if (endDate) params.set("defect_date_end", endDate);
    const query = params.toString();
    return `/duty-uzel/${depoId}/group/${groupId}${query ? `?${query}` : ""}`;
  };

  /**
   * Opens the group in its own browser window, filling the screen. Modifier and
   * middle clicks fall through to the browser so the link still acts as a link.
   */
  const openGroupWindow = (
    event: React.MouseEvent<HTMLAnchorElement>,
    groupId: number,
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();

    const { availWidth, availHeight, availLeft, availTop } =
      window.screen as Screen & { availLeft?: number; availTop?: number };

    const opened = window.open(
      groupHref(groupId),
      `duty-uzel-group-${groupId}`,
      `popup=yes,width=${availWidth},height=${availHeight},left=${
        availLeft ?? 0
      },top=${availTop ?? 0},resizable=yes,scrollbars=yes`,
    );
    opened?.focus();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const groups = data?.groups ?? [];

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-[#CAD5E2] bg-white p-8">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title={t("empty_title")}
          description={t("empty_description")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[#CAD5E2] bg-[#EFF6FF] px-4 py-2.5">
        <span className="text-sm font-semibold text-[#0F172B]">
          {t("groups_title")}
        </span>
        <span className="text-sm font-medium text-[#475569] whitespace-nowrap">
          {t("group_total", { count: data?.count ?? 0 })}
        </span>
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const isOpen = openGroups.has(group.id);
          return (
            <div
              key={group.id}
              className="rounded-lg border border-[#CAD5E2] bg-white overflow-hidden"
            >
              <div className="flex items-stretch">
                {/* Chevron expands in place; the rest of the row opens the
                    group on its own page in a new tab. */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-label={t("groups_title")}
                  className="px-3 flex items-center hover:bg-[#F1F5F9] transition-colors cursor-pointer shrink-0"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[#64748B] transition-transform",
                      !isOpen && "-rotate-90",
                    )}
                  />
                </button>

                <a
                  href={groupHref(group.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => openGroupWindow(event, group.id)}
                  title={t("group_open_in_new_tab")}
                  className="group/link flex flex-1 min-w-0 items-center gap-3 py-3 pr-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[#0F172B]">
                    {group.name}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#94A3B8] opacity-0 transition-opacity group-hover/link:opacity-100" />
                  <span className="hidden sm:inline text-xs text-[#64748B] whitespace-nowrap">
                    {t("group_components_count", {
                      count: group.components?.length ?? 0,
                    })}
                  </span>
                  <CountBadge count={group.count} />
                </a>
              </div>

              {isOpen && (
                <GroupPanel
                  group={group}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
