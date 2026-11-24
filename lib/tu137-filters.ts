import type { Tu137Record } from "@/api/types/tu137";

export interface Tu137FilterValues {
  /** mashinist name search */
  q?: string;
  /** yyyy-MM-dd, by created_at */
  start_date?: string;
  end_date?: string;
  /** responsible organization id (SHCH, PCH, ...) */
  resp_org?: string;
}

const dayStart = (value: string) => new Date(`${value}T00:00:00`).getTime();
const dayEnd = (value: string) => new Date(`${value}T23:59:59.999`).getTime();

/** Client-side filter over the depo's records (the API returns them in one batch). */
export function filterTu137(
  records: Tu137Record[],
  { q, start_date, end_date, resp_org }: Tu137FilterValues,
): Tu137Record[] {
  const needle = q?.trim().toLowerCase();
  const from = start_date ? dayStart(start_date) : null;
  const to = end_date ? dayEnd(end_date) : null;

  return records.filter((r) => {
    if (needle && !(r.create_user_fio ?? "").toLowerCase().includes(needle)) {
      return false;
    }
    if (resp_org && String(r.resp_organization?.id) !== resp_org) return false;
    if (from !== null || to !== null) {
      const created = new Date(r.created_at).getTime();
      if (from !== null && created < from) return false;
      if (to !== null && created > to) return false;
    }
    return true;
  });
}

/** Responsible organizations present in the records, for the filter select. */
export function getRespOrganizations(records: Tu137Record[]) {
  const map = new Map<number, string>();
  records.forEach((r) => {
    if (r.resp_organization?.id != null) {
      map.set(r.resp_organization.id, r.resp_organization.name);
    }
  });
  return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * A remark repeats when the same defect group is raised again at the same
 * station / stretch.
 */
export const recurringKey = (r: Tu137Record) =>
  [r.group_id, r.station_code ?? "", r.station2_code ?? ""].join("|");

export interface RecurringGroup {
  key: string;
  group_name: string;
  station: string;
  count: number;
  open: number;
  records: Tu137Record[];
}

export function getRecurringGroups(records: Tu137Record[]): RecurringGroup[] {
  const map = new Map<string, RecurringGroup>();
  records.forEach((r) => {
    const key = recurringKey(r);
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        group_name: r.group_name,
        station: r.station2_name
          ? `${r.station_name} - ${r.station2_name}`
          : r.station_name,
        count: 0,
        open: 0,
        records: [],
      };
      map.set(key, g);
    }
    g.count++;
    if (!r.finished) g.open++;
    g.records.push(r);
  });
  return Array.from(map.values())
    .filter((g) => g.count > 1)
    .map((g) => ({
      ...g,
      records: g.records.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }))
    .sort((a, b) => b.count - a.count);
}

/** key -> number of times the remark was raised (only for repeating ones). */
export function getRecurringCounts(records: Tu137Record[]) {
  const counts = new Map<string, number>();
  records.forEach((r) => {
    const k = recurringKey(r);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  });
  return counts;
}
