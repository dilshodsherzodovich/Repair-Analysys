"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardCheck,
  Wrench,
  MapPin,
  Droplets,
  Users,
  Boxes,
  ClipboardList,
  ChevronRight,
  Navigation,
  Power,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { fmtNumber, fmtDate } from "./passport-shared";
import { useLocomotiveLocation, useDriverInfo } from "@/api/hooks/use-emm";
import {
  useLocomotiveOilStatusEntries,
  type OilAnalysisModelName,
} from "@/api/hooks/use-locomotive-oil-status";
import { useComponentRegistry } from "@/api/hooks/use-component-registry";
import { useOrders } from "@/api/hooks/use-orders";
import { usePantographJournal } from "@/api/hooks/use-pantograph";
import { useRevisionJournal } from "@/api/hooks/use-revision-journal";
import type {
  Txk13Locomotive,
  Txk13Inspection,
} from "@/api/types/txk13-report";

export type PassportView =
  "inspections" | "oil" | "location" | "crew" | "components" | "journals";

type Tone = "ok" | "warn" | "crit" | "muted";

const tones: Record<
  Tone,
  { stroke: string; text: string; dot: string; chip: string }
> = {
  ok: {
    stroke: "stroke-emerald-500",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-600",
  },
  warn: {
    stroke: "stroke-amber-500",
    text: "text-amber-600",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-600",
  },
  crit: {
    stroke: "stroke-red-500",
    text: "text-red-600",
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-600",
  },
  muted: {
    stroke: "stroke-slate-300",
    text: "text-muted-foreground",
    dot: "bg-slate-300",
    chip: "bg-slate-100 text-muted-foreground",
  },
};

/* -------------------------------------------------------------------------- */
/*  Tile shell + small primitives                                             */
/* -------------------------------------------------------------------------- */

function Tile({
  view,
  title,
  sub,
  icon: Icon,
  onOpen,
  className,
  children,
}: {
  view: PassportView;
  title: string;
  sub?: string;
  icon: LucideIcon;
  onOpen: (view: PassportView) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(view)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(view);
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-2xl border bg-card p-4 transition-all",
        "hover:-translate-y-0.5 hover:border-[#2354BF]/45 hover:shadow-[0_18px_40px_-26px_rgba(35,84,191,0.55)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2354BF]",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#2354BF]/10 text-[#2354BF]">
          <Icon className="h-[17px] w-[17px]" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight text-[#0F172B]">
            {title}
          </div>
          {sub && (
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {sub}
            </div>
          )}
        </div>
        <ChevronRight className="ml-auto h-[18px] w-[18px] shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#2354BF]" />
      </div>
      {children}
    </article>
  );
}

function Kv({ k, v, tone }: { k: ReactNode; v: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-dashed border-border/70 py-1.5 text-[12.5px] first:border-t-0">
      <span className="min-w-0 truncate text-muted-foreground">{k}</span>
      <span
        className={cn(
          "shrink-0 font-semibold tabular-nums text-[#0F172B]",
          tone,
        )}
      >
        {v}
      </span>
    </div>
  );
}

function TileSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-5 animate-pulse rounded bg-muted/60" />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Readiness — technical-status readout                                      */
/* -------------------------------------------------------------------------- */

function CheckRow({
  icon: Icon,
  name,
  value,
  tone,
}: {
  icon: LucideIcon;
  name: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-dashed border-border/70 py-2.5 first:border-t-0">
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          tones[tone].chip,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-[13px] font-medium text-[#26304a]">
        {name}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold",
          tones[tone].text,
        )}
      >
        <i className={cn("h-1.5 w-1.5 rounded-full", tones[tone].dot)} />
        {value}
      </span>
    </div>
  );
}

