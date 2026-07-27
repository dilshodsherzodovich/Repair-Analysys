"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { TrainFront } from "lucide-react";
import { fmtNumber, fmtDate } from "./passport-shared";
import type { Txk13Locomotive } from "@/api/types/txk13-report";
import type { LocomotiveFullDetail } from "@/api/types/locomotive";

/* -------------------------------------------------------------------------- */
/*  The "data page" — a laminated identity band. Committed to a dark ink-navy  */
/*  look in every theme, like a real passport's laminated page.                */
/* -------------------------------------------------------------------------- */

/** Engine-turned guilloché — the security-print rosette drawn behind the band. */
function useGuilloche(hostRef: React.RefObject<HTMLElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const rose = (
        cx: number,
        cy: number,
        R: number,
        r: number,
        d: number,
        hue: string,
        alpha: number,
        rot: number,
        loops: number,
      ) => {
        ctx.strokeStyle = hue;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        const steps = 1500;
        const k = (R - r) / r;
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * Math.PI * 2 * loops + rot;
          const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t);
          const y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      const cx = rect.width * 0.76;
      const cy = rect.height * 0.5;
      rose(cx, cy, 190, 41, 62, "rgba(120,160,255,.9)", 0.1, 0, 14);
      rose(cx, cy, 158, 33, 54, "rgba(216,178,94,.9)", 0.09, 0.4, 14);
      rose(cx, cy, 126, 27, 42, "rgba(120,160,255,.9)", 0.08, 0.8, 14);
      const cx2 = rect.width * 0.13;
      for (let g = 0; g < 3; g++) {
        rose(cx2, cy, 72 - g * 16, 15, 26, "rgba(140,170,255,.9)", 0.05, 0, 10);
      }
      ctx.globalAlpha = 1;
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(host);
    return () => ro.disconnect();
  }, [hostRef]);

  return canvasRef;
}

