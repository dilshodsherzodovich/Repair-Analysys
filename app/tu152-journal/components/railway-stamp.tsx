"use client";

import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type RailwayStampVariant = "red" | "green";

interface RailwayStampProps {
  variant: RailwayStampVariant;
  date?: Date | string | null;
  /** Depo / branch name, rendered in uppercase. e.g. "Termiz lokomotiv deposi". */
  branchName?: string;
  /** Interactive mode: selected = chosen, unselected = ghosted. Ignored in display mode. */
  selected?: boolean;
  disabled?: boolean;
  /** Pass onClick for interactive (modal) mode. Omit for display mode (detail page). */
  onClick?: () => void;
  className?: string;
}

function parseDate(value?: Date | string | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function RailwayStamp({
  variant,
  date,
  branchName,
  selected = true,
  disabled,
  onClick,
  className,
}: RailwayStampProps) {
  const isRed = variant === "red";
  const verdictText = isRed ? "RUXSAT BERILDI" : "TAQIQLANADI";

  const d = parseDate(date);
  const day = d ? format(d, "dd") : "__";
  const month = d ? format(d, "MMMM", { locale: uz }) : "_________";
  const yearLast2 = d ? format(d, "yy") : "__";

  const colorText = isRed ? "text-red-700" : "text-emerald-700";
  const interactive = Boolean(onClick);

  const svg = (
    <svg
      viewBox="0 0 400 200"
      className="block w-full h-auto stroke-current select-none"
      aria-hidden
    >
      {/* Outer border */}
      <rect
        x="5"
        y="5"
        width="390"
        height="190"
        rx="3"
        fill="none"
        strokeWidth="2.5"
      />

      {/* Curved top arc for company name */}
      <defs>
        <path
          id={`stamp-arc-${variant}`}
          d="M 28 48 Q 200 18 372 48"
          fill="none"
        />
      </defs>
      <text
        fontSize="15"
        fontWeight="900"
        letterSpacing="1"
        fill="currentColor"
        stroke="none"
      >
        <textPath
          href={`#stamp-arc-${variant}`}
          startOffset="50%"
          textAnchor="middle"
        >
          «O&apos;ZBEKISTON TEMIR YO&apos;LLARI»
        </textPath>
      </text>

      {/* AKSIYADORLIK JAMIYATI */}
      <text
        x="200"
        y="65"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        letterSpacing="2"
        fill="currentColor"
        stroke="none"
      >
        AKSIYADORLIK JAMIYATI
      </text>

      <line x1="20" y1="75" x2="380" y2="75" strokeWidth="1" />

      <text
        x="200"
        y="91"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.5"
        fill="currentColor"
        stroke="none"
      >
        TEXNIK VA TEXNOLOGIK NAZORAT BOSHQARMASI
      </text>

      <line x1="20" y1="101" x2="380" y2="101" strokeWidth="1" />

      {/* Depo lines */}
      <text
        x="200"
        y="119"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        {`${(branchName || "LOKOMOTIV DEPOSI").toUpperCase()},`}
      </text>
      <text
        x="200"
        y="135"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        LOKOMOTIV QABUL QILUVCHI XODIMI
      </text>

      {/* Verdict line */}
      <text
        x="200"
        y="155"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        letterSpacing="0.5"
        fill="currentColor"
        stroke="none"
      >
        {verdictText}
      </text>

      <line x1="20" y1="165" x2="380" y2="165" strokeWidth="1" />

      {/* Date + Imzo */}
      <text
        x="28"
        y="185"
        fontSize="12"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        {`20${yearLast2}   "${day}"   ${month}`}
      </text>
      <text
        x="372"
        y="185"
        textAnchor="end"
        fontSize="12"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        Imzo
      </text>
    </svg>
  );

  if (!interactive) {
    return (
      <div className={cn("shrink-0 inline-block", colorText, className)}>
        {svg}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "shrink-0 cursor-pointer outline-none rounded-md transition-all duration-300",
        "focus-visible:ring-4 focus-visible:ring-offset-2",
        isRed ? "focus-visible:ring-red-200" : "focus-visible:ring-emerald-200",
        disabled && "cursor-not-allowed",
        selected
          ? cn("opacity-100 scale-100 -rotate-2 drop-shadow-md", colorText)
          : "opacity-30 grayscale hover:opacity-60 hover:grayscale-0 scale-95 text-slate-500",
        className,
      )}
    >
      {svg}
    </button>
  );
}
