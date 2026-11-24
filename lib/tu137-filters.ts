import type { Tu137Record } from "@/api/types/tu137";

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
