"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

/**
 * Shared chrome for the three numbered detail sections: number badge, title,
 * count, and the loading / empty states.
 *
 * Each section owns its own loading state rather than sharing one for the page,
 * so a slow or failing endpoint never blanks the whole report.
 */
export function SectionShell({
  index,
  title,
  count,
  badge,
  isLoading,
  isEmpty,
  children,
}: {
  index: number;
  title: string;
  /** `null` while the count is still unknown. */
  count: number | null;
  badge?: React.ReactNode;
  isLoading: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("UnifiedInspectionReport");

  return (
    <section className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
      <header className="flex items-center gap-2 px-5 py-3 border-b border-muted">
        <span className="w-6 h-6 rounded-lg bg-foreground text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
          {index}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count != null && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-foreground-secondary tabular-nums">
            {count}
          </span>
        )}
        {badge}
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : isEmpty ? (
        <p className="text-center py-12 text-sm text-foreground-subtle">{t("noData")}</p>
      ) : (
        children
      )}
    </section>
  );
}
