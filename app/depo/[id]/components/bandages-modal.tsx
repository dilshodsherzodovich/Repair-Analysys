"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/modal";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Skeleton } from "@/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { toast } from "@/ui/use-toast";
import { cn } from "@/lib/utils";
import { useBandages, useUpdateBandage } from "@/api/hooks/use-bandages";
import { Bandage, UpdateBandagePayload } from "@/api/types/bandage";

interface BandagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  locomotiveId: number;
  locomotiveName: string;
  locomotiveModel: string;
  /** Turns the left/right cells into inputs. */
  canEdit?: boolean;
}

type Side = "left" | "right";
const SIDES: Side[] = ["left", "right"];

/** Edited input text per row; a side missing here shows the loaded value. */
type Drafts = Record<number, Partial<Record<Side, string>>>;
/** 400 messages per row, keyed by field name like the API returns them. */
type RowErrors = Record<number, Partial<Record<Side | "detail", string>>>;

// null means "no value" — show a dash, never 0
const formatValue = (value: number | null) =>
  value === null || value === undefined ? "—" : value.toFixed(1);

const toInputValue = (value: number | null) =>
  value === null || value === undefined ? "" : String(value);

// An emptied input clears the value
const toNumberOrNull = (value: string) =>
  value.trim() === "" ? null : Number(value);

const firstMessage = (value: unknown) =>
  Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : undefined;

