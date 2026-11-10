"use client";

import { useTranslations } from "next-intl";
import { BarChart3, List } from "lucide-react";
import { SegmentedTabs } from "@/ui/segmented-tabs";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

export type ListStatsView = "list" | "stats";

/**
 * Pages that have both a list and statistics show one at a time. The choice
 * lives in the URL (`?view=stats`) so a refresh or a shared link keeps it;
 * the list is the default.
 */
export function useListStatsView(): [ListStatsView, (view: ListStatsView) => void] {
  const { getQueryValue, updateQuery } = useFilterParams();
  const view: ListStatsView = getQueryValue("view") === "stats" ? "stats" : "list";
  const setView = (next: ListStatsView) =>
    updateQuery({ view: next === "list" ? null : next });
  return [view, setView];
}

/** The List / Statistics switch, first among the filter card's actions. */
export function ListStatsSwitch({
  value,
  onValueChange,
}: {
  value: ListStatsView;
  onValueChange: (view: ListStatsView) => void;
}) {
  const t = useTranslations("Common");
  return (
    <SegmentedTabs
      value={value}
      onValueChange={(v) => onValueChange(v as ListStatsView)}
      options={[
        { value: "list", label: t("view_list"), icon: <List /> },
        { value: "stats", label: t("view_statistics"), icon: <BarChart3 /> },
      ]}
    />
  );
}