function ReadinessTile({
  txk13,
  locomotiveId,
  modelId,
  isLoading,
  onOpen,
}: {
  txk13?: Txk13Locomotive;
  locomotiveId: number;
  modelId?: number;
  isLoading?: boolean;
  onOpen: (view: PassportView) => void;
}) {
  const t = useTranslations("locomotivePassport.dashboard");
  const { entries } = useLocomotiveOilStatusEntries(
    locomotiveId,
    modelId,
    !!locomotiveId,
  );
  const revision = useRevisionJournal({ locomotive: locomotiveId });

  const inspections = txk13?.inspections ?? [];
  const overdue = inspections.filter(isOverdue).length;

  const oilWithData = entries.filter((e) => e.status);
  const oilBad = oilWithData.filter(
    (e) => e.status?.validation !== "VALID",
  ).length;

  // Revision-journal entries without a resolution (table_number) are open
  // findings that still count against the locomotive's readiness.
  const revData = revision.data as
    { results?: { table_number?: string | number | null }[] } | undefined;
  const revRows = revData?.results ?? [];
  const revLoading = revision.isLoading && !revision.data;
  const revisionOpen = revRows.filter((r) => !r.table_number).length;

  const inspTone: Tone = overdue > 0 ? "crit" : "ok";
  const oilTone: Tone =
    oilWithData.length === 0 ? "muted" : oilBad > 0 ? "crit" : "ok";
  const revTone: Tone = revLoading ? "muted" : revisionOpen > 0 ? "warn" : "ok";

  // Overall verdict: a critical subsystem blocks readiness; open revision
  // findings limit it; otherwise the locomotive is cleared for service.
  const hasCrit = inspTone === "crit" || oilTone === "crit";
  const overallTone: Tone = hasCrit
    ? "crit"
    : revTone === "warn"
      ? "warn"
      : "ok";
  const OverallIcon =
    overallTone === "ok"
      ? CheckCircle2
      : overallTone === "warn"
        ? AlertTriangle
        : XCircle;
  const verdict =
    overallTone === "ok"
      ? t("readiness.statusReady")
      : overallTone === "warn"
        ? t("readiness.statusLimited")
        : t("readiness.statusNotReady");
  const issues = overdue + oilBad + revisionOpen;
  const summary =
    issues > 0
      ? t("readiness.issues", { count: issues })
      : t("readiness.allClear");

  return (
    <Tile
      view="inspections"
      title={t("readiness.title")}
      sub={t("readiness.sub")}
      icon={ShieldCheck}
      onOpen={onOpen}
      className="lg:col-span-4"
    >
      {isLoading && !txk13 ? (
        <TileSkeleton rows={4} />
      ) : (
        <>
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-3",
              tones[overallTone].chip,
            )}
          >
            <OverallIcon className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <div className="text-[15px] font-bold leading-tight">
                {verdict}
              </div>
              <div className="text-[11px] font-medium opacity-80">
                {summary}
              </div>
            </div>
          </div>

          <div>
            <CheckRow
              icon={Wrench}
              name={t("readiness.inspections")}
              tone={inspTone}
              value={
                overdue > 0
                  ? t("readiness.statusCrit", { count: overdue })
                  : t("readiness.statusOk")
              }
            />
            <CheckRow
              icon={Droplets}
              name={t("readiness.oil")}
              tone={oilTone}
              value={
                oilWithData.length === 0
                  ? "—"
                  : oilBad > 0
                    ? t("readiness.oilOverdue", { count: oilBad })
                    : t("readiness.oilAllValid")
              }
            />
            <CheckRow
              icon={ClipboardCheck}
              name={t("readiness.revision")}
              tone={revTone}
              value={
                revLoading
                  ? "—"
                  : revisionOpen > 0
                    ? t("readiness.revisionOpen", { count: revisionOpen })
                    : t("readiness.revisionOk")
              }
            />
          </div>
        </>
      )}
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  Next repair                                                               */
/* -------------------------------------------------------------------------- */

const isOverdue = (i: Txk13Inspection) =>
  (i.km_norm > 0 && i.km_difference <= 0) ||
  (i.hours_norm > 0 && i.hours_difference <= 0);

/** Pick the most urgent inspection and its binding metric (km or hours). */
function urgentInspection(inspections: Txk13Inspection[]) {
  let best: {
    insp: Txk13Inspection;
    byHours: boolean;
    value: number;
    norm: number;
    remaining: number;
    nextDate: string;
    frac: number;
  } | null = null;

  for (const insp of inspections) {
    const metrics: {
      byHours: boolean;
      norm: number;
      diff: number;
      value: number;
      date: string;
    }[] = [];
    if (insp.km_norm > 0)
      metrics.push({
        byHours: false,
        norm: insp.km_norm,
        diff: insp.km_difference,
        value: insp.km_value_since_repair,
        date: insp.km_next_repair_date,
      });
    if (insp.hours_norm > 0)
      metrics.push({
        byHours: true,
        norm: insp.hours_norm,
        diff: insp.hours_difference,
        value: insp.hours_value_since_repair,
        date: insp.hours_next_repair_date,
      });

    for (const m of metrics) {
      const frac = m.diff / m.norm;
      if (!best || frac < best.frac) {
        best = {
          insp,
          byHours: m.byHours,
          value: m.value,
          norm: m.norm,
          remaining: m.diff,
          nextDate: m.date,
          frac,
        };
      }
    }
  }
  return best;
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / 86_400_000);
}

