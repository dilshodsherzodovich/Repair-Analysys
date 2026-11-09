import { Bandage } from "@/api/types/bandage";

/**
 * Bandage thickness groups. A bandage lands in the group whose range holds its
 * value; decimals between two ranges (39.5) go to the lower group.
 */
export const BANDAGE_GROUPS = [
  { key: "36", min: 36, max: 39 },
  { key: "40", min: 40, max: 48 },
  { key: "50", min: 49, max: 55 },
  { key: "60", min: 56, max: 65 },
  { key: "70", min: 66, max: 75 },
  { key: "80", min: 76, max: 80 },
  { key: "90", min: 81, max: 95 },
] as const;

/** Values below the first range or above the last one. */
export const OUT_OF_RANGE = "other";

/**
 * The group a bandage belongs to, decided by its thinner side; null when
 * neither side has a value.
 */
export const bandageGroupKey = (bandage: Bandage): string | null => {
  const values = [bandage.left, bandage.right].filter(
    (value): value is number => value !== null && value !== undefined,
  );
  if (!values.length) return null;
  const value = Math.min(...values);

  for (let i = BANDAGE_GROUPS.length - 1; i >= 0; i--) {
    const group = BANDAGE_GROUPS[i];
    if (value >= group.min) {
      return value < group.max + 1 ? group.key : OUT_OF_RANGE;
    }
  }
  return OUT_OF_RANGE;
};
