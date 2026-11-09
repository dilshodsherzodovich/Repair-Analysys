"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bandage } from "@/api/types/bandage";
import {
  BANDAGE_GROUPS,
  OUT_OF_RANGE,
  bandageGroupKey,
} from "../bandage-groups";

interface GroupStat {
  key: string;
  label: string;
  range: string | null;
  bandageCount: number;
  locomotiveCount: number;
}

/**
 * One card per bandage group with how many KPs (and locomotives) fall in it.
 * Clicking a card selects that group; clicking the selected card clears it.
 */
export function BandageGroupCards({
  bandages,
  activeGroup,
  onSelect,
  isLoading,
}: {
  /** Bandages of the locomotives currently listed (filters already applied). */
  bandages: Bandage[];
  activeGroup: string | null;
  onSelect: (key: string | null) => void;
  isLoading?: boolean;
}) {
  const t = useTranslations("BandagesPage");

  const stats = useMemo(() => {
    const kps = new Map<string, number>();
    const locomotives = new Map<string, Set<number>>();
    bandages.forEach((bandage) => {
      const key = bandageGroupKey(bandage);
      if (!key) return;
      kps.set(key, (kps.get(key) ?? 0) + 1);
      if (!locomotives.has(key)) locomotives.set(key, new Set());
      locomotives.get(key)!.add(bandage.locomotive);
    });

    const stat = (key: string, label: string, range: string | null) => ({
      key,
      label,
      range,
      bandageCount: kps.get(key) ?? 0,
      locomotiveCount: locomotives.get(key)?.size ?? 0,
    });

    const result: GroupStat[] = BANDAGE_GROUPS.map((group) =>
      stat(group.key, group.key, `${group.min}–${group.max}`),
    );
    // Shown only when something is outside every range, or it is selected
    if (kps.has(OUT_OF_RANGE) || activeGroup === OUT_OF_RANGE) {
      result.push(stat(OUT_OF_RANGE, t("group_out_of_range"), null));
    }
    return result;
  }, [bandages, activeGroup, t]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {BANDAGE_GROUPS.map((group) => (
          <Skeleton key={group.key} className="h-[92px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-4 gap-3",
        stats.length > BANDAGE_GROUPS.length ? "xl:grid-cols-8" : "xl:grid-cols-7",
      )}
    >
      {stats.map((stat) => {
        const isActive = activeGroup === stat.key;
        const isEmpty = stat.bandageCount === 0;
        return (
          <button
            key={stat.key}
            type="button"
            onClick={() => onSelect(isActive ? null : stat.key)}
            aria-pressed={isActive}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-all cursor-pointer",
              isActive
                ? "border-blue-600 bg-blue-600 text-white shadow-md"
                : "border-[#CAD5E2] bg-white hover:border-blue-300 hover:bg-[#F8FAFC]",
              isEmpty && !isActive && "opacity-60",
            )}
          >
            <span className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isActive ? "text-white" : "text-[#0F172B]",
                )}
              >
                {stat.label}
              </span>
              {stat.range && (
                <span
                  className={cn(
                    "text-xs",
                    isActive ? "text-blue-100" : "text-[#64748B]",
                  )}
                >
                  ({stat.range})
                </span>
              )}
            </span>
            <span
              className={cn(
                "text-2xl font-bold leading-tight",
                isActive ? "text-white" : "text-[#0F172B]",
              )}
            >
              {t("group_kp_count", { count: stat.bandageCount })}
            </span>
            <span
              className={cn(
                "text-xs",
                isActive ? "text-blue-100" : "text-[#64748B]",
              )}
            >
              {t("group_locomotives_count", { count: stat.locomotiveCount })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
