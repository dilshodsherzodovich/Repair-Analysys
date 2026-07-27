"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Boxes, Calendar, Hash } from "lucide-react";
import {
  SectionCard,
  EmptyBlock,
  LoadingBlock,
  fmtDate,
} from "./passport-shared";
import { useComponentRegistry } from "@/api/hooks/use-component-registry";

/** Registry of installed/removed components for this locomotive. */
export function PassportRegistry({ locomotiveId }: { locomotiveId: number }) {
  const t = useTranslations("locomotivePassport.registry");
  const { data, isLoading } = useComponentRegistry({
    locomotive_id: locomotiveId,
  });
  const rows = (data?.results ?? []).slice(0, 15);

  const thBase =
    "border-b border-r border-border px-3 py-2.5 text-left font-semibold text-[#0F172B] last:border-r-0";
  const tdBase =
    "border-b border-r border-border px-3 py-2.5 align-top text-[#334155] last:border-r-0";

  const YearFactory = ({
    year,
    factory,
  }: {
    year?: string;
    factory?: string;
  }) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex items-center gap-1" title={t("manufactureYear")}>
        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">{year || "—"}</span>
      </span>
      <span className="flex items-center gap-1" title={t("factoryNumber")}>
        <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">{factory || "—"}</span>
      </span>
    </div>
  );

  return (
    <SectionCard
      title={t("title")}
      description={t("description")}
      icon={Boxes}
      loading={isLoading}
    >
      {isLoading && !data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyBlock icon={Boxes} message={t("empty")} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[820px] table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "11%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>
            <thead>
              <tr className="bg-muted/60">
                <th className={thBase}>{t("columns.date")}</th>
                <th className={thBase}>{t("columns.component")}</th>
                <th className={thBase}>{t("columns.section")}</th>
                <th className={thBase}>{t("columns.reason")}</th>
                <th className={thBase}>{t("columns.installed")}</th>
                <th className={thBase}>{t("columns.removed")}</th>
                <th className={thBase}>{t("columns.staff")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="even:bg-muted/20">
                  <td className={cn(tdBase, "whitespace-nowrap")}>
                    {fmtDate(r.defect_date)}
                  </td>
                  <td className={cn(tdBase, "font-medium break-words")}>
                    {r.component || "—"}
                  </td>
                  <td className={cn(tdBase, "break-words")}>
                    {r.section || "—"}
                  </td>
                  <td className={cn(tdBase, "whitespace-normal break-words")}>
                    {r.reason || "—"}
                  </td>
                  <td className={cn(tdBase, "break-words")}>
                    <YearFactory
                      year={r.installed_manufacture_year}
                      factory={r.installed_manufacture_factory}
                    />
                  </td>
                  <td className={cn(tdBase, "break-words")}>
                    <YearFactory
                      year={r.removed_manufacture_year}
                      factory={r.removed_manufacture_factory}
                    />
                  </td>
                  <td className={cn(tdBase, "break-words")}>
                    {r.staff || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
