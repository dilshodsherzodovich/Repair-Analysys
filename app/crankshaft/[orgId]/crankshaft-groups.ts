import type { SpecialComponent } from "@/api/types/locomotive";

/**
 * Crankshaft value groups. A value lands in the group of its whole part:
 * 0 ≤ v < 1 is group 0, 1 ≤ v < 2 is group 1, ... 6 ≤ v < 7 is group 6,
 * and everything from 7 up is group 7.
 */
export const CRANKSHAFT_GROUPS = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
  key: String(n),
  range: n === 7 ? "7+" : `${n}–${n + 1}`,
}));

const LAST_GROUP = 7;

/**
 * Stored for a koren / shatun position the locomotive does not have (models
 * have 7–12 koren and 5–12 shatun). Such cells are never counted.
 */
export const MISSING_VALUE = "none";

export const isMissingValue = (value: unknown) =>
  typeof value === "string" && value.trim().toLowerCase() === MISSING_VALUE;

/** The group of one koren / shatun value; null when the cell is empty or missing. */
export const crankshaftGroupKey = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (isMissingValue(value)) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return String(Math.min(LAST_GROUP, Math.floor(n)));
};

export const isKorenField = (field: string) => field.includes("koren");
export const isShatunField = (field: string) => field.includes("shatun");

export type ServiceKind = "mainline" | "switcher";

/** Switcher locomotives count as manyovr; every other service type is magistral. */
export const serviceKind = (serviceType: string | null | undefined): ServiceKind =>
  serviceType === "switcher" ? "switcher" : "mainline";

export const isServiceKind = (value: string | null): value is ServiceKind =>
  value === "mainline" || value === "switcher";

const POSITION_ORDER: Record<string, number> = { top: 0, bottom: 1 };

/**
 * Table order: by section (rows without one last), then Верх before Низ.
 * 2ТЭ-10М-series sections have a top and a bottom crankshaft; other models
 * one per section with no position.
 */
export const compareComponents = (a: SpecialComponent, b: SpecialComponent) =>
  (a.section?.id ?? Number.POSITIVE_INFINITY) -
    (b.section?.id ?? Number.POSITIVE_INFINITY) ||
  (POSITION_ORDER[a.position ?? ""] ?? 2) - (POSITION_ORDER[b.position ?? ""] ?? 2);

/** "Верх" / "Низ" in the UI language; null for models without positions. */
export const positionLabel = (
  component: SpecialComponent,
  tModal: (key: string) => string,
): string | null =>
  component.position === "top"
    ? tModal("position_top")
    : component.position === "bottom"
      ? tModal("position_bottom")
      : (component.position_display ?? null);

/** Section name with the position: "A · Верх", or just "A". */
export const sectionLabel = (
  component: SpecialComponent,
  index: number,
  tModal: (key: string) => string,
) => {
  const section = component.section?.name ?? `${tModal("section")} ${index + 1}`;
  const position = positionLabel(component, tModal);
  return position ? `${section} · ${position}` : section;
};