function NextRepairTile({
  txk13,
  isLoading,
  onOpen,
}: {
  txk13?: Txk13Locomotive;
  isLoading?: boolean;
  onOpen: (view: PassportView) => void;
}) {
  const t = useTranslations("locomotivePassport.dashboard");
  const urgent = urgentInspection(txk13?.inspections ?? []);

  const tone: Tone = !urgent
    ? "muted"
    : urgent.remaining <= 0
      ? "crit"
      : urgent.frac < 0.15
        ? "warn"
        : "ok";
  const unit = urgent?.byHours ? t("nextRepair.hours") : t("nextRepair.km");
  const pct = urgent
    ? Math.min(100, Math.max(0, (urgent.value / urgent.norm) * 100))
    : 0;
  const days = daysUntil(urgent?.nextDate);

  const countdown =
    days == null
      ? null
      : days < 0
        ? t("nextRepair.inDaysOverdue", { count: Math.abs(days) })
        : t("nextRepair.inDays", { count: days });

  return (
    <Tile
      view="inspections"
      title={t("nextRepair.title")}
      icon={Wrench}
      onOpen={onOpen}
      className="lg:col-span-6"
    >
      {isLoading && !txk13 ? (
        <TileSkeleton />
      ) : !urgent ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("nextRepair.none")}
        </p>
      ) : (
        <>
          {/* Hero: the next inspection type */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div
                className="truncate text-[30px] font-extrabold leading-none tracking-tight text-[#0F172B]"
                title={urgent.insp.type}
              >
                {urgent.insp.type}
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                {urgent.byHours
                  ? t("nextRepair.byHours")
                  : t("nextRepair.byMileage")}
                {urgent.nextDate
                  ? ` · ${t("nextRepair.until", { date: fmtDate(urgent.nextDate) })}`
                  : ""}
              </div>
            </div>
            {countdown && (
              <span
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold",
                  tones[tone].chip,
                )}
              >
                {countdown}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[12px]">
              <span className="text-muted-foreground">
                {t("nextRepair.sinceRepair")}
              </span>
              <span className="font-semibold tabular-nums text-[#0F172B]">
                {fmtNumber(urgent.value)} / {fmtNumber(urgent.norm)} {unit}
              </span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-full bg-[#0F172B]/[0.07]">
              <div
                className={cn("h-full rounded-full", tones[tone].dot)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px]">
              <span className={cn("font-semibold", tones[tone].text)}>
                {urgent.remaining <= 0
                  ? t("nextRepair.overdue", {
                      value: fmtNumber(Math.abs(urgent.remaining)),
                      unit,
                    })
                  : t("nextRepair.remaining", {
                      value: fmtNumber(urgent.remaining),
                      unit,
                    })}
              </span>
              <span className="text-muted-foreground">{Math.round(pct)}%</span>
            </div>
          </div>
        </>
      )}
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  GPS                                                                       */
/* -------------------------------------------------------------------------- */

function GpsTile({
  imei,
  onOpen,
}: {
  imei?: string;
  onOpen: (view: PassportView) => void;
}) {
  const t = useTranslations("locomotivePassport.dashboard");
  const { data: location, isLoading } = useLocomotiveLocation(imei, !!imei);
  const moving = (location?.speed ?? 0) > 0;
  const engineOn = location?.engineOn === 1;

  return (
    <Tile
      view="location"
      title={t("gps.title")}
      sub={t("gps.sub")}
      icon={MapPin}
      onOpen={onOpen}
      className="lg:col-span-4"
    >
      <div className="relative h-[184px] overflow-hidden rounded-xl border bg-[#fbfcfe]">
        {imei && !isLoading && location ? (
          <>
            <iframe
              title={t("gps.title")}
              src={`https://yandex.com/map-widget/v1/?ll=${location.lon}%2C${location.lat}&z=14&pt=${location.lon}%2C${location.lat}%2Cpm2rdm`}
              loading="lazy"
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
            />
            {/* Click-shield: map is a live preview here; the tile stays clickable
                and the fully-interactive map lives on the location detail page. */}
            <span className="absolute inset-0 z-[1]" aria-hidden />
          </>
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            {!imei ? t("gps.noImei") : isLoading ? "…" : t("gps.noSignal")}
          </div>
        )}
      </div>

      {imei && location && (
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
              moving ? tones.ok.chip : "bg-slate-100 text-muted-foreground",
            )}
          >
            <Navigation className="h-3 w-3" />
            {t("gps.speed", { value: Math.round(location.speed) })}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
              engineOn
                ? "bg-[#2354BF]/12 text-[#2354BF]"
                : "bg-slate-100 text-muted-foreground",
            )}
          >
            <Power className="h-3 w-3" />
            {engineOn ? t("gps.engineOn") : t("gps.engineOff")}
          </span>
        </div>
      )}
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  Oil                                                                       */
/* -------------------------------------------------------------------------- */

