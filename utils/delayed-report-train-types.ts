import type { DelayedLocomotivesResponse } from "@/api/types/reports";

/**
 * Display name for a `/delayed-locomotives-report/` train type group, shared by
 * the page and its PDF/Excel exports. An unknown name is shown as-is rather
 * than mislabelled as diesel.
 */
export function delayedTrainTypeName(
  name: string,
  tr: Record<string, string | undefined>,
): string {
  switch (name) {
    case "electric_locos":
      return tr.electricLocs ?? "Elektrovozlar";
    case "diesel_locos":
      return tr.dieselLocs ?? "Teplovozlar";
    case "electric_trains":
      return tr.electricTrains ?? "Elektropoyezdlar";
    // Older group names, kept while the backend may still send them
    case "electric_freight_locos":
      return tr.freightLocos ?? "Elektrovoz-yuk";
    case "electric_switches_locos":
      return tr.switcherLocos ?? "Elektrovoz-manyovr";
    case "passenger_locos":
      return tr.passengerLocs ?? "Yo'lovchi";
    default:
      return name;
  }
}

/**
 * Delayed locomotives in a train type group. Prefers the API's `count`: a
 * locomotive overdue for several inspection types appears in each of their
 * lists, so summing the list lengths counts it more than once.
 */
export function delayedTrainTypeCount(trainType: DelayedLocomotivesResponse) {
  if (typeof trainType.count === "number") return trainType.count;
  const ids = new Set<number>();
  trainType.inspection_types.forEach((type) =>
    type.locomotives.forEach((loc) => ids.add(loc.id)),
  );
  return ids.size;
}