export function PassportIdentity({
  name,
  modelName,
  sectionsCount,
  imageUrl,
  txk13,
  detail,
  modelId,
}: {
  name?: string;
  modelName?: string;
  sectionsCount?: number;
  imageUrl?: string | null;
  txk13?: Txk13Locomotive;
  detail?: LocomotiveFullDetail;
  modelId?: number;
}) {
  const t = useTranslations("locomotivePassport");
  const hostRef = useRef<HTMLElement>(null);
  const canvasRef = useGuilloche(hostRef);

  const enumLabel = (group: string, value?: string | null) => {
    if (!value) return "—";
    const key = `enums.${group}.${value}`;
    return t.has(key) ? t(key) : value;
  };
  const stateLabel = enumLabel("state", detail?.state);
  const serviceTypeLabel = enumLabel("serviceType", detail?.service_type);
  const locomotiveTypeLabel = enumLabel(
    "locomotiveType",
    detail?.locomotive_model?.locomotive_type,
  );

  const number = txk13?.number || name || "";
  const series = txk13?.series || modelName || "";

  // Details, ordered identity → classification → assignment → lifecycle.
  // Fields with no backing data are omitted rather than shown as em-dashes.
  const specs: { k: string; v: string; unit?: string; small?: boolean }[] = [];
  if (series || number)
    specs.push({
      k: t("details.seriesNumber"),
      v: `${series || "—"} / ${number || "—"}`,
      small: true,
    });
  if (detail?.locomotive_model?.locomotive_type)
    specs.push({ k: t("details.type"), v: locomotiveTypeLabel, small: true });
  if (detail?.service_type)
    specs.push({
      k: t("details.serviceType"),
      v: serviceTypeLabel,
      small: true,
    });
  if (sectionsCount != null)
    specs.push({
      k: t("details.sections"),
      v: String(sectionsCount),
      small: true,
    });
  if (detail?.state)
    specs.push({ k: t("details.state"), v: stateLabel, small: true });
  if (txk13?.depo)
    specs.push({ k: t("details.depo"), v: txk13.depo, small: true });
  if (txk13?.manufactured_date)
    specs.push({
      k: t("details.manufactured"),
      v: fmtDate(txk13.manufactured_date),
      small: true,
    });
  if (txk13?.total_mileage != null)
    specs.push({
      k: t("details.totalMileage"),
      v: fmtNumber(txk13.total_mileage),
      unit: "км",
    });
  if (txk13?.average_monthly_mileage != null)
    specs.push({
      k: t("details.monthlyAverage"),
      v: fmtNumber(txk13.average_monthly_mileage),
      unit: "км",
    });
  if (txk13?.bandaj_thickness != null)
    specs.push({
      k: t("details.bandaj"),
      v: String(txk13.bandaj_thickness),
      unit: "мм",
    });

  return (
    <section
      ref={hostRef}
      className="relative isolate overflow-hidden rounded-3xl border border-white/10"
      style={{
        background:
          "linear-gradient(135deg, #0d1830 0%, #0a1226 46%, #0b1a3a 100%)",
        color: "#e9eefc",
        boxShadow:
          "0 30px 70px -40px rgba(6,12,30,.9), inset 0 1px 0 rgba(255,255,255,.05)",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(105deg, transparent 30%, rgba(120,160,255,.10) 46%, rgba(200,170,90,.08) 52%, transparent 66%)",
          mixBlendMode: "screen",
        }}
      />

      <div className="relative z-[2] p-5 sm:p-7 lg:p-8">
        {/* main: portrait · identity · details (right) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,0.95fr)] lg:items-stretch">
          {/* passport portrait — the locomotive photo */}
          <div
            className="relative min-h-[240px] overflow-hidden rounded-2xl"
            style={{
              background: "linear-gradient(180deg,#fbfcff,#eef2fb)",
              boxShadow:
                "inset 0 0 0 1px rgba(216,178,94,.45), 0 10px 26px -16px rgba(0,0,0,.7)",
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={modelName ?? name ?? ""}
                className="absolute inset-0 h-full w-full object-contain p-3.5"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <TrainFront className="h-20 w-20 text-slate-300" />
              </div>
            )}
            <div
              className="absolute inset-x-0 bottom-0 truncate px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em]"
              style={{
                color: "#6b7690",
                background:
                  "linear-gradient(0deg, rgba(255,255,255,.92), transparent)",
              }}
            >
              {modelName ?? ""}
            </div>
          </div>

          {/* identity block */}
          <div className="flex min-w-0 flex-col justify-center">
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.24em]"
              style={{ color: "#8fa0c4" }}
            >
              {t("identity.boardNumber")}
            </div>
            <div
              className="my-1 font-extrabold leading-[0.92] tracking-[-0.03em] tabular-nums text-white"
              style={{
                fontSize: "clamp(52px, 9vw, 92px)",
                textShadow: "0 2px 30px rgba(90,140,255,.25)",
              }}
            >
              {name ?? "—"}
            </div>
            <div
              className="text-[18px] font-semibold"
              style={{ color: "#d6deef" }}
            >
              {modelName ?? "—"}{" "}
              <span className="font-medium" style={{ color: "#8fa0c4" }}>
                · {locomotiveTypeLabel}
                {sectionsCount
                  ? ` · ${t("identity.sectionsShort", { count: sectionsCount })}`
                  : ""}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {detail?.on_assignment && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold"
                  style={{
                    background: "rgba(52,211,153,.15)",
                    color: "#7ee6bb",
                    borderColor: "rgba(52,211,153,.3)",
                  }}
                >
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: "#34d399" }}
                  />
                  {t("details.onAssignment")}
                </span>
              )}
              {detail?.state && (
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-semibold"
                  style={{
                    background: "rgba(91,147,255,.15)",
                    color: "#a9c4ff",
                    borderColor: "rgba(91,147,255,.3)",
                  }}
                >
                  {stateLabel}
                </span>
              )}
            </div>
          </div>

          {/* details — the right section */}
          <div
            className="grid grid-cols-2 gap-px self-stretch overflow-hidden rounded-2xl border"
            style={{
              background: "rgba(255,255,255,.08)",
              borderColor: "rgba(255,255,255,.08)",
            }}
          >
            {specs.map((s) => (
              <SpecCell
                key={s.k}
                k={s.k}
                v={s.v}
                unit={s.unit}
                small={s.small}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecCell({
  k,
  v,
  unit,
  small,
}: {
  k: string;
  v: string;
  unit?: string;
  small?: boolean;
}) {
  return (
    <div
      className="p-3 sm:px-3.5"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,.03), transparent)",
      }}
    >
      <div
        className="font-mono text-[9.5px] uppercase tracking-[0.18em]"
        style={{ color: "#8093b8" }}
      >
        {k}
      </div>
      <div
        className={
          small
            ? "mt-1 text-sm font-bold tabular-nums"
            : "mt-1 text-[15px] font-bold tabular-nums"
        }
        style={{ color: "#eef2fb" }}
      >
        {v}
        {unit && (
          <span
            className="ml-1 text-xs font-medium"
            style={{ color: "#9fabc8" }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
