"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/ui/skeleton";
import { StatCard } from "@/ui/stat-card";
import { Badge } from "@/ui/badge";
import { formatNumber } from "@/lib/format";
import { SpecialComponent } from "@/api/types/locomotive";
import {
  CRANKSHAFT_GROUPS,
  crankshaftGroupKey,
  isKorenField,
  serviceKind,
} from "../crankshaft-groups";

export interface CrankshaftCardLocomotive {
  serviceType?: string | null;
  components: SpecialComponent[];
}

/**
 * One card per value group with how many values fall in it, split into
 * koren and shatun, and along the bottom into magistral and manyovr (same
 * colours as the service cards above). Clicking a card selects that group;
 * clicking the selected card clears it.
 */
export function CrankshaftGroupCards({
  locomotives,
  valueFields,
  activeGroup,
  onSelect,
  isLoading,
}: {
  /** Locomotives currently listed (filters already applied). */
  locomotives: CrankshaftCardLocomotive[];
  valueFields: string[];
  activeGroup: string | null;
  onSelect: (key: string | null) => void;
  isLoading?: boolean;
}) {
  const t = useTranslations("CrankshaftPage");
  const tModal = useTranslations("SpecialComponentsModal");

  const stats = useMemo(() => {
    const koren = new Map<string, number>();
    const shatun = new Map<string, number>();
    const service = { mainline: new Map<string, number>(), switcher: new Map<string, number>() };
    const add = (counts: Map<string, number>, key: string) =>
      counts.set(key, (counts.get(key) ?? 0) + 1);

    locomotives.forEach((locomotive) => {
      const byService = service[serviceKind(locomotive.serviceType)];
      locomotive.components.forEach((component) => {
        valueFields.forEach((field) => {
          const key = crankshaftGroupKey(
            component[field as keyof SpecialComponent],
          );
          if (!key) return;
          add(isKorenField(field) ? koren : shatun, key);
          add(byService, key);
        });
      });
    });

    return CRANKSHAFT_GROUPS.map((group) => ({
      ...group,
      koren: koren.get(group.key) ?? 0,
      shatun: shatun.get(group.key) ?? 0,
      mainline: service.mainline.get(group.key) ?? 0,
      switcher: service.switcher.get(group.key) ?? 0,
    }));
  }, [locomotives, valueFields]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {CRANKSHAFT_GROUPS.map((group) => (
          <Skeleton key={group.key} className="h-[128px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {stats.map((stat) => {
        const count = stat.koren + stat.shatun;
        const isActive = activeGroup === stat.key;
        return (
          <StatCard
            key={stat.key}
            label={stat.key}
            hint={`(${stat.range})`}
            value={formatNumber(count)}
            caption={
              <span className="flex flex-col gap-2">
                <span className="flex flex-col">
                  <span>
                    {tModal("koren_prefix")}: {formatNumber(stat.koren)}
                  </span>
                  <span>
                    {tModal("shatun_prefix")}: {formatNumber(stat.shatun)}
                  </span>
                </span>
                <span className="flex flex-col gap-1 border-t border-border pt-2">
                  <Badge variant="primary" size="sm" className="justify-between">
                    {t("mainline")}
                    <span className="tabular-nums">{formatNumber(stat.mainline)}</span>
                  </Badge>
                  <Badge variant="warning" size="sm" className="justify-between">
                    {t("switcher")}
                    <span className="tabular-nums">{formatNumber(stat.switcher)}</span>
                  </Badge>
                </span>
              </span>
            }
            selected={isActive}
            muted={count === 0}
            onClick={() => onSelect(isActive ? null : stat.key)}
          />
        );
      })}
    </div>
  );
}