const OIL_SHORT: Record<OilAnalysisModelName, string> = {
  DieselOilAnalysis: "ДМ",
  CompressorOilAnalysis: "КМ",
  ElectricCompressorOilAnalysis: "ЭК",
  MOPOilAnalysis: "МОП",
  ElectricMOPOilAnalysis: "ЭМ",
  CoolingWaterAnalysis: "ОВ",
  DieselFuelAnalysis: "ДТ",
};

function OilTile({
  locomotiveId,
  modelId,
  onOpen,
}: {
  locomotiveId: number;
  modelId?: number;
  onOpen: (view: PassportView) => void;
}) {
  const t = useTranslations("locomotivePassport.dashboard");
  const tType = useTranslations("locomotivePassport.oilStatus.types");
  const { entries, isLoading } = useLocomotiveOilStatusEntries(
    locomotiveId,
    modelId,
    !!locomotiveId,
  );

  const withData = entries.filter((e) => e.status);
  const valid = withData.filter((e) => e.status?.validation === "VALID").length;
  const bad = withData.length - valid;
  const diesel = entries.find((e) => e.analysis === "DieselOilAnalysis");

  return (
    <Tile
      view="oil"
      title={t("oil.title")}
      sub={
        withData.length === 0
          ? t("oil.none")
          : bad > 0
            ? t("oil.summaryBad", { valid, total: withData.length, bad })
            : t("oil.summaryValid", { valid, total: withData.length })
      }
      icon={Droplets}
      onOpen={onOpen}
      className="lg:col-span-6"
    >
      {isLoading && entries.length === 0 ? (
        <TileSkeleton rows={2} />
      ) : withData.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          {t("oil.none")}
        </p>
      ) : (
        <>
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${withData.length}, minmax(0, 1fr))`,
            }}
          >
            {withData.map((e) => {
              const tone: Tone =
                e.status?.validation === "VALID" ? "ok" : "crit";
              return (
                <div
                  key={e.analysis}
                  title={tType(e.analysis)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg font-mono text-[9px] font-bold",
                    tones[tone].chip,
                  )}
                >
                  {OIL_SHORT[e.analysis]}
                </div>
              );
            })}
          </div>
          {diesel?.status && (
            <Kv
              k={t("oil.dieselExchange")}
              v={fmtDate(diesel.status.exchange_date)}
              tone={
                diesel.status.validation !== "VALID"
                  ? "text-red-600"
                  : undefined
              }
            />
          )}
        </>
      )}
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  Crew                                                                      */
/* -------------------------------------------------------------------------- */

const initials = (name?: string) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const AV_COLORS = ["#2f6fed", "#0ea968", "#8b5cf6", "#e0932a"];

function CrewTile({
  locomotiveNumber,
  modelId,
  onOpen,
}: {
  locomotiveNumber?: string;
  modelId?: number;
  onOpen: (view: PassportView) => void;
}) {
  const t = useTranslations("locomotivePassport.dashboard");
  const enabled = !!locomotiveNumber && !!modelId;
  const { data, isLoading } = useDriverInfo(locomotiveNumber, modelId, enabled);
  const drivers = data?.data ?? [];
  const shown = drivers.slice(0, 3);
  const extra = Math.max(0, drivers.length - shown.length);

  return (
    <Tile
      view="crew"
      title={t("crew.title")}
      sub={
        drivers.length > 0
          ? t("crew.count", { count: drivers.length })
          : undefined
      }
      icon={Users}
      onOpen={onOpen}
      className="lg:col-span-4"
    >
      {enabled && isLoading && !data ? (
        <TileSkeleton rows={2} />
      ) : drivers.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          {t("crew.none")}
        </p>
      ) : (
        <>
          <div className="flex items-center pt-1">
            {shown.map((d, i) => (
              <div
                key={d.emm_id ?? i}
                className="-ml-2 grid h-9 w-9 place-items-center rounded-full border-2 border-card text-[13px] font-bold text-white first:ml-0"
                style={{ background: AV_COLORS[i % AV_COLORS.length] }}
                title={d.mashinist_fio}
              >
                {initials(d.mashinist_fio)}
              </div>
            ))}
            {extra > 0 && (
              <div className="-ml-2 grid h-9 w-9 place-items-center rounded-full border-2 border-card bg-slate-400 text-[11px] font-bold text-white">
                +{extra}
              </div>
            )}
          </div>
          <Kv k={t("crew.senior")} v={drivers[0]?.mashinist_fio || "—"} />
        </>
      )}
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  Components + Journals                                                     */
/* -------------------------------------------------------------------------- */

function countOf(data: unknown): number {
  const d = data as { count?: number; results?: unknown[] } | undefined;
  return d?.count ?? d?.results?.length ?? 0;
}

function ComponentsTile({
  sections,
  locomotiveId,
  onOpen,
}: {
  sections: { id: number; name: string }[];
  locomotiveId: number;
  onOpen: (view: PassportView) => void;
}) {
  const t = useTranslations("locomotivePassport.dashboard");
  const { data, isLoading } = useComponentRegistry({
    locomotive_id: locomotiveId,
  });

  return (
    <Tile
      view="components"
      title={t("components.title")}
      sub={t("components.sub")}
      icon={Boxes}
      onOpen={onOpen}
      className="lg:col-span-6"
    >
      <Kv k={t("components.sections")} v={sections.length} />
      <Kv
        k={t("components.registry")}
        v={isLoading && !data ? "—" : countOf(data)}
      />
    </Tile>
  );
}

function JournalsTile({
  locomotiveId,
  onOpen,
}: {
  locomotiveId: number;
  onOpen: (view: PassportView) => void;
}) {
  const t = useTranslations("locomotivePassport.dashboard");
  const orders = useOrders({ locomotive: locomotiveId });
  const pantograph = usePantographJournal({ locomotive: locomotiveId });
  const revision = useRevisionJournal({ locomotive: locomotiveId });

  const total =
    countOf(orders.data) + countOf(pantograph.data) + countOf(revision.data);

  return (
    <Tile
      view="journals"
      title={t("journals.title")}
      sub={t("journals.sub", { count: total })}
      icon={ClipboardList}
      onOpen={onOpen}
      className="lg:col-span-6"
    >
      <Kv k={t("journals.revision")} v={countOf(revision.data)} />
      <Kv k={t("journals.mpr")} v={countOf(orders.data)} />
      <Kv k={t("journals.pantograph")} v={countOf(pantograph.data)} />
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bento grid                                                                */
/* -------------------------------------------------------------------------- */

export function PassportDashboard({
  onOpen,
  imei,
  locomotiveNumber,
  modelId,
  locomotiveId,
  txk13,
  isTxk13Loading,
  sections,
}: {
  onOpen: (view: PassportView) => void;
  imei?: string;
  locomotiveNumber?: string;
  modelId?: number;
  locomotiveId: number;
  txk13?: Txk13Locomotive;
  isTxk13Loading?: boolean;
  sections: { id: number; name: string }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
      {/* Row 1 — readiness · brigade · location */}
      <ReadinessTile
        txk13={txk13}
        locomotiveId={locomotiveId}
        modelId={modelId}
        isLoading={isTxk13Loading}
        onOpen={onOpen}
      />
      <CrewTile
        locomotiveNumber={locomotiveNumber}
        modelId={modelId}
        onOpen={onOpen}
      />
      <GpsTile imei={imei} onOpen={onOpen} />

      {/* Row 2 — next inspection · oil */}
      <NextRepairTile
        txk13={txk13}
        isLoading={isTxk13Loading}
        onOpen={onOpen}
      />
      <OilTile locomotiveId={locomotiveId} modelId={modelId} onOpen={onOpen} />

      {/* Row 3 — components · journals */}
      <ComponentsTile
        sections={sections}
        locomotiveId={locomotiveId}
        onOpen={onOpen}
      />
      <JournalsTile locomotiveId={locomotiveId} onOpen={onOpen} />
    </div>
  );
}
