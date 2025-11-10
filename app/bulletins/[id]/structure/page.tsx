"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import { BulletinStructureTable } from "@/components/bulletin-structure/bulletin-structure-table";
import { BulletinStructureModal } from "@/components/bulletin-structure/bulletin-structure-modal";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useBulletinDetail, useUpdateBulletin } from "@/api/hooks/use-bulletin";
import { useSnackbar } from "@/providers/snackbar-provider";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/querykey";
import { LoadingCard } from "@/ui/loading-card";
import { Button } from "@/ui/button";
import { useGetClassificators } from "@/api/hooks/use-classificator";
import { canAccessSection } from "@/lib/permissions";
import { redirect } from "next/navigation";

interface BulletinField {
  id: string;
  order: number;
  name: string;
  type: "number" | "text" | "date" | "classificator";
  classificatorId?: string;
  classificatorName?: string;
}

export default function BulletinStructurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = JSON.parse(localStorage.getItem("user")!);

  if (!user || !canAccessSection(user, "bulletin_structure")) {
    redirect("/");
  }

  const queryClient = useQueryClient();
  const { id } = use(params);
  const snackBar = useSnackbar();

  const [fields, setFields] = useState<BulletinField[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedField, setSelectedField] = useState<BulletinField | undefined>(
    undefined
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<BulletinField | null>(
    null
  );

  const { data: classificators } = useGetClassificators();
  const {
    data: bulletinDetail,
    isPending: isPendingBulletinDetail,
    isFetching,
  } = useBulletinDetail(id);
  const { mutate: updateBulletin, isPending: isUpdatingBulletin } =
    useUpdateBulletin();

  useEffect(() => {
    if (bulletinDetail?.columns) {
      setFields(
        bulletinDetail.columns.map((col) => {
          if (col.type === "classificator") {
            return {
              ...col,
              classificatorId: col?.classificator || undefined,
              classificatorName: classificators?.results?.find(
                (classificator) => classificator?.id === col?.classificator
              )?.name,
            };
          }
          return col;
        })
      );
    }
  }, [bulletinDetail?.id, classificators]);

  const requestColumnDetails = useMemo(() => {
    return fields?.map((field) => ({
      name: field.name,
      type:
        field.type === "number"
          ? "integer"
          : field.type === "text"
          ? "string"
          : field.type,
      classificator: field.classificatorId,
      order: field.order,
    }));
  }, [fields]);

  const handleReorderFields = (reorderedFields: BulletinField[]) => {
    setFields(reorderedFields);
  };

  const handleEditField = (field: BulletinField) => {
    setSelectedField(field);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDeleteField = (field: BulletinField) => {
    setFieldToDelete(field);
    setShowDeleteConfirmation(true);
  };

  const handleCreateNew = () => {
    setSelectedField(undefined);
    setModalMode("create");
    setShowModal(true);
  };

  const handleModalSubmit = (data: any) => {
    if (modalMode === "create") {
      const newField: BulletinField = {
        id: Date.now().toString(),
        order: fields.length + 1,
        name: data.name,
        type: data.type,
        classificatorId:
          data.type === "classificator" ? data.classificatorId : undefined,
        classificatorName:
          data.type === "classificator" ? data.classificatorName : undefined,
      };
      setFields([...fields, newField]);
    } else if (modalMode === "edit" && selectedField) {
      const updatedFields = fields.map((f) =>
        f.id === selectedField.id
          ? {
              ...f,
              name: data.name,
              type: data.type,
              classificatorId:
                data.type === "classificator"
                  ? data.classificatorId
                  : undefined,
              classificatorName:
                data.type === "classificator"
                  ? data.classificatorName
                  : undefined,
            }
          : f
      );
      setFields(updatedFields);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (fieldToDelete) {
      setFields(fields.filter((f) => f.id !== fieldToDelete.id));
      setFieldToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };

  const cancelDelete = () => {
    setFieldToDelete(null);
    setShowDeleteConfirmation(false);
  };

  const handleSaveStructure = () => {
    updateBulletin(
      { id, data: { columns: requestColumnDetails } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData([queryKeys.bulletins.detail(id)], data);
          queryClient.invalidateQueries({
            queryKey: [queryKeys.bulletins.list],
          });
          snackBar.showSuccess("Bulletin muvaffaqaiyatli tahrirlandi");
        },
        onError: (error) => {
          snackBar.showError("Xatolik yuz berdi:", error.message);
        },
      }
    );
  };

  if (isPendingBulletinDetail) {
    return (
      <LoadingCard
        breadCrumbs={[{ label: "Blyutenlar", href: "/bulletins" }]}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-[var(--muted-foreground)]">
        <Link
          href="/bulletins"
          className="hover:text-[var(--foreground)] transition-colors"
        >
          Byulletenlar
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href={`/bulletins/${id}`}
          className="hover:text-[var(--foreground)] transition-colors"
        >
          {bulletinDetail?.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[var(--foreground)]">Struktura</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/bulletins`}
            className="p-2 hover:bg-[var(--muted)]/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--muted-foreground)]" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Byulleten struktura
            </h1>
            <p className="text-[var(--muted-foreground)] mt-2">
              {bulletinDetail?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-[var(--muted-foreground)]">
            {fields?.length} ta maydon
          </div>
          <Button
            onClick={handleSaveStructure}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-6 py-2 rounded-lg font-medium"
            disabled={isUpdatingBulletin}
          >
            {isUpdatingBulletin ? "Yuklanmoqda" : "Saqlash"}
          </Button>
        </div>
      </div>

      <BulletinStructureTable
        fields={fields}
        onReorder={handleReorderFields}
        onEdit={handleEditField}
        onDelete={handleDeleteField}
        onCreateNew={handleCreateNew}
      />

      <BulletinStructureModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        field={selectedField}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Maydonni o'chirish"
        message={`"${fieldToDelete?.name}" maydonni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="danger"
      />
    </div>
  );
}