function BandagesTable({
  rows,
  canEdit,
  drafts,
  errors,
  disabled,
  onChange,
}: {
  rows: Bandage[];
  canEdit: boolean;
  drafts: Drafts;
  errors: RowErrors;
  disabled: boolean;
  onChange: (id: number, side: Side, value: string) => void;
}) {
  const t = useTranslations("BandagesModal");

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#E5ECF8]">
      <table className="w-full text-sm">
        <thead className="bg-[#F8FBFF] text-[#475569]">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold">{t("wheel_pair")}</th>
            <th className="px-4 py-2.5 text-center font-semibold">{t("left")}</th>
            <th className="px-4 py-2.5 text-center font-semibold">{t("right")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#E5ECF8] text-[#0F172B] align-top">
              <td className="px-4 py-2.5 font-medium">
                {row.component_name}
                {errors[row.id]?.detail && (
                  <p className="mt-1 text-xs font-normal text-red-600">
                    {errors[row.id]?.detail}
                  </p>
                )}
              </td>
              {SIDES.map((side) => (
                <td key={side} className="px-4 py-2.5 text-center">
                  {canEdit ? (
                    <>
                      <Input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        value={drafts[row.id]?.[side] ?? toInputValue(row[side])}
                        onChange={(e) => onChange(row.id, side, e.target.value)}
                        disabled={disabled}
                        placeholder="—"
                        aria-label={`${row.component_name} ${t(side)}`}
                        className={cn(
                          "mx-auto h-8 max-w-[120px] text-center",
                          errors[row.id]?.[side] && "border-red-500"
                        )}
                      />
                      {errors[row.id]?.[side] && (
                        <p className="mt-1 text-xs text-red-600">{errors[row.id]?.[side]}</p>
                      )}
                    </>
                  ) : (
                    formatValue(row[side])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Bandage (wheel tyre) thickness per KP, one tab per section. */
export function BandagesModal({
  isOpen,
  onClose,
  locomotiveId,
  locomotiveName,
  locomotiveModel,
  canEdit = false,
}: BandagesModalProps) {
  const t = useTranslations("BandagesModal");

  const { data, isLoading, error } = useBandages(
    { locomotive: locomotiveId },
    isOpen
  );
  const { mutateAsync: updateBandage } = useUpdateBandage();

  const [drafts, setDrafts] = useState<Drafts>({});
  const [errors, setErrors] = useState<RowErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Backend already sorts by component name; keep that order inside each section
  const sections = useMemo(() => {
    const groups = new Map<string, { label: string; rows: Bandage[] }>();
    (data ?? []).forEach((row) => {
      const key = String(row.section ?? "none");
      if (!groups.has(key)) {
        groups.set(key, { label: row.section_name ?? t("no_section"), rows: [] });
      }
      groups.get(key)!.rows.push(row);
    });
    return Array.from(groups.entries())
      .map(([key, group]) => ({ key, ...group }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data, t]);

  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab((prev) =>
      sections.some((section) => section.key === prev)
        ? prev
        : sections[0]?.key ?? ""
    );
  }, [isOpen, sections]);

  const handleChange = (id: number, side: Side, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [side]: value } }));
    setErrors((prev) => {
      if (!prev[id]?.[side] && !prev[id]?.detail) return prev;
      const { [side]: _removed, detail: _detail, ...rest } = prev[id];
      return { ...prev, [id]: rest };
    });
  };

  // Only the sides whose value actually differs from the loaded one
  const changes = useMemo(() => {
    const result: { row: Bandage; payload: UpdateBandagePayload }[] = [];
    (data ?? []).forEach((row) => {
      const draft = drafts[row.id];
      if (!draft) return;
      const payload: UpdateBandagePayload = {};
      SIDES.forEach((side) => {
        if (draft[side] === undefined) return;
        const next = toNumberOrNull(draft[side]!);
        if (next !== row[side]) payload[side] = next;
      });
      if (Object.keys(payload).length) result.push({ row, payload });
    });
    return result;
  }, [data, drafts]);

  const handleSave = async () => {
    if (!changes.length) {
      toast({ title: t("no_changes") });
      return;
    }

    // Catch non-numeric input before it reaches the API as NaN
    const localErrors: RowErrors = {};
    changes.forEach(({ row, payload }) => {
      SIDES.forEach((side) => {
        if (Number.isNaN(payload[side])) {
          localErrors[row.id] = { ...localErrors[row.id], [side]: t("error_save") };
        }
      });
    });
    if (Object.keys(localErrors).length) {
      setErrors(localErrors);
      return;
    }

    setIsSaving(true);
    const results = await Promise.allSettled(
      changes.map(({ row, payload }) => updateBandage({ id: row.id, payload }))
    );
    setIsSaving(false);

    const nextErrors: RowErrors = {};
    const savedIds: number[] = [];
    results.forEach((result, index) => {
      const { row } = changes[index];
      if (result.status === "fulfilled") {
        savedIds.push(row.id);
        return;
      }
      const body = (result.reason as any)?.response?.data;
      nextErrors[row.id] = {
        left: firstMessage(body?.left),
        right: firstMessage(body?.right),
        detail:
          body?.left || body?.right
            ? undefined
            : firstMessage(body?.detail) || t("error_save"),
      };
    });

    // Saved rows fall back to the refetched values; failed ones keep their edits
    setDrafts((prev) => {
      const next = { ...prev };
      savedIds.forEach((id) => delete next[id]);
      return next;
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast({ variant: "destructive", title: t("error_save") });
    } else {
      toast({ title: t("success_updated") });
    }
  };

  const handleClose = () => {
    setDrafts({});
    setErrors({});
    onClose();
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="space-y-2 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(error as any)?.response?.data?.detail || t("error")}
        </div>
      );
    }

    if (!sections.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {t("not_found")}
        </div>
      );
    }

    const renderTable = (rows: Bandage[]) => (
      <BandagesTable
        rows={rows}
        canEdit={canEdit}
        drafts={drafts}
        errors={errors}
        disabled={isSaving}
        onChange={handleChange}
      />
    );

    if (sections.length === 1) {
      return renderTable(sections[0].rows);
    }

    return (
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex w-full flex-col"
      >
        <TabsList className="inline-flex w-fit flex-wrap gap-1 rounded-lg border-0 bg-[#F1F5F9] p-1">
          {sections.map((section) => (
            <TabsTrigger key={section.key} value={section.key} className="px-6">
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.key} value={section.key}>
            {renderTable(section.rows)}
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  const showSave = canEdit && !isLoading && !error && sections.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0F172B]">
            {t("title")} - {locomotiveName} ({locomotiveModel})
          </DialogTitle>
        </DialogHeader>

        {renderBody()}

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            {t("close")}
          </Button>
          {showSave && (
            <Button onClick={handleSave} disabled={isSaving || !changes.length}>
              {isSaving ? t("saving") : t("save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
