"use client";

import { useMemo, type ElementType } from "react";
import { useTranslations } from "next-intl";
import { CircleDot, Disc, Disc3 } from "lucide-react";
import { Skeleton } from "@/ui/skeleton";
import { StatCard, StatGrid } from "@/ui/stat-card";
import { formatNumber } from "@/lib/format";
import { WheelKind, wheelKind } from "../bandage-groups";
import type { BandageCardLocomotive } from "./bandage-group-cards";

/**
 * The KP count and its bandajli / quyma split (by locomotive model). The
 * bandajli and quyma cards filter the page; clicking the selected one clears
 * it.
 */
export function BandageWheelCards({
  locomotives,
  activeWheel,
  onSelect,
  isLoading,
}: {
  /** Locomotives listed by the filters, before the wheel filter. */
  locomotives: BandageCardLocomotive[];
  activeWheel: WheelKind | null;
  onSelect: (wheel: WheelKind | null) => void;
  isLoading?: boolean;
}) {
  const t = useTranslations("BandagesPage");

  const stats = useMemo(() => {
    const empty = () => ({ kps: 0, locomotives: 0 });
    const result = { bandaged: empty(), cast: empty() };
    locomotives.forEach((locomotive) => {
      const bucket = result[wheelKind(locomotive.modelId)];
      bucket.kps += locomotive.bandages.length;
      bucket.locomotives += 1;
    });
    return {
      ...result,
      total: {
        kps: result.bandaged.kps + result.cast.kps,
        locomotives: result.bandaged.locomotives + result.cast.locomotives,
      },
    };
  }, [locomotives]);

  if (isLoading) {
    return (
      <StatGrid columns={3}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
        ))}
      </StatGrid>
    );
  }

  const share = (count: number) =>
    stats.total.kps ? Math.round((count / stats.total.kps) * 100) : 0;

  const wheelCard = (
    kind: WheelKind,
    icon: ElementType,
    tone: "primary" | "warning",
  ) => {
    const stat = stats[kind];
    const isActive = activeWheel === kind;
    return (
      <StatCard
        label={t(kind)}
        icon={icon}
        tone={tone}
        value={formatNumber(stat.kps)}
        caption={`${share(stat.kps)}% · ${t("group_locomotives_count", {
          count: stat.locomotives,
        })}`}
        selected={isActive}
        muted={stat.kps === 0}
        onClick={() => onSelect(isActive ? null : kind)}
      />
    );
  };

  return (
    <StatGrid columns={3}>
      <StatCard
        label={t("total_kp")}
        icon={Disc3}
        value={formatNumber(stats.total.kps)}
        caption={t("group_locomotives_count", {
          count: stats.total.locomotives,
        })}
      />
      {wheelCard("bandaged", CircleDot, "primary")}
      {wheelCard("cast", Disc, "warning")}
    </StatGrid>
  );
}
