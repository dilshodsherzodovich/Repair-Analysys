"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageFilters, { FiltersQuery } from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
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
import {
  useGetLocomotiveModels,
  useGetLocomotives,
} from "@/api/hooks/use-locomotives";
import { useUpdateSpecialComponent } from "@/api/hooks/use-special-components";
import { SpecialComponent } from "@/api/types/locomotive";
import { UserData } from "@/api/types/auth";
import {
  canAccessSection,
  canEditOrganization,
  hasPermission,
} from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";
import {
  CellInput,
  EditActions,
  firstMessage,
} from "@/components/locomotive-values/inline-edit";
import { authService } from "@/api/services/auth.service";

/** Edited input text per component id, then per field. */
type Drafts = Record<number, Record<string, string>>;
/** 400 messages per component id, keyed by field name like the API returns them. */
type RowErrors = Record<number, Record<string, string | undefined>>;

// Trailing number of a field ("koren_12" -> 12); unnumbered fields sort last
const getFieldNumber = (fieldName: string): number => {
  const match = fieldName.match(/(\d+)$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
};

const byFieldNumber = (a: string, b: string) =>
  getFieldNumber(a) - getFieldNumber(b) || a.localeCompare(b);

const formatValue = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : String(value);

const toInputValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

// border-separate (not collapse) so the borders stick with the pinned header;
// every cell draws its own right/bottom border
const headClass =
  "py-3 px-3 bg-[#F8FAFC] text-[#475569] font-medium border-r border-b border-[#E2E8F0] whitespace-nowrap";
const cellClass =
  "py-2.5 px-3 border-r border-b border-[#E2E8F0] whitespace-nowrap";

// №, locomotive and section stay pinned on horizontal scroll. Fixed widths so
// each column's left offset is the sum of the widths before it.
const stickyNo = "sticky left-0 w-[48px] min-w-[48px] max-w-[48px]";
const stickyLocomotive =
  "sticky left-[48px] w-[160px] min-w-[160px] max-w-[160px] whitespace-normal break-words";
const stickySection =
  "sticky left-[208px] w-[96px] min-w-[96px] max-w-[96px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]";

interface LocomotiveGroup {
  locomotiveId: number;
  index: number;
  name: string;
  modelName: string;
  components: SpecialComponent[];
}

/**
 * One locomotive's section rows. Drafts live here, not in the page, so typing
 * re-renders only the locomotive being edited; memo keeps the others still
 * when the edited locomotive changes.
 */
const LocomotiveRows = memo(function LocomotiveRows({
  group,
  valueFields,
  canEdit,
  isEditing,
  onEdit,
  onDone,
}: {
  group: LocomotiveGroup;
  valueFields: string[];
  canEdit: boolean;
  isEditing: boolean;
  onEdit: (locomotiveId: number) => void;
  onDone: () => void;
}) {
  const t = useTranslations("CrankshaftPage");
  const tModal = useTranslations("SpecialComponentsModal");
  const { mutateAsync: updateSpecialComponent } = useUpdateSpecialComponent();

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

  const handleChange = (id: number, field: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setErrors((prev) => {
      if (!prev[id]?.[field] && !prev[id]?.detail) return prev;
      const { [field]: _removed, detail: _detail, ...rest } = prev[id];
      return { ...prev, [id]: rest };
    });
  };

  const handleSave = async () => {
    if (isSaving) return;

    // Only the fields whose value actually differs from the loaded one;
    // an emptied input clears the value
    const changes: {
      component: SpecialComponent;
      payload: Record<string, string | null>;
    }[] = [];
    group.components.forEach((component) => {
      const draft = drafts[component.id];
      if (!draft) return;
      const payload: Record<string, string | null> = {};
      Object.entries(draft).forEach(([field, value]) => {
        if (value.trim() === toInputValue(component[field]).trim()) return;
        payload[field] = value.trim() === "" ? null : value.trim();
      });
      if (Object.keys(payload).length) changes.push({ component, payload });
    });

    if (!changes.length) {
      onDone();
      return;
    }

    setIsSaving(true);
    const results = await Promise.allSettled(
      changes.map(({ component, payload }) =>
        updateSpecialComponent({ id: component.id, payload }),
      ),
    );
    setIsSaving(false);

    const nextErrors: RowErrors = {};
    const savedIds: number[] = [];
    results.forEach((result, index) => {
      const { component, payload } = changes[index];
      if (result.status === "fulfilled") {
        savedIds.push(component.id);
        return;
      }
      const body = (result.reason as any)?.response?.data;
      const fieldErrors: Record<string, string | undefined> = {};
      Object.keys(payload).forEach((field) => {
        const message = firstMessage(body?.[field]);
        if (message) fieldErrors[field] = message;
      });
      if (!Object.keys(fieldErrors).length) {
        fieldErrors.detail =
          firstMessage(body?.detail) ||
          firstMessage(body?.message) ||
          t("error_save");
      }
      nextErrors[component.id] = fieldErrors;
    });

    if (!Object.keys(nextErrors).length) {
      onDone();
      toast({ title: t("success_updated") });
      return;
    }

    // Saved sections fall back to the refetched values; failed ones keep their edits
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
      description: Object.values(firstError ?? {}).find(Boolean),
    });
  };

  const fieldLabel = (field: string) =>
    `${field.includes("koren") ? tModal("koren_prefix") : tModal("shatun_prefix")}-${getFieldNumber(field)}`;

  const span = group.components.length;
  let isFirstInput = true;
  // Pinned cells need a solid background or scrolled cells show through
  const stickyBg = isEditing
    ? "bg-[#F0F7FF]"
    : "bg-white group-hover:bg-[#F8FAFC]";

  return (
    <>
      {group.components.map((component, componentIndex) => (
        <TableRow
          key={component.id}
          className={cn(
            "group hover:bg-[#F8FAFC]",
            isEditing && "bg-[#F0F7FF] hover:bg-[#F0F7FF]",
          )}
        >
          {componentIndex === 0 && (
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
            {component.section?.name ??
              `${tModal("section")} ${componentIndex + 1}`}
          </TableCell>
          <TableCell className={`${cellClass} text-[#64748B]`}>
            {formatValue(component.year_of_manufacture)}
          </TableCell>
          <TableCell className={`${cellClass} text-[#64748B]`}>
            {formatValue(component.factory_number)}
          </TableCell>
          {valueFields.map((field) => {
            const editable = isEditing && field in component;
            const autoFocus = editable && isFirstInput;
            if (editable) isFirstInput = false;
            return (
              <TableCell
                key={field}
                className={cn(
                  cellClass,
                  "text-center text-[#0F172B]",
                  editable && "px-1 py-1.5",
                )}
              >
                {editable ? (
                  <CellInput
                    value={
                      drafts[component.id]?.[field] ??
                      toInputValue(component[field])
                    }
                    onChange={(value) =>
                      handleChange(component.id, field, value)
                    }
                    onSave={handleSave}
                    onCancel={cancelEdit}
                    error={
                      errors[component.id]?.[field] ||
                      errors[component.id]?.detail
                    }
                    disabled={isSaving}
                    autoFocus={autoFocus}
                    label={`${component.section?.name ?? ""} ${fieldLabel(field)}`}
                  />
                ) : (
                  formatValue(component[field])
                )}
              </TableCell>
            );
          })}
          {canEdit && componentIndex === 0 && (
            <TableCell
              rowSpan={span}
              className={`${cellClass} text-center align-top border-r-0`}
            >
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
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
});

function CrankshaftPageContent({
  user,
  organizationId,
}: {
  user: UserData;
  organizationId: number;
}) {
  const t = useTranslations("CrankshaftPage");
  const tModal = useTranslations("SpecialComponentsModal");
  const searchParams = useSearchParams();
  const { q, locModel } = Object.fromEntries(searchParams.entries());

  // Editing is limited to the user's own organization
  const canEdit =
    hasPermission(user, "edit_crankshaft") &&
    canEditOrganization(user, organizationId);

  const { data: locomotiveModelsData, isPending: loadingModels } =
    useGetLocomotiveModels({ no_page: true });

  const { data, isPending, isError } = useGetLocomotives(true, undefined, {
    no_page: true,
    locomotive_model: +locModel || undefined,
    search: q || undefined,
    registered_organization: organizationId,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  // Stable so memoized rows don't re-render when the page does
  const handleEdit = useCallback((id: number) => setEditingId(id), []);
  const handleDone = useCallback(() => setEditingId(null), []);

  // Only locomotives that have a crankshaft; one table row per section
  const { groups, korenFields, shatunFields, valueFields } = useMemo(() => {
    const koren = new Set<string>();
    const shatun = new Set<string>();
    const result: LocomotiveGroup[] = [];

    (data?.results ?? []).forEach((locomotive) => {
      if (!locomotive.special_components?.length) return;
      const components = [...locomotive.special_components].sort(
        (a, b) => (a.section?.id ?? 0) - (b.section?.id ?? 0),
      );
      components.forEach((component) => {
        Object.keys(component).forEach((key) => {
          if (key.includes("koren")) koren.add(key);
          else if (key.includes("shatun")) shatun.add(key);
        });
      });
      result.push({
        locomotiveId: locomotive.id,
        index: result.length + 1,
        name: locomotive.name,
        modelName: locomotive.model_name,
        components,
      });
    });

    const korenSorted = Array.from(koren).sort(byFieldNumber);
    const shatunSorted = Array.from(shatun).sort(byFieldNumber);
    return {
      groups: result,
      korenFields: korenSorted,
      shatunFields: shatunSorted,
      valueFields: [...korenSorted, ...shatunSorted],
    };
  }, [data]);

  const pageFilters: FiltersQuery[] = useMemo(
    () => [
      {
        name: "locModel",
        label: t("locModel_label"),
        isSelect: true,
        options: [
          { label: t("all"), value: "" },
          ...(locomotiveModelsData?.results?.map((model) => ({
            label: model?.name,
            value: String(model.id),
          })) || []),
        ],
        placeholder: t("locModel_placeholder"),
        searchable: true,
        clearable: true,
        loading: loadingModels,
      },
    ],
    [t, locomotiveModelsData, loadingModels],
  );

  const columnCount = 5 + valueFields.length + (canEdit ? 1 : 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <PageFilters
        filters={pageFilters}
        hasSearch={true}
        searchPlaceholder={t("search_placeholder")}
      />

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("error_load")}
        </div>
      )}

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
              <TableHead rowSpan={2} className={headClass}>
                {tModal("year_of_manufacture")}
              </TableHead>
              <TableHead rowSpan={2} className={headClass}>
                {tModal("factory_number")}
              </TableHead>
              {korenFields.length > 0 && (
                <TableHead
                  colSpan={korenFields.length}
                  className={`${headClass} text-center`}
                >
                  {tModal("koren_prefix")}
                </TableHead>
              )}
              {shatunFields.length > 0 && (
                <TableHead
                  colSpan={shatunFields.length}
                  className={`${headClass} text-center`}
                >
                  {tModal("shatun_prefix")}
                </TableHead>
              )}
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
              {valueFields.map((field) => (
                <TableHead
                  key={field}
                  className={`${headClass} text-center text-xs`}
                >
                  {getFieldNumber(field) === Number.POSITIVE_INFINITY
                    ? field
                    : getFieldNumber(field)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
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
                  valueFields={valueFields}
                  canEdit={canEdit}
                  isEditing={editingId === group.locomotiveId}
                  onEdit={handleEdit}
                  onDone={handleDone}
                />
              ))
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
}

export default function CrankshaftPage() {
  const params = useParams();
  const organizationId = Number(params.orgId) || undefined;
  const [user, setUser] = useState<UserData | null | undefined>(undefined);

  useEffect(() => {
    try {
      setUser(authService.getUser());
    } catch {
      setUser(null);
    }
  }, []);

  if (user === undefined) return null;
  if (!user || !canAccessSection(user, "depo")) {
    return <UnauthorizedPage />;
  }

  if (!organizationId) return <UnauthorizedPage />;

  // Keyed so switching organizations drops any edit in progress
  return (
    <CrankshaftPageContent
      key={organizationId}
      user={user}
      organizationId={organizationId}
    />
  );
}
