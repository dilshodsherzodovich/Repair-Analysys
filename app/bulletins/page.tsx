"use client";

import { useEffect, useState } from "react";
import { BulletinTable } from "@/components/bulletins/bulletin-table";
import { BulletinModal } from "@/components/bulletins/bulletin-modal";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import {
  useBulletin,
  useCreateBulletin,
  useUpdateBulletin,
  useDeleteBulletin,
} from "@/api/hooks/use-bulletin";
import { useOrganizations } from "@/api/hooks/use-organizations";
import {
  Bulletin,
  BulletinCreateBody,
  BulletinDeadline,
  BulletinColumn,
} from "@/api/types/bulleten";
import { useSnackbar } from "@/providers/snackbar-provider";
import { ErrorCard } from "@/ui/error-card";
import { getPageCount } from "@/lib/utils";
import { canAccessSection } from "@/lib/permissions";
import { redirect, useSearchParams } from "next/navigation";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

export default function BulletinsPage() {
  const searchParams = useSearchParams();
  const { updateQuery } = useFilterParams();

  const { q, journal_type, org, fill_type, page } = Object.fromEntries(
    searchParams.entries()
  );

  const user = JSON.parse(localStorage.getItem("user")!);

  if (!user || !canAccessSection(user, "bulletins")) {
    redirect("/");
  }

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedBulletin, setSelectedBulletin] = useState<
    Bulletin | undefined
  >(undefined);
  const [bulletinToDelete, setBulletinToDelete] = useState<Bulletin | null>(
    null
  );

  // Pagination state
  const pageSize = 10;

  // API calls
  const {
    data: bulletins,
    isPending,
    isError,
  } = useBulletin({
    page: +page,
    search: q,
    type_of_journal: journal_type,
    organization: org,
  });
  const { mutate: createBulletin, isPending: isCreating } = useCreateBulletin();
  const { mutate: updateBulletin, isPending: isUpdating } = useUpdateBulletin();
  const { mutate: deleteBulletin, isPending: isDeleting } = useDeleteBulletin();

  const { showSuccess, showError } = useSnackbar();

  // Calculate pagination
  const totalPages = getPageCount(bulletins?.count || 0, pageSize) || 1;

  useEffect(() => {
    if (!page) {
      updateQuery({ page: "1" });
    }
  }, [page]);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const handleEdit = (bulletin: Bulletin) => {
    setSelectedBulletin(bulletin);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = (bulletin: Bulletin) => {
    setBulletinToDelete(bulletin);
    setShowDeleteConfirmation(true);
  };

  const handleBulkDelete = (ids: string[]) => {
    setShowDeleteConfirmation(true);
  };

  const handleBulkDeleteConfirm = (ids: string[]) => {
    // Delete each bulletin individually since the API doesn't support bulk delete
    ids.forEach((id) => deleteBulletin(id));
    setSelectedIds([]);
  };

  const handleCreateNew = () => {
    setSelectedBulletin(undefined);
    setModalMode("create");
    setShowModal(true);
  };

  const handleModalSubmit = (data: BulletinCreateBody) => {
    if (modalMode === "create") {
      createBulletin(data, {
        onSuccess: () => {
          setShowModal(false);
          showSuccess("Byulleten muvaffaqiyatli yaratildi");
        },
        onError: () => {
          showError("Byulleten yaratishda xatolik yuz berdi");
        },
      });
    } else if (modalMode === "edit" && selectedBulletin) {
      updateBulletin(
        { id: selectedBulletin.id, data: data },
        {
          onSuccess: () => {
            setShowModal(false);
            showSuccess("Byulleten muvaffaqiyatli tahrirlandi");
          },
          onError: () => {
            showError("Byulleten tahrirlashda xatolik yuz berdi");
          },
        }
      );
    }
  };

  const confirmDelete = () => {
    if (bulletinToDelete) {
      deleteBulletin(bulletinToDelete.id, {
        onSuccess: () => {
          showSuccess("Byulleten muvaffaqiyatli o'chirildi");
          setShowDeleteConfirmation(false);
          setBulletinToDelete(null);
        },
        onError: () => {
          showError("Byulleten o'chirishda xatolik yuz berdi");
        },
      });
    } else if (selectedIds.length > 0) {
      handleBulkDeleteConfirm(selectedIds);
      setShowDeleteConfirmation(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setBulletinToDelete(null);
  };

  const handlePageChange = (page: number) => {
    updateQuery({ page: page.toString() });
    setSelectedIds([]); // Clear selection when changing pages
  };

  if (isError) {
    return (
      <ErrorCard
        title="Xatolik"
        message="Byulletenlar yuklanmadi"
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Byulletenlar
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Byulletenlar ro'yxatini boshqarish
          </p>
        </div>
      </div>

      <BulletinTable
        bulletins={bulletins?.results || []}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onCreateNew={handleCreateNew}
        isLoading={isPending}
        isDeleting={isDeleting}
        currentPage={+page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={bulletins?.count || 0}
      />

      <BulletinModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        bulletin={selectedBulletin}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={
          bulletinToDelete
            ? "Byulletenni o'chirish"
            : "Byulletenlarni o'chirish"
        }
        message={
          bulletinToDelete
            ? `"${bulletinToDelete.name}" byulletenni o'chirishni xohlaysizma? Bu amalni qaytarib bo'lmaydi.`
            : `${selectedIds.length} ta byulletenni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.`
        }
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="danger"
        isDoingAction={isDeleting}
      />
    </div>
  );
}
