"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Modal } from "@/ui/modal";
import { Badge } from "@/ui/badge";
import { useSrivPaymentReportDetails } from "@/api/hooks/use-delays";
import type { SrivPaymentReportDetailsParams } from "@/api/types/delays";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

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
          <div className="py-16 text-center text-sm text-foreground-subtle">
            {t("empty")}
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("count_n", { n: data?.count ?? results.length })}
            </p>
            <Table frame maxHeight="60vh" className=" min-w-[720px]">
              <TableHeader className="sticky top-0 z-10 bg-surface-muted">
                <TableRow className="text-left">
                  <TableHead>{t("dd_date")}</TableHead>
                  <TableHead>{t("dd_train")}</TableHead>
                  <TableHead>
                    {t("dd_station")}
                  </TableHead>
                  <TableHead>{t("depo")}</TableHead>
                  <TableHead className="text-right">
                    {t("dd_damage")}
                  </TableHead>
                  <TableHead>
                    {t("dd_culprits")}
                  </TableHead>
                  <TableHead>{t("dd_stage")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row) => {
                  const culprits = row.culprits ?? [];
                  const recovered = culprits.filter((c) => c.recovered).length;
                  return (
                    <TableRow
                      key={row.id}
                      className="last:border-0"
                    >
                      <TableCell className="whitespace-nowrap text-foreground-secondary">
                        {fmtDate(row.incident_date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.train_number || "-"}
                      </TableCell>
                      <TableCell className="text-foreground-secondary">
                        {row.station || "-"}
                      </TableCell>
                      <TableCell className="text-foreground-secondary">
                        {row.responsible_org_name ||
                          row.responsible_org_detail?.name ||
                          "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {fmtSum(row.damage_amount || 0)}
                      </TableCell>
                      <TableCell className="text-foreground-secondary">
                        {culprits.length > 0 ? (
                          <span className="tabular-nums">
                            {recovered}/{culprits.length}
                          </span>
                        ) : (
                          <span className="text-foreground-subtle">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {row.stage_display || row.stage}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </Modal>
  );
}

export default SrivPaymentDrilldownModal;
