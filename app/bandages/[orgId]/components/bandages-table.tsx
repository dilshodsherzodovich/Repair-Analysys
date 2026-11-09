"use client";

import { memo, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { TableSkeleton } from "@/ui/table-skeleton";
import { toast } from "@/ui/use-toast";
import { cn } from "@/lib/utils";
import { useUpdateBandage } from "@/api/hooks/use-bandages";
import { Bandage, UpdateBandagePayload } from "@/api/types/bandage";
import {
  CellInput,
  EditActions,
  firstMessage,
} from "@/components/locomotive-values/inline-edit";
import { bandageGroupKey } from "../bandage-groups";

type Side = "left" | "right";
const SIDES: Side[] = ["left", "right"];

/** Edited input text per bandage; a side missing here shows the loaded value. */
type Drafts = Record<number, Partial<Record<Side, string>>>;
/** 400 messages per bandage, keyed by field name like the API returns them. */
type RowErrors = Record<number, Partial<Record<Side | "detail", string>>>;

// null means "no value" — show a dash, never 0
const formatValue = (value: number | null) =>
  value === null || value === undefined ? "—" : value.toFixed(1);

const toInputValue = (value: number | null) =>
  value === null || value === undefined ? "" : String(value);

// An emptied input clears the value
const toNumberOrNull = (value: string) =>
  value.trim() === "" ? null : Number(value);

export const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true });

// border-separate (not collapse) so the borders stick with the pinned header;
// every cell draws its own right/bottom border
const headClass =
  "py-3 px-3 bg-[#F8FAFC] text-[#475569] font-medium border-r border-b border-[#E2E8F0] whitespace-nowrap";
const cellClass =
  "py-2.5 px-3 border-r border-b border-[#E2E8F0] whitespace-nowrap";

export interface SectionRow {
  key: string;
  sectionName: string;
  /** Bandage per component name ("KP-1" -> row) */
  byComponent: Record<string, Bandage>;
}

// №, locomotive and section stay pinned on horizontal scroll. Fixed widths so
// each column's left offset is the sum of the widths before it.
const stickyNo = "sticky left-0 w-[48px] min-w-[48px] max-w-[48px]";
const stickyLocomotive =
  "sticky left-[48px] w-[160px] min-w-[160px] max-w-[160px] whitespace-normal break-words";
const stickySection =
  "sticky left-[208px] w-[96px] min-w-[96px] max-w-[96px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]";

export interface LocomotiveGroup {
  locomotiveId: number;
  index: number;
  name: string;
  modelName: string;
  sections: SectionRow[];
  bandages: Bandage[];
}

/**
 * One locomotive's section rows. Drafts live here, not in the page, so typing
 * re-renders only the locomotive being edited; memo keeps the others still
 * when the edited locomotive changes.
 */
