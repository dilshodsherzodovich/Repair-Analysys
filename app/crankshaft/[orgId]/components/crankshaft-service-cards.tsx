"use client";

import { useMemo, type ElementType } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Cog, TrainFront } from "lucide-react";
import { Skeleton } from "@/ui/skeleton";
import { StatCard, StatGrid } from "@/ui/stat-card";
import { formatNumber } from "@/lib/format";
import { ServiceKind, serviceKind } from "../crankshaft-groups";
import type { CrankshaftCardLocomotive } from "./crankshaft-group-cards";

/**
 * The crankshaft count (one per section) and its magistral / manyovr split.
 * The magistral and manyovr cards filter the page; clicking the selected one
 * clears it.
 */
export function CrankshaftServiceCards({
  locomotives,
  activeService,
  onSelect,
  isLoading,
}: {
  /** Locomotives listed by the filters, before the service filter. */
  locomotives: CrankshaftCardLocomotive[];
  activeService: ServiceKind | null;
  onSelect: (service: ServiceKind | null) => void;
  isLoading?: boolean;
}) {
  const t = useTranslations("CrankshaftPage");

  const stats = useMemo(() => {
    const empty = () => ({ crankshafts: 0, locomotives: 0 });
    const result = { mainline: empty(), switcher: empty() };
    locomotives.forEach((locomotive) => {
      const bucket = result[serviceKind(locomotive.serviceType)];
      bucket.crankshafts += locomotive.components.length;
      bucket.locomotives += 1;
    });
    return {
      ...result,
      total: {
        crankshafts: result.mainline.crankshafts + result.switcher.crankshafts,
        locomotives: result.mainline.locomotives + result.switcher.locomotives,
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
    stats.total.crankshafts
      ? Math.round((count / stats.total.crankshafts) * 100)
      : 0;

  const serviceCard = (
    kind: ServiceKind,
    icon: ElementType,
    tone: "primary" | "warning",
  ) => {
    const stat = stats[kind];
    const isActive = activeService === kind;
    return (
      <StatCard
        label={t(kind)}
        icon={icon}
        tone={tone}
        value={formatNumber(stat.crankshafts)}
        caption={`${share(stat.crankshafts)}% · ${t("locomotives_count", {
          count: stat.locomotives,
        })}`}
        selected={isActive}
        muted={stat.crankshafts === 0}
        onClick={() => onSelect(isActive ? null : kind)}
      />
    );
  };

  return (
    <StatGrid columns={3}>
      <StatCard
        label={t("total_crankshafts")}
        icon={Cog}
        value={formatNumber(stats.total.crankshafts)}
        caption={t("locomotives_count", { count: stats.total.locomotives })}
      />
      {serviceCard("mainline", TrainFront, "primary")}
      {serviceCard("switcher", ArrowLeftRight, "warning")}
    </StatGrid>
  );
}
