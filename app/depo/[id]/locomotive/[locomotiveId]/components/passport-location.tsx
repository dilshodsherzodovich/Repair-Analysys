"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Modal } from "@/ui/modal";
import { MapPin, Navigation, Gauge, Power, Satellite, History, ExternalLink } from "lucide-react";
import { SectionCard, InfoRow, EmptyBlock, LoadingBlock } from "./passport-shared";
import { useLocomotiveLocation, useLocomotiveLocationHistory } from "@/api/hooks/use-emm";
import type { LocationRecord } from "@/api/services/emm.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

const mapLink = (lat: number, lon: number) =>
  `https://yandex.com/maps/?ll=${lon},${lat}&pt=${lon},${lat}&z=15&l=map`;

/** Precise timestamp incl. seconds, for the history log. */
const fmtExact = (ts: string | number) => {
  const d = new Date(typeof ts === "string" ? Number(ts) : ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/** Embedded Yandex map view centred on a coordinate with a marker. */
function MapFrame({
  lat,
  lon,
  className,
}: {
  lat: number;
  lon: number;
  className?: string;
}) {
  const src = `https://yandex.com/map-widget/v1/?ll=${lon}%2C${lat}&z=15&pt=${lon}%2C${lat}%2Cpm2rdm`;
  return (
    <iframe
      key={`${lat}-${lon}`}
      title="map"
      src={src}
      loading="lazy"
      allowFullScreen
      className={cn("w-full rounded-lg border", className)}
    />
  );
}

function HistoryDialog({ imei }: { imei: string }) {
  const t = useTranslations("locomotivePassport.location");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useLocomotiveLocationHistory(imei, open);
  const rows = (data ?? []).slice(0, 100);
  const [selected, setSelected] = useState<LocationRecord | null>(null);

  // Default the map to the newest fix once history arrives.
  useEffect(() => {
    if (rows.length > 0 && !selected) setSelected(rows[0]);
  }, [rows, selected]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <History className="size-4" />
        {t("history")}
      </Button>
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        title={t("historyTitle")}
        size="xl"
      >
        {isLoading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyBlock icon={History} message={t("noHistory")} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              {selected && (
                <MapFrame
                  lat={selected.lat}
                  lon={selected.lon}
                  className="h-56"
                />
              )}
              {selected && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="font-medium text-foreground">
                    {fmtExact(selected.tpTimestamp)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <span>
                      {Math.round(selected.speed)} {t("kmh")}
                    </span>
                    <span>
                      {selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}
                    </span>
                    <a
                      href={mapLink(selected.lat, selected.lon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("mapLink")}
                    </a>
                  </div>
                </div>
              )}
            </div>
            <Table bordered frame maxHeight="52vh">
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead className="text-left">
                    {t("time")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("speed")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const isSel =
                    selected?.id === r.id &&
                    selected?.tpTimestamp === r.tpTimestamp;
                  return (
                    <TableRow
                      key={`${r.id}-${r.tpTimestamp}`}
                      onClick={() => setSelected(r)}
                      className={cn(
                        "cursor-pointer hover:bg-primary/5",
                        isSel && "bg-primary/10"
                      )}
                    >
                      <TableCell className="whitespace-nowrap">
                        {fmtExact(r.tpTimestamp)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Math.round(r.speed)} {t("kmh")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Modal>
    </>
  );
}

export function PassportLocation({ imei }: { imei?: string }) {
  const t = useTranslations("locomotivePassport.location");
  const { data, isLoading, isError } = useLocomotiveLocation(imei, !!imei);

  const engineOn = data?.engineOn === 1;
  const moving = (data?.speed ?? 0) > 0;

  return (
    <SectionCard
      title={t("title")}
      description={t("description")}
      icon={MapPin}
      loading={isLoading}
      action={imei ? <HistoryDialog imei={imei} /> : undefined}
    >
      {!imei ? (
        <EmptyBlock icon={MapPin} message={t("noImei")} />
      ) : isLoading && !data ? (
        <LoadingBlock />
      ) : isError || !data ? (
        <EmptyBlock icon={MapPin} message={t("loadError")} />
      ) : (
        <div className="space-y-4">
          <MapFrame lat={data.lat} lon={data.lon} className="h-64" />

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                moving
                  ? "bg-success text-success-foreground border-transparent"
                  : "bg-muted-foreground text-primary-foreground border-transparent"
              }
            >
              {moving ? t("moving") : t("stopped")}
            </Badge>
            <Badge
              className={
                engineOn
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-muted text-foreground-secondary border-transparent"
              }
            >
              <Power className="mr-1 h-3 w-3" />
              {engineOn ? t("engineOn") : t("engineOff")}
            </Badge>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              <InfoRow
                icon={Navigation}
                label={t("coordinates")}
                value={`${data.lat.toFixed(5)}, ${data.lon.toFixed(5)}`}
              />
              <InfoRow
                icon={Gauge}
                label={t("speed")}
                value={`${Math.round(data.speed)} ${t("kmh")}`}
              />
              <InfoRow
                icon={Satellite}
                label={t("satellites")}
                value={data.satellites ?? "—"}
              />
              <InfoRow
                icon={MapPin}
                label={t("lastUpdate")}
                value={fmtExact(data.tpTimestamp)}
              />
            </div>
          </div>

          <Button asChild variant="outline" className="w-full border-border-strong">
            <a
              href={mapLink(data.lat, data.lon)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("openLargeMap")}
            </a>
          </Button>
        </div>
      )}
    </SectionCard>
  );
}
