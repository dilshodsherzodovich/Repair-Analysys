"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Modal } from "@/ui/modal";
import { Badge } from "@/ui/badge";
import { useSrivPaymentReportDetails } from "@/api/hooks/use-delays";
import type { SrivPaymentReportDetailsParams } from "@/api/types/delays";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  params?: SrivPaymentReportDetailsParams;
  title: string;
}

const fmtSum = (v: number) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(
    Math.round(Number(v) || 0)
  );

const fmtDate = (s?: string) => {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, "0")}.${String(
      d.getMonth() + 1
    ).padStart(2, "0")}.${d.getFullYear()}`;
  } catch {
    return s;
  }
};

export function SrivPaymentDrilldownModal({
  isOpen,
  onClose,
  params,
  title,
}: Props) {
  const t = useTranslations("SrivPaymentReportPage");
  const { data, isLoading, error } = useSrivPaymentReportDetails(
    isOpen ? params : undefined
  );

  const results = data?.results ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="min-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">
            {t("error")}
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {t("empty")}
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-500">
              {t("count_n", { n: data?.count ?? results.length })}
            </p>
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2.5 font-semibold">{t("dd_date")}</th>
                    <th className="px-3 py-2.5 font-semibold">{t("dd_train")}</th>
                    <th className="px-3 py-2.5 font-semibold">
                      {t("dd_station")}
                    </th>
                    <th className="px-3 py-2.5 font-semibold">{t("depo")}</th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      {t("dd_damage")}
                    </th>
                    <th className="px-3 py-2.5 font-semibold">
                      {t("dd_culprits")}
                    </th>
                    <th className="px-3 py-2.5 font-semibold">{t("dd_stage")}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => {
                    const culprits = row.culprits ?? [];
                    const recovered = culprits.filter((c) => c.recovered).length;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                          {fmtDate(row.incident_date)}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          {row.train_number || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {row.station || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {row.responsible_org_name ||
                            row.responsible_org_detail?.name ||
                            "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {fmtSum(row.damage_amount || 0)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {culprits.length > 0 ? (
                            <span className="tabular-nums">
                              {recovered}/{culprits.length}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="font-medium">
                            {row.stage_display || row.stage}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default SrivPaymentDrilldownModal;
