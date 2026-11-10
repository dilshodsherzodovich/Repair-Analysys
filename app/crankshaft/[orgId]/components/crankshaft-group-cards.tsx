"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/ui/skeleton";
import { StatCard } from "@/ui/stat-card";
import { formatNumber } from "@/lib/format";
import { SpecialComponent } from "@/api/types/locomotive";
import {
  CRANKSHAFT_GROUPS,
  crankshaftGroupKey,
  isKorenField,
} from "../crankshaft-groups";

/**
 * One card per value group with how many values fall in it, split into
 * koren and shatun. Clicking a card selects that group; clicking the
 * selected card clears it.
 */
export function CrankshaftGroupCards({
  components,
  valueFields,
  activeGroup,
  onSelect,
  isLoading,
}: {
  /** Components of the locomotives currently listed (filters already applied). */
  components: SpecialComponent[];
  valueFields: string[];
  activeGroup: string | null;
  onSelect: (key: string | null) => void;
  isLoading?: boolean;
}) {
  const tModal = useTranslations("SpecialComponentsModal");

  const stats = useMemo(() => {
    const koren = new Map<string, number>();
    const shatun = new Map<string, number>();
    components.forEach((component) => {
      valueFields.forEach((field) => {
        const key = crankshaftGroupKey(component[field as keyof SpecialComponent]);
        if (!key) return;
        const counts = isKorenField(field) ? koren : shatun;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    });
    return CRANKSHAFT_GROUPS.map((group) => ({
      ...group,
      koren: koren.get(group.key) ?? 0,
      shatun: shatun.get(group.key) ?? 0,
    }));
  }, [components, valueFields]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {CRANKSHAFT_GROUPS.map((group) => (
          <Skeleton key={group.key} className="h-[92px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {stats.map((stat) => {
        const total = stat.koren + stat.shatun;
        const isActive = activeGroup === stat.key;
        return (
          <StatCard
            key={stat.key}
            label={stat.key}
            hint={`(${stat.range})`}
            value={formatNumber(total)}
            caption={
              <span className="flex flex-col">
                <span>
                  {tModal("koren_prefix")}: {formatNumber(stat.koren)}
                </span>
                <span>
                  {tModal("shatun_prefix")}: {formatNumber(stat.shatun)}
                </span>
              </span>
            }
            selected={isActive}
            muted={total === 0}
            onClick={() => onSelect(isActive ? null : stat.key)}
          />
        );
      })}
    </div>
  );
}
