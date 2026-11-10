"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { cn } from "@/lib/utils";
import { ComponentGroupComponent, ComponentGroupRegistry } from "@/api/types/component-registry";
import { DisclosureTrigger } from "@/ui/disclosure-trigger";

import { EmptyState } from "@/ui/empty-state";
import { Badge } from "@/ui/badge";
const CELL = "py-2.5 px-3 text-muted-foreground border-r border-border last:border-r-0";
const HEAD =
  "py-2.5 px-3 text-foreground-secondary font-medium border-r border-border last:border-r-0 whitespace-nowrap";

/** dd.MM.yyyy, the format used across the duty-uzel screens. */
export function formatDefectDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${date.getFullYear()}`;
  } catch {
    return dateString;
  }
}

export function CountBadge({ count }: { count: number }) {
  return (
    <Badge variant="primary" className="shrink-0">
      {count}
    </Badge>
  );
}

/** Defect rows of a single component, shown when its row is expanded. */
function RegistryTable({
  registries,
}: {
  registries: ComponentGroupRegistry[];
}) {
  const t = useTranslations("DutyUzelPage");

  if (registries.length === 0) {
    return (
      <EmptyState title={t("empty_description")} size="compact" />
    );
  }

  return (
    <div className="overflow-x-auto border-t border-border">
      <Table className="min-w-[1100px]">
        <TableHeader>
          <TableRow>
            <TableHead className={cn(HEAD, "w-12")}>{t("columns.no")}</TableHead>
            <TableHead className={HEAD}>{t("columns.defect_date")}</TableHead>
            <TableHead className={HEAD}>{t("columns.locomotive")}</TableHead>
            <TableHead className={HEAD}>{t("columns.section")}</TableHead>
            <TableHead className={cn(HEAD, "min-w-[220px]")}>
              {t("columns.reason")}
            </TableHead>
            <TableHead className={HEAD}>
              {t("columns.removed_manufacture_year")}
            </TableHead>
            <TableHead className={HEAD}>
              {t("columns.removed_manufacture_factory")}
            </TableHead>
            <TableHead className={HEAD}>
              {t("columns.installed_manufacture_year")}
            </TableHead>
            <TableHead className={HEAD}>
              {t("columns.installed_manufacture_factory")}
            </TableHead>
            <TableHead className={HEAD}>{t("columns.staff")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registries.map((registry, index) => (
            <TableRow
              key={registry.id}
            >
              <TableCell className={cn(CELL, "font-medium")}>
                {index + 1}
              </TableCell>
              <TableCell className={cn(CELL, "whitespace-nowrap")}>
                {formatDefectDate(registry.defect_date)}
              </TableCell>
              <TableCell className={cn(CELL, "")}>
                {registry.locomotive}
                {registry.locomotive_model ? `-${registry.locomotive_model}` : ""}
              </TableCell>
              <TableCell className={CELL}>{registry.section || "—"}</TableCell>
              <TableCell className={CELL}>
                <div className="max-w-[320px] whitespace-normal break-words">
                  {registry.reason || "—"}
                </div>
              </TableCell>
              <TableCell className={CELL}>
                {registry.removed_manufacture_year || "—"}
              </TableCell>
              <TableCell className={CELL}>
                {registry.removed_manufacture_factory || "—"}
              </TableCell>
              <TableCell className={CELL}>
                {registry.installed_manufacture_year || "—"}
              </TableCell>
              <TableCell className={CELL}>
                {registry.installed_manufacture_factory || "—"}
              </TableCell>
              <TableCell className={CELL}>{registry.staff || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Components of one group, each collapsing to reveal its defect rows. Shared by
 * the inline group panel and the standalone group page.
 */
export function ComponentGroupComponents({
  components,
  defaultOpen = false,
  className,
}: {
  components: ComponentGroupComponent[];
  /** Start with every component expanded (the standalone group window does). */
  defaultOpen?: boolean;
  className?: string;
}) {
  const t = useTranslations("DutyUzelPage");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  // Seed once per set of components, so a refetch of the same group does not
  // reopen what the user has collapsed.
  const componentIds = components.map((component) => component.id).join(",");
  useEffect(() => {
    if (!defaultOpen || !componentIds) return;
    setOpenIds(new Set(componentIds.split(",").map(Number)));
  }, [defaultOpen, componentIds]);

  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (components.length === 0) {
    return (
      <EmptyState title={t("empty_description")} />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {components.map((component) => {
        const isOpen = openIds.has(component.id);
        return (
          <div
            key={component.id}
            className="rounded-md border border-border bg-background overflow-hidden"
          >
            <DisclosureTrigger
              open={isOpen}
              onClick={() => toggle(component.id)}
              className="gap-2.5 px-3 py-2.5"
            >
              <span className="flex-1 min-w-0 truncate text-sm font-medium text-foreground">
                {component.name}
              </span>
              <CountBadge count={component.count} />
            </DisclosureTrigger>
            {isOpen && <RegistryTable registries={component.registries} />}
          </div>
        );
      })}
    </div>
  );
}
