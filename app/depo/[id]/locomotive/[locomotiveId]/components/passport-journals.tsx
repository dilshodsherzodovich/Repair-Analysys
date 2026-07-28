"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import { ClipboardList, FileText, Zap } from "lucide-react";
import {
  SectionCard,
  EmptyBlock,
  LoadingBlock,
  fmtDate,
} from "./passport-shared";
import { useRevisionJournal } from "@/api/hooks/use-revision-journal";
import { useOrders } from "@/api/hooks/use-orders";
import { usePantographJournal } from "@/api/hooks/use-pantograph";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Bordered table primitives — every cell is boxed so columns never merge     */
/* -------------------------------------------------------------------------- */

interface Column {
  key: string;
  header: string;
  align?: "left" | "right";
  width?: string; // tailwind width/min-width classes
  wrap?: boolean;
}

function BorderedTable({
  columns,
  children,
}: {
  columns: Column[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/60">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "border-b border-r border-border px-3 py-2.5 font-semibold text-[#0F172B] last:border-r-0",
                  c.align === "right" ? "text-right" : "text-left",
                  c.width
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({
  columns,
  cells,
}: {
  columns: Column[];
  cells: Record<string, ReactNode>;
}) {
  return (
    <tr className="even:bg-muted/20">
      {columns.map((c) => (
        <td
          key={c.key}
          className={cn(
            "border-b border-r border-border px-3 py-2.5 align-top text-[#334155] last:border-r-0",
            c.align === "right" ? "text-right tabular-nums" : "text-left",
            c.wrap ? "whitespace-normal break-words" : "whitespace-nowrap",
            c.width
          )}
        >
          {cells[c.key] ?? "—"}
        </td>
      ))}
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/*  MPR journal (orders) — filtered to this locomotive                         */
/* -------------------------------------------------------------------------- */

function MprJournalSection({ locomotiveId }: { locomotiveId: number }) {
  const t = useTranslations("locomotivePassport.journals");
  const { data, isLoading } = useOrders({ locomotive: locomotiveId });
  const rows = (data?.results ?? []).slice(0, 10);

  const mprColumns: Column[] = [
    { key: "date", header: t("columns.date"), width: "w-28" },
    { key: "train", header: t("columns.train"), width: "w-24" },
    { key: "person", header: t("columns.person"), width: "w-40", wrap: true },
    { key: "damage", header: t("columns.damage"), align: "right", width: "w-32" },
    { key: "desc", header: t("columns.desc"), width: "min-w-[320px]", wrap: true },
  ];

  return (
    <SectionCard
      title={t("mprTitle")}
      description={t("mprDescription")}
      icon={FileText}
      loading={isLoading}
    >
      {isLoading && !data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyBlock icon={FileText} message={t("empty")} />
      ) : (
        <BorderedTable columns={mprColumns}>
          {rows.map((r) => (
            <Row
              key={r.id}
              columns={mprColumns}
              cells={{
                date: fmtDate(r.date),
                train: r.train_number || "—",
                person: r.responsible_person || "—",
                damage: r.damage_amount || "—",
                desc: r.case_description || "—",
              }}
            />
          ))}
        </BorderedTable>
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pantograph journal — filtered to this locomotive                           */
/* -------------------------------------------------------------------------- */

function PantographJournalSection({ locomotiveId }: { locomotiveId: number }) {
  const t = useTranslations("locomotivePassport.journals");
  const { data, isLoading } = usePantographJournal({ locomotive: locomotiveId });
  const rows = (data?.results ?? []).slice(0, 10);

  const pantographColumns: Column[] = [
    { key: "date", header: t("columns.date"), width: "w-28" },
    { key: "section", header: t("columns.section"), width: "min-w-[220px]", wrap: true },
    { key: "damage", header: t("columns.damage"), align: "right", width: "w-32" },
    { key: "desc", header: t("columns.desc"), width: "min-w-[320px]", wrap: true },
  ];

  return (
    <SectionCard
      title={t("pantographTitle")}
      description={t("pantographDescription")}
      icon={Zap}
      loading={isLoading}
    >
      {isLoading && !data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyBlock icon={Zap} message={t("empty")} />
      ) : (
        <BorderedTable columns={pantographColumns}>
          {rows.map((r) => (
            <Row
              key={r.id}
              columns={pantographColumns}
              cells={{
                date: fmtDate(r.date),
                section: r.section || "—",
                damage: r.damage || "—",
                desc: r.description || "—",
              }}
            />
          ))}
        </BorderedTable>
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Revision journal — scoped to depot (no per-locomotive filter yet)          */
/* -------------------------------------------------------------------------- */

function RevisionJournalSection({ locomotiveId }: { locomotiveId: number }) {
  const t = useTranslations("locomotivePassport.journals");
  const { data, isLoading } = useRevisionJournal({ locomotive: locomotiveId });
  const rows = (data?.results ?? []).slice(0, 10);

  const revisionColumns: Column[] = [
    { key: "date", header: t("columns.date"), width: "w-28" },
    { key: "code", header: t("columns.code"), width: "w-28" },
    { key: "loco", header: t("columns.locomotive"), width: "w-24" },
    { key: "driver", header: t("columns.driver"), width: "w-52", wrap: true },
    { key: "issue", header: t("columns.issue"), width: "min-w-[280px]", wrap: true },
    { key: "status", header: t("columns.status"), width: "w-32" },
  ];

  return (
    <SectionCard
      title={t("revisionTitle")}
      description={t("revisionDescription")}
      icon={ClipboardList}
      loading={isLoading}
    >
      {isLoading && !data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyBlock icon={ClipboardList} message={t("empty")} />
      ) : (
        <BorderedTable columns={revisionColumns}>
          {rows.map((r) => (
            <Row
              key={r.id}
              columns={revisionColumns}
              cells={{
                date: fmtDate(r.date),
                code: r.code || "—",
                loco: r.locomotive_info?.name ?? "—",
                driver: r.train_driver || "—",
                issue: r.issue || "—",
                status: r.table_number ? (
                  <Badge variant="success">{t("done")}</Badge>
                ) : (
                  <Badge variant="destructive">{t("notDone")}</Badge>
                ),
              }}
            />
          ))}
        </BorderedTable>
      )}
    </SectionCard>
  );
}

export function PassportJournals({
  locomotiveId,
}: {
  locomotiveId: number;
}) {
  return (
    <div className="space-y-6">
      <RevisionJournalSection locomotiveId={locomotiveId} />
      <MprJournalSection locomotiveId={locomotiveId} />
      <PantographJournalSection locomotiveId={locomotiveId} />
    </div>
  );
}
