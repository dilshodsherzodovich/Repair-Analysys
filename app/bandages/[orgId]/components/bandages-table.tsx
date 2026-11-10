"use client";

import { memo, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from "@/ui/table";
import { TableSkeleton } from "@/ui/table-skeleton";
import { useSnackbar } from "@/providers/snackbar-provider";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useBulkUpdateBandages } from "@/api/hooks/use-bandages";
import { Bandage, UpdateBandagePayload } from "@/api/types/bandage";
import { CellInput, EditActions, firstMessage } from "@/ui/inline-edit";
import { bandageGroupKey, hasSideMismatch } from "../bandage-groups";

import { EmptyState, TableStateRow } from "@/ui/empty-state";
import { Badge } from "@/ui/badge";
type Side = "left" | "right";

/** How long the cells changed by a save stay highlighted. */
const SAVED_HIGHLIGHT_MS = 5000;
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
  "sticky left-[208px] w-[96px] min-w-[96px] max-w-[96px] shadow-pin-start";

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
  const { showSuccess, showError } = useSnackbar();
  const { mutateAsync: bulkUpdateBandages } = useBulkUpdateBandages();

  const [drafts, setDrafts] = useState<Drafts>({});
  const [errors, setErrors] = useState<RowErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  /** Cells ("id-side") changed by the last save, highlighted for a while. */
  const [savedCells, setSavedCells] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!savedCells) return;
    const timer = setTimeout(() => setSavedCells(null), SAVED_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [savedCells]);

  // Editing again ends the highlight
  useEffect(() => {
    if (isEditing) setSavedCells(null);
  }, [isEditing]);

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

    // One request for the whole locomotive; all-or-nothing on the server
    setIsSaving(true);
    try {
      await bulkUpdateBandages(
        changes.map(({ row, payload }) => ({ id: row.id, ...payload })),
      );
      setIsSaving(false);
      setSavedCells(
        new Set(
          changes.flatMap(({ row, payload }) =>
            SIDES.filter((side) => side in payload).map(
              (side) => `${row.id}-${side}`,
            ),
          ),
        ),
      );
      onDone();
      showSuccess(t("success_updated"));
    } catch (error) {
      setIsSaving(false);
      // Nothing was saved, so every edit stays. Per-item errors come back as
      // a list in request order; anything else is one message for the save.
      const body = (error as any)?.response?.data;
      const nextErrors: RowErrors = {};
      if (Array.isArray(body)) {
        body.forEach((itemErrors, index) => {
          const change = changes[index];
          if (!change || !itemErrors || typeof itemErrors !== "object") return;
          const left = firstMessage(itemErrors.left);
          const right = firstMessage(itemErrors.right);
          const detail =
            left || right
              ? undefined
              : firstMessage(itemErrors.detail ?? itemErrors.id);
          if (left || right || detail) {
            nextErrors[change.row.id] = { left, right, detail };
          }
        });
      }
      setErrors(nextErrors);
      const firstError = Object.values(nextErrors)[0];
      showError(t("error_save"), firstError?.left ||
          firstError?.right ||
          firstError?.detail ||
          (!Array.isArray(body) ? firstMessage(body?.detail) : undefined));
    }
  };

  const span = group.sections.length;
  let isFirstInput = true;
  const justSaved = !!savedCells;
  // Pinned cells need a solid background or scrolled cells show through
  const stickyBg = isEditing
    ? "bg-primary-subtle"
    : justSaved
      ? "bg-success-subtle"
      : "bg-background group-hover:bg-surface-muted";

  // Each locomotive is its own <tbody>: its rows highlight together, so the
  // cells that span them (No, locomotive, actions) never look half-hovered
  return (
    <TableBody className="group">
      {group.sections.map((section, sectionIndex) => (
        <TableRow
          key={section.key}
          className={cn(
            "duration-700 hover:bg-transparent group-hover:bg-surface-muted",
            isEditing && "bg-primary-subtle group-hover:bg-primary-subtle",
            justSaved && "bg-success-subtle group-hover:bg-success-subtle",
          )}
        >
          {sectionIndex === 0 && (
            <>
              <TableCell
                rowSpan={span}
                className={cn(
                  stickyNo,
                  stickyBg,
                  "z-[5] text-muted-foreground align-top",
                )}
              >
                {group.index}
              </TableCell>
              <TableCell
                rowSpan={span}
                className={cn(
                  stickyLocomotive,
                  stickyBg,
                  "z-[5] font-medium align-top",
                  justSaved && "border-l-success",
                )}
              >
                {group.name}-{group.modelName}
                {justSaved && (
                  <Badge variant="success" className="mt-1 w-fit">
                    <Check className="h-3 w-3" />
                    {t("just_saved")}
                  </Badge>
                )}
              </TableCell>
            </>
          )}
          <TableCell
            className={cn(
              stickySection,
              stickyBg,
              "z-[5]",
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
              const wasSaved =
                !!bandage && !!savedCells?.has(`${bandage.id}-${side}`);
              const isUneven = !!bandage && hasSideMismatch(bandage);
              return (
                <TableCell
                  key={`${name}-${side}`}
                  className={cn(
                    "text-center duration-700",
                    editable && "",
                    !editable &&
                      activeGroup &&
                      (inActiveGroup
                        ? "bg-primary-subtle font-semibold text-primary-hover"
                        : "text-foreground-subtle"),
                    // Left and right too far apart; shown even outside the picked group
                    !editable &&
                      isUneven &&
                      "bg-destructive-subtle font-semibold text-destructive",
                    // Changed values win over the group highlight while it lasts
                    wasSaved && "bg-success-subtle font-semibold text-success",
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
              // Spanning cells paint their own background: browsers paint a row's
              // background only over that row, so they would look half-highlighted
              className={cn("text-center align-middle", stickyBg)}
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
    </TableBody>
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
    <Table frame maxHeight="75vh" bordered>
        {/* Header stays pinned while the rows scroll inside the box */}
        <TableHeader className="sticky top-0 z-10">
          <TableRow>
            <TableHead rowSpan={2} className={`${stickyNo} z-20`}>
              {t("columns.no")}
            </TableHead>
            <TableHead
              rowSpan={2}
              className={`${stickyLocomotive} z-20`}
            >
              {t("columns.locomotive")}
            </TableHead>
            <TableHead
              rowSpan={2}
              className={`${stickySection} z-20`}
            >
              {t("columns.section")}
            </TableHead>
            {componentNames.map((name) => (
              <TableHead
                key={name}
                colSpan={2}
                className={`text-center`}
              >
                {name}
              </TableHead>
            ))}
            {canEdit && (
              <TableHead
                rowSpan={2}
                className={`text-center`}
              >
                {t("columns.actions")}
              </TableHead>
            )}
          </TableRow>
          <TableRow>
            {componentNames.flatMap((name) =>
              SIDES.map((side) => (
                <TableHead
                  key={`${name}-${side}`}
                  className={`text-center`}
                >
                  {tModal(side)}
                </TableHead>
              )),
            )}
          </TableRow>
        </TableHeader>

        {isLoading || groups.length === 0 ? (
          <TableBody>
            {isLoading ? (
            <TableSkeleton
              rows={8}
              columns={Math.max(columnCount, 6)}
              cellClassName="py-3 px-3"
            />
            ) : (
            <TableStateRow colSpan={columnCount}><EmptyState title={t("empty")} size="compact" /></TableStateRow>
            )}
          </TableBody>
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
      </Table>
  );
}
