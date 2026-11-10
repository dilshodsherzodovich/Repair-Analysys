"use client";

import * as React from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { TableCell, TableRow } from "@/ui/table";
import { Skeleton } from "@/ui/skeleton";

/**
 * The three data states every page and section shows the same way (see
 * "Data states" in the design-system spec):
 *  - LoadingState: a skeleton shaped like the content
 *  - EmptyState: icon, "no data" title, optional description and action
 *  - ErrorState: warning icon, message, Retry
 * `size`: "page" fills the content area, "section" (default) sits in a card
 * or panel, "compact" fits a dropdown, small panel or table row.
 */
type StateSize = "page" | "section" | "compact";

const FRAME: Record<StateSize, string> = {
  page: "min-h-[50vh] py-16",
  section: "py-12",
  compact: "py-6",
};

function StateFrame({
  size,
  className,
  children,
}: {
  size: StateSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 px-4 text-center",
        FRAME[size],
        className
      )}
    >
      {children}
    </div>
  );
}

function StateIcon({
  size,
  tone,
  children,
}: {
  size: StateSize;
  tone: "neutral" | "danger";
  children: React.ReactNode;
}) {
  if (size === "compact") {
    return (
      <span className={tone === "danger" ? "text-destructive" : "text-foreground-subtle"}>
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-12 items-center justify-center rounded-full",
        tone === "danger" ? "bg-destructive-subtle text-destructive" : "bg-muted text-foreground-subtle"
      )}
    >
      {children}
    </span>
  );
}

type LoadingShape = "table" | "cards" | "block" | "lines";

const ROWS: Record<StateSize, number> = { page: 8, section: 5, compact: 3 };

/**
 * Content that is loading shows a skeleton shaped like it, never a spinner:
 *  - "table" (default): a header strip and rows
 *  - "cards": summary tiles and a chart block (statistics, dashboards)
 *  - "block": one large block (a chart, a grid)
 *  - "lines": a few text lines (detail panels, small cards)
 * Spinners are only for in-place progress (a button or cell saving, a
 * background refresh) and for the app start screen (LoadingScreen).
 */
export function LoadingState({
  label,
  size = "section",
  shape = "table",
  className,
}: {
  /** Read by screen readers; defaults to "Yuklanmoqda…". */
  label?: React.ReactNode;
  size?: StateSize;
  shape?: LoadingShape;
  className?: string;
}) {
  const t = useTranslations("Common");
  const rows = ROWS[size];
  return (
    <div role="status" aria-busy="true" className={cn("w-full", className)}>
      <span className="sr-only">{label ?? t("loading")}</span>
      {shape === "table" && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full opacity-70" />
          ))}
        </div>
      )}
      {shape === "cards" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className={cn("w-full rounded-xl", size === "compact" ? "h-40" : "h-72")} />
        </div>
      )}
      {shape === "block" && (
        <Skeleton
          className={cn(
            "w-full rounded-xl",
            size === "page" ? "h-[50vh]" : size === "section" ? "h-72" : "h-32"
          )}
        />
      )}
      {shape === "lines" && (
        <div className="space-y-2.5 py-1">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className={cn("h-4", i % 3 === 2 ? "w-2/3" : "w-full")} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The app start screen, shown before the layout exists (session check,
 * sign-in redirects). Inside the layout use LoadingState.
 */
export function LoadingScreen({
  label,
  className,
}: {
  label?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("Common");
  return (
    <StateFrame size="page" className={cn("min-h-screen", className)}>
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label ?? t("loading")}</p>
    </StateFrame>
  );
}

export interface EmptyStateProps {
  /** Defaults to an inbox. Pass a lucide icon element to fit the page. */
  icon?: React.ReactNode;
  /** Defaults to "Ma'lumot topilmadi". */
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** E.g. an AddButton or a "Clear filters" button. */
  action?: React.ReactNode;
  size?: StateSize;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "section",
  className,
}: EmptyStateProps) {
  const t = useTranslations("Common");
  return (
    <StateFrame size={size} className={className}>
      <StateIcon size={size} tone="neutral">
        {icon ?? <Inbox className={size === "compact" ? "size-5" : "size-6"} />}
      </StateIcon>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title ?? t("no_data")}</p>
        {description && (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </StateFrame>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
  action,
  size = "section",
  className,
}: {
  /** Defaults to "Ma'lumotlarni yuklab bo'lmadi". */
  title?: React.ReactNode;
  /** The error text from the server, if any. */
  message?: React.ReactNode;
  onRetry?: () => void;
  /** Extra action next to Retry, e.g. a Back link. */
  action?: React.ReactNode;
  size?: StateSize;
  className?: string;
}) {
  const t = useTranslations("Common");
  return (
    <StateFrame size={size} className={className}>
      <StateIcon size={size} tone="danger">
        <AlertTriangle className={size === "compact" ? "size-5" : "size-6"} />
      </StateIcon>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title ?? t("load_error")}</p>
        {message && <p className="mx-auto max-w-md text-sm text-muted-foreground">{message}</p>}
      </div>
      {(onRetry || action) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="size-4" />
              {t("retry")}
            </Button>
          )}
          {action}
        </div>
      )}
    </StateFrame>
  );
}

/** A table body row spanning all columns that shows one of the states. */
export function TableStateRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-0">
        {children}
      </TableCell>
    </TableRow>
  );
}

