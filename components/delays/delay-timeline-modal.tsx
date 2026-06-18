"use client";

import { useMemo } from "react";
import { Modal } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  DelayEntry,
  DelayStage,
  DelayTimelineEntry,
} from "@/api/types/delays";

interface DelayTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  delay: DelayEntry | null;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  try {
    const d = new Date(value);
    const date = `${String(d.getDate()).padStart(2, "0")}.${String(
      d.getMonth() + 1
    ).padStart(2, "0")}.${d.getFullYear()}`;
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
    return `${date} ${time}`;
  } catch {
    return value;
  }
}

export function DelayTimelineModal({
  isOpen,
  onClose,
  delay,
}: DelayTimelineModalProps) {
  const t = useTranslations("DelayTimelineModal");
  const tStage = useTranslations("DelaysPage");

  const stageLabel = (stage: DelayStage) => tStage(`stage.${stage}` as any);

  // Prefer backend timeline[]; otherwise derive from known timestamps
  const entries: DelayTimelineEntry[] = useMemo(() => {
    if (!delay) return [];
    if (delay.timeline?.length) return delay.timeline;
    const derived: DelayTimelineEntry[] = [];
    if (delay.created_at)
      derived.push({ stage: "created", at: delay.created_at, by: null });
    if (delay.accepted_at)
      derived.push({
        stage: "accepted",
        at: delay.accepted_at,
        by: delay.accepted_by_name ?? null,
      });
    if (delay.protocol_uploaded_at)
      derived.push({
        stage: "protocol_uploaded",
        at: delay.protocol_uploaded_at,
        by: delay.report_uploaded_by_name ?? null,
      });
    if (delay.classified_at)
      derived.push({
        stage: delay.stage === "not_disruption" ? "not_disruption" : "disruption",
        at: delay.classified_at,
        by: delay.classified_by_name ?? null,
      });
    if (delay.payroll_confirmed_at)
      derived.push({
        stage: "payroll_confirmed",
        at: delay.payroll_confirmed_at,
        by: null,
      });
    if (delay.accountant_confirmed_at)
      derived.push({
        stage: "accountant_confirmed",
        at: delay.accountant_confirmed_at,
        by: null,
      });
    return derived;
  }, [delay]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="md"
      ariaDescribedBy="delay-timeline-modal"
    >
      <div className="mt-2 space-y-4">
        {delay && (
          <p className="text-sm text-muted-foreground">
            {t("subtitle", {
              train: delay.train_number || "-",
              station: delay.station || "-",
            })}
          </p>
        )}

        {entries.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <ol className="relative ml-3 border-l border-border">
            {entries.map((entry, i) => (
              <li key={`${entry.stage}-${i}`} className="mb-5 ml-4">
                <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stageLabel(entry.stage)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(entry.at)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("by")}: {entry.by || t("by_system")}
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
