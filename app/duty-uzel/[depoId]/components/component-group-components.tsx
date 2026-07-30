"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { cn } from "@/lib/utils";
import {
  ComponentGroupComponent,
  ComponentGroupRegistry,
} from "@/api/types/component-registry";

const CELL = "py-2.5 px-3 text-[#64748B] border-r border-[#E2E8F0] last:border-r-0";
const HEAD =
  "py-2.5 px-3 text-[#475569] font-medium border-r border-[#E2E8F0] last:border-r-0 whitespace-nowrap";

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
    <span className="inline-flex items-center justify-center rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-semibold text-[#1d4ed8] shrink-0">
      {count}
    </span>
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
      <div className="px-4 py-4 text-center text-sm text-[#64748B]">
        {t("empty_description")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-t border-[#E2E8F0]">
      <Table className="w-full min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
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
              className="hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0 transition-colors"
            >
              <TableCell className={cn(CELL, "text-[#0F172B] font-medium")}>
                {index + 1}
              </TableCell>
              <TableCell className={cn(CELL, "whitespace-nowrap")}>
                {formatDefectDate(registry.defect_date)}
              </TableCell>
              <TableCell className={cn(CELL, "text-[#0F172B]")}>
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
      <div className={cn("px-4 py-4 text-center text-sm text-[#64748B]", className)}>
        {t("empty_description")}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {components.map((component) => {
        const isOpen = openIds.has(component.id);
        return (
          <div
            key={component.id}
            className="rounded-md border border-[#E2E8F0] bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(component.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-[#64748B] transition-transform",
                  !isOpen && "-rotate-90",
                )}
              />
              <span className="flex-1 min-w-0 truncate text-sm font-medium text-[#0F172B]">
                {component.name}
              </span>
              <CountBadge count={component.count} />
            </button>
            {isOpen && <RegistryTable registries={component.registries} />}
          </div>
        );
      })}
    </div>
  );
}
