"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Phone, UserRound, IdCard } from "lucide-react";
import { SectionCard, EmptyBlock, LoadingBlock } from "./passport-shared";
import { useDriverInfo } from "@/api/hooks/use-emm";
import type { DriverData } from "@/api/services/emm.service";

const initials = (name?: string) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

function DriverRow({ driver }: { driver: DriverData }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Avatar className="h-11 w-11">
        {driver.image_url && <AvatarImage src={driver.image_url} alt={driver.mashinist_fio} />}
        <AvatarFallback className="bg-[#2354BF]/10 text-[#2354BF] font-semibold">
          {initials(driver.mashinist_fio)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[#0F172B]">
          {driver.mashinist_fio || "—"}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {driver.phone && (
            <a
              href={`tel:${driver.phone}`}
              className="flex items-center gap-1 hover:text-[#2354BF]"
            >
              <Phone className="h-3 w-3" />
              {driver.phone}
            </a>
          )}
          {driver.yafka && (
            <span className="flex items-center gap-1">
              <IdCard className="h-3 w-3" />
              {driver.yafka}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PassportDrivers({
  locomotiveNumber,
  modelId,
}: {
  locomotiveNumber?: string;
  modelId?: number;
}) {
  const t = useTranslations("locomotivePassport.drivers");
  const enabled = !!locomotiveNumber && !!modelId;
  const { data, isLoading, isError } = useDriverInfo(
    locomotiveNumber,
    modelId,
    enabled
  );

  const drivers = data?.data ?? [];

  return (
    <SectionCard
      title={t("title")}
      description={t("description")}
      icon={UserRound}
      loading={isLoading}
    >
      {!enabled ? (
        <EmptyBlock icon={UserRound} message={t("unavailable")} />
      ) : isLoading && !data ? (
        <LoadingBlock />
      ) : isError ? (
        <EmptyBlock icon={UserRound} message={t("loadError")} />
      ) : drivers.length === 0 ? (
        <EmptyBlock icon={UserRound} message={t("notFound")} />
      ) : (
        <div className="space-y-2">
          {drivers.map((driver, i) => (
            <DriverRow key={`${driver.emm_id ?? i}`} driver={driver} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
