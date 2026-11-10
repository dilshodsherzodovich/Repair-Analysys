"use client";

import { Modal, ModalFooter } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Train, MapPin, Users, CircleCheck, CircleDashed, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { DelayEntry } from "@/api/types/delays";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

import { EmptyState, TableStateRow } from "@/ui/empty-state";
import { formatNumber } from "@/lib/format";
interface RecoveryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  delay: DelayEntry | null;
}

function fmt(amount: string | number): string {
  return formatNumber(amount, { fallback: "0" });
}

export function RecoveryInfoModal({
  isOpen,
  onClose,
  delay,
}: RecoveryInfoModalProps) {
  const t = useTranslations("RecoveryInfoModal");

  const culprits = delay?.culprits ?? [];
  const toRecover = culprits.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const recoveredList = culprits.filter((c) => c.recovered);
  const recovered = recoveredList.reduce(
    (s, c) => s + (Number(c.amount) || 0),
    0
  );
  const percent =
    toRecover > 0 ? Math.min(100, Math.round((recovered / toRecover) * 100)) : 0;
  const done = percent >= 100 && toRecover > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="lg"
    >
      <div className="mt-2 space-y-4">
        {delay && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium">
              <Train className="h-3.5 w-3.5 text-muted-foreground" />
              {delay.train_number || "-"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {delay.station || "-"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              {t("people", { rc: recoveredList.length, tc: culprits.length })}
            </span>
          </div>
        )}

        {/* Recovered-sum focus */}
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-background p-3 shadow-sm">
              <div className="text-2xs uppercase tracking-wide text-muted-foreground">
                {t("to_recover")}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {fmt(toRecover)}
              </div>
            </div>
            <div className="rounded-lg bg-background p-3 shadow-sm">
              <div className="flex items-center gap-1 text-2xs uppercase tracking-wide text-success">
                <Wallet className="h-3.5 w-3.5" />
                {t("recovered")}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-success">
                {fmt(recovered)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  done ? "bg-success" : "bg-primary"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("progress", {
                recovered: fmt(recovered),
                total: fmt(toRecover),
                percent,
              })}
            </p>
          </div>
        </div>

        {/* Per-culprit breakdown */}
        <Table frame>
          <TableHeader className="text-muted-foreground">
            <TableRow>
              <TableHead className="text-left">
                {t("columns.full_name")}
              </TableHead>
              <TableHead className="text-right">
                {t("columns.amount")}
              </TableHead>
              <TableHead className="text-left">
                {t("columns.payroll")}
              </TableHead>
              <TableHead className="text-left">
                {t("columns.recovered")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {culprits.length === 0 ? (
              <TableStateRow colSpan={4}><EmptyState title={t("empty")} size="compact" /></TableStateRow>
            ) : (
              culprits.map((c) => (
                <TableRow key={c.id} className="align-top">
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmt(c.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      active={c.payroll_confirmed}
                      yes={t("yes")}
                      no={t("no")}
                      by={
                        c.payroll_confirmed && c.payroll_confirmed_by_name
                          ? t("confirmed_by", {
                              name: c.payroll_confirmed_by_name,
                            })
                          : null
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      active={c.recovered}
                      yes={t("yes")}
                      no={t("no")}
                      by={
                        c.recovered && c.recovered_by_name
                          ? t("recovered_by", { name: c.recovered_by_name })
                          : null
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function StatusPill({
  active,
  yes,
  no,
  by,
}: {
  active: boolean;
  yes: string;
  no: string;
  by: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium",
          active
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground"
        )}
      >
        {active ? (
          <CircleCheck className="h-3 w-3" />
        ) : (
          <CircleDashed className="h-3 w-3" />
        )}
        {active ? yes : no}
      </span>
      {by && (
        <span className="pl-1 text-2xs text-muted-foreground">{by}</span>
      )}
    </div>
  );
}
