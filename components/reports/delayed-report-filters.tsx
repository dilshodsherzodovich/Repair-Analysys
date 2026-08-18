"use client";

import { Button } from "@/ui/button";
import { useTranslations } from "next-intl";

/**
 * Filter row for the delayed-entry report.
 *
 * The report answers "which locomotives are overdue to enter an inspection
 * right now?" — a current-state snapshot, not a period aggregate. There is no
 * date window to pick, so the row carries only the organization scope and a
 * manual refresh.
 */
export default function DelayedReportFilters({
  onRefresh,
  leading,
}: {
  onRefresh: () => void;
  /** Rendered first, so it aligns with the refresh button. */
  leading?: React.ReactNode;
}) {
  const t = useTranslations();

  return (
    <div className="w-full flex flex-wrap gap-3 items-end">
      {leading}
      <Button onClick={onRefresh}>{t("refresh")}</Button>
    </div>
  );
}
