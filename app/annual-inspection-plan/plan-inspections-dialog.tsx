"use client";

import { memo, useMemo } from "react";
import { AnnualPlanFactInspection } from "@/api/types/annual-inspection-plan";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import {
  formatInspectionValue,
  inspectionFields,
  MONTHS_FULL,
} from "./plan-grid-shared";

export interface InspectionsDialogData {
  /** Inspection type name, e.g. "TO-3". */
  typeName: string;
  /** Locomotive model name, e.g. "UzTE16M". */
  modelName: string;
  /** 1-based month, or null for a whole-row (yearly) listing. */
  month: number | null;
  inspections: AnnualPlanFactInspection[];
}

/**
 * Lists the individual inspections behind one Fakt cell. The column set is
 * derived from the payload (see `inspectionFields`) so new backend fields show
 * up without a code change.
 */
export const PlanInspectionsDialog = memo(function PlanInspectionsDialog({
  data,
  onClose,
}: {
  data: InspectionsDialogData | null;
  onClose: () => void;
}) {
  const fields = useMemo(() => inspectionFields(data?.inspections ?? []), [data]);

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {data?.typeName} — {data?.modelName}
          </DialogTitle>
          <DialogDescription>
            {data?.month ? `${MONTHS_FULL[data.month - 1]} oyi` : "Yillik"} ·{" "}
            {data?.inspections.length ?? 0} ta ko&apos;rik
          </DialogDescription>
        </DialogHeader>

        {fields.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Ko&apos;rik tafsilotlari yo&apos;q
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="text-muted-foreground">
                  <th className="border-b border-border px-2 py-2 text-center font-medium w-10">
                    №
                  </th>
                  {fields.map((f) => (
                    <th
                      key={f.key}
                      className="border-b border-border px-3 py-2 text-left font-medium whitespace-nowrap"
                    >
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.inspections.map((ins, i) => (
                  <tr
                    key={ins?.id ?? i}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="border-b border-border px-2 py-2 text-center tabular-nums text-muted-foreground">
                      {i + 1}
                    </td>
                    {fields.map((f) => (
                      <td
                        key={f.key}
                        className="border-b border-border px-3 py-2 text-left whitespace-nowrap"
                      >
                        {formatInspectionValue(ins?.[f.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