const LocomotiveRows = memo(function LocomotiveRows({
  group,
  componentNames,
  canEdit,
  isEditing,
  onEdit,
  onDone,
  activeGroup,
}: {
  group: LocomotiveGroup;
  componentNames: string[];
  canEdit: boolean;
  isEditing: boolean;
  onEdit: (locomotiveId: number) => void;
  onDone: () => void;
  /** Selected stat card: its KPs are highlighted, the rest dimmed. */
  activeGroup: string | null;
}) {
  const t = useTranslations("BandagesPage");
  const tModal = useTranslations("BandagesModal");
  const { mutateAsync: updateBandage } = useUpdateBandage();

  const [drafts, setDrafts] = useState<Drafts>({});
  const [errors, setErrors] = useState<RowErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Leaving edit mode (cancel, save, or editing another locomotive) drops edits
  useEffect(() => {
    if (!isEditing) {
      setDrafts({});
      setErrors({});
    }
  }, [isEditing]);

  const cancelEdit = () => {
    if (!isSaving) onDone();
  };

  const handleChange = (id: number, side: Side, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [side]: value } }));
    setErrors((prev) => {
      if (!prev[id]?.[side] && !prev[id]?.detail) return prev;
      const { [side]: _removed, detail: _detail, ...rest } = prev[id];
      return { ...prev, [id]: rest };
    });
  };

  const handleSave = async () => {
    if (isSaving) return;

    // Only the sides whose value actually differs from the loaded one
    const changes: { row: Bandage; payload: UpdateBandagePayload }[] = [];
    group.bandages.forEach((row) => {
      const draft = drafts[row.id];
      if (!draft) return;
      const payload: UpdateBandagePayload = {};
      SIDES.forEach((side) => {
        if (draft[side] === undefined) return;
        const next = toNumberOrNull(draft[side]!);
        if (next !== row[side]) payload[side] = next;
      });
      if (Object.keys(payload).length) changes.push({ row, payload });
    });

    if (!changes.length) {
      onDone();
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
      changes.map(({ row, payload }) => updateBandage({ id: row.id, payload })),
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

    if (!Object.keys(nextErrors).length) {
      onDone();
      toast({ title: t("success_updated") });
      return;
    }

    // Saved cells fall back to the refetched values; failed ones keep their edits
    setDrafts((prev) => {
      const next = { ...prev };
      savedIds.forEach((id) => delete next[id]);
      return next;
    });
    setErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    toast({
      variant: "destructive",
      title: t("error_save"),
      description: firstError?.left || firstError?.right || firstError?.detail,
    });
  };

  const span = group.sections.length;
  let isFirstInput = true;
  // Pinned cells need a solid background or scrolled cells show through
  const stickyBg = isEditing
    ? "bg-[#F0F7FF]"
    : "bg-white group-hover:bg-[#F8FAFC]";

  return (
    <>
      {group.sections.map((section, sectionIndex) => (
        <TableRow
          key={section.key}
          className={cn(
            "group hover:bg-[#F8FAFC]",
            isEditing && "bg-[#F0F7FF] hover:bg-[#F0F7FF]",
          )}
        >
          {sectionIndex === 0 && (
            <>
              <TableCell
                rowSpan={span}
                className={cn(
                  cellClass,
                  stickyNo,
                  stickyBg,
                  "z-[5] text-[#64748B] align-top",
                )}
              >
                {group.index}
              </TableCell>
              <TableCell
                rowSpan={span}
                className={cn(
                  cellClass,
                  stickyLocomotive,
                  stickyBg,
                  "z-[5] text-[#0F172B] font-medium align-top",
                )}
              >
                {group.name}-{group.modelName}
              </TableCell>
            </>
          )}
          <TableCell
            className={cn(
              cellClass,
              stickySection,
              stickyBg,
              "z-[5] text-[#0F172B]",
            )}
          >
            {section.sectionName}
          </TableCell>
          {componentNames.flatMap((name) =>
            SIDES.map((side) => {
              const bandage = section.byComponent[name];
              const editable = isEditing && !!bandage;
              const autoFocus = editable && isFirstInput;
              if (editable) isFirstInput = false;
              const inActiveGroup =
                !!activeGroup && !!bandage && bandageGroupKey(bandage) === activeGroup;
              return (
                <TableCell
                  key={`${name}-${side}`}
                  className={cn(
                    cellClass,
                    "text-center text-[#0F172B]",
                    editable && "px-1 py-1.5",
                    !editable &&
                      activeGroup &&
                      (inActiveGroup
                        ? "bg-[#EFF6FF] font-semibold text-blue-700"
                        : "text-[#CBD5E1]"),
                  )}
                >
                  {editable ? (
                    <CellInput
                      type="number"
                      value={
                        drafts[bandage.id]?.[side] ?? toInputValue(bandage[side])
                      }
                      onChange={(value) => handleChange(bandage.id, side, value)}
                      onSave={handleSave}
                      onCancel={cancelEdit}
                      error={
                        errors[bandage.id]?.[side] || errors[bandage.id]?.detail
                      }
                      disabled={isSaving}
                      autoFocus={autoFocus}
                      label={`${section.sectionName} ${name} ${tModal(side)}`}
                    />
                  ) : bandage ? (
                    formatValue(bandage[side])
                  ) : (
                    "—"
                  )}
                </TableCell>
              );
            }),
          )}
          {canEdit && sectionIndex === 0 && (
            <TableCell
              rowSpan={span}
              className={`${cellClass} text-center align-top border-r-0`}
            >
              {group.bandages.length > 0 && (
                <EditActions
                  isEditing={isEditing}
                  isSaving={isSaving}
                  onEdit={() => onEdit(group.locomotiveId)}
                  onSave={handleSave}
                  onCancel={cancelEdit}
                  labels={{
                    edit: t("edit"),
                    save: t("save"),
                    cancel: t("cancel"),
                  }}
                />
              )}
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
});

export function BandagesTable({
  groups,
  componentNames,
  canEdit,
  isLoading,
  editingId,
  onEdit,
  onDone,
  activeGroup,
}: {
  groups: LocomotiveGroup[];
  componentNames: string[];
  canEdit: boolean;
  isLoading?: boolean;
  editingId: number | null;
  onEdit: (locomotiveId: number) => void;
  onDone: () => void;
  activeGroup: string | null;
}) {
  const t = useTranslations("BandagesPage");
  const tModal = useTranslations("BandagesModal");

  const columnCount = 3 + componentNames.length * 2 + (canEdit ? 1 : 0);

  return (
    <div className="rounded-lg border border-[#CAD5E2] overflow-auto max-h-[75vh] bg-white">
      <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
        {/* Header stays pinned while the rows scroll inside the box */}
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead rowSpan={2} className={`${headClass} ${stickyNo} z-20`}>
              {t("columns.no")}
            </TableHead>
            <TableHead
              rowSpan={2}
              className={`${headClass} ${stickyLocomotive} z-20`}
            >
              {t("columns.locomotive")}
            </TableHead>
            <TableHead
              rowSpan={2}
              className={`${headClass} ${stickySection} z-20`}
            >
              {t("columns.section")}
            </TableHead>
            {componentNames.map((name) => (
              <TableHead
                key={name}
                colSpan={2}
                className={`${headClass} text-center`}
              >
                {name}
              </TableHead>
            ))}
            {canEdit && (
              <TableHead
                rowSpan={2}
                className={`${headClass} text-center border-r-0`}
              >
                {t("columns.actions")}
              </TableHead>
            )}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            {componentNames.flatMap((name) =>
              SIDES.map((side) => (
                <TableHead
                  key={`${name}-${side}`}
                  className={`${headClass} text-center text-xs`}
                >
                  {tModal(side)}
                </TableHead>
              )),
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableSkeleton
              rows={8}
              columns={Math.max(columnCount, 6)}
              cellClassName="py-3 px-3"
            />
          ) : groups.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="py-8 text-center text-[#64748B]"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : (
            groups.map((group) => (
              <LocomotiveRows
                key={group.locomotiveId}
                group={group}
                componentNames={componentNames}
                canEdit={canEdit}
                isEditing={editingId === group.locomotiveId}
                onEdit={onEdit}
                onDone={onDone}
                activeGroup={activeGroup}
              />
            ))
          )}
        </TableBody>
      </table>
    </div>
  );
}
