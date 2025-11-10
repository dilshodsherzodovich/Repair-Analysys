"use client";

import { useEffect, useState } from "react";
import { OrganizationTable } from "@/components/organizations/organization-table";
import { OrganizationModal } from "@/components/organizations/organization-modal";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import {
  useCreateOrganization,
  useDeleteOrganization,
  useEditOrganization,
  useOrganizations,
} from "@/api/hooks/use-organizations";
import {
  Organization,
  OrganizationCreateParams,
} from "@/api/types/organizations";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/querykey";
import { useSnackbar } from "@/providers/snackbar-provider";
import { ErrorCard } from "@/ui/error-card";
import { canAccessSection } from "@/lib/permissions";
import { redirect, useSearchParams } from "next/navigation";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

export default function OrganizationsPage() {
  const { updateQuery } = useFilterParams();
  const searchParams = useSearchParams();
  const { q, page } = Object.fromEntries(searchParams.entries());

  const user = JSON.parse(localStorage.getItem("user")!);

  if (!user || !canAccessSection(user, "organizations")) {
    redirect("/");
  }

  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingOrganization, setEditingOrganization] = useState<
    Organization | undefined
  >();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    organizationId?: string;
    isBulk?: boolean;
  }>({ isOpen: false });
  const {
    data: organizationsList,
    isPending,
    isFetching,
    error,
  } = useOrganizations({ page: +page, search: q });

  const { mutate: createOrganization, isPending: isCreatingOrg } =
    useCreateOrganization();
  const { mutate: editOrganization, isPending: isEditingOrg } =
    useEditOrganization();
  const { mutate: deleteOrganization, isPending: isDeletingOrg } =
    useDeleteOrganization();

  const { showSuccess, showError } = useSnackbar();

  useEffect(() => {
    if (!page) {
      updateQuery({ page: "1" });
    }
  }, [page]);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingOrganization(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (organization: Organization) => {
    setModalMode("edit");
    setEditingOrganization(organization);
    setIsModalOpen(true);
  };

  const handleSaveOrganization = (
    organizationData: OrganizationCreateParams
  ) => {
    if (modalMode === "create") {
      createOrganization(organizationData, {
        onSuccess: () => {
          showSuccess("Tashkilot muvaffaqiyatli qo'shildi!");
        },
        onError: (error) => {
          showError(`Xatolik yuz berdi: ${error.message}`);
        },
        onSettled: () => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({
            queryKey: [queryKeys.organizations.list],
          });
        },
      });
    } else if (editingOrganization) {
      editOrganization(
        { id: editingOrganization.id, ...organizationData },
        {
          onSuccess: () => {
            showSuccess("Tashkilot ma'lumotlari muvaffaqiyatli tahrirlandi!");
          },
          onError: (error) => {
            showError(`Xatolik yuz berdi: ${error.message}`);
          },
          onSettled: () => {
            setIsModalOpen(false);
            setEditingOrganization(undefined);
            queryClient.invalidateQueries({
              queryKey: [queryKeys.organizations.list],
            });
          },
        }
      );
    }
    setSelectedIds([]);
  };

  const handelOpenDeleteModal = (organizationId: string) => {
    setDeleteConfirmation({
      isOpen: true,
      organizationId,
      isBulk: false,
    });
  };

  const handleBulkDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setDeleteConfirmation({
      isOpen: true,
      isBulk: true,
    });
  };

  const handleDelete = () => {
    if (deleteConfirmation.isBulk) {
      showError("Ushbu funksiya tez orada qo'shiladi!");
    } else if (deleteConfirmation.organizationId) {
      deleteOrganization(deleteConfirmation.organizationId, {
        onSuccess: () => {
          showSuccess("Tashkilot muvaffaqiyatli o'chirildi!");
        },
        onError: (error) => {
          showError(`Xatolik yuz berdi: ${error.message}`);
        },
        onSettled: () => {
          setDeleteConfirmation({ isOpen: false });
          queryClient.invalidateQueries({
            queryKey: [queryKeys.organizations.list],
          });
        },
      });
    }
  };

  const handlePageChange = (page: number) => {
    updateQuery({ page: page.toString() });
    setSelectedIds([]); // Clear selection when changing pages
  };

  if (error) {
    return (
      <ErrorCard
        variant="error"
        title="Xatolik yuz berdi"
        message={
          (error as any)?.response?.data?.detail ||
          (error as any)?.message ||
          "Tashkilotlar ma'lumotlarini yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
        }
        showRetry={false}
        backHref="/"
        backLabel="Bosh sahifaga qaytish"
        retryLabel="Qayta yuklash"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center space-x-2 text-sm text-[#6b7280] mb-2">
            <span>Asosiy</span>
            <span>›</span>
            <span className="text-[#1f2937]">Tashkilotlar</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#1f2937]">Tashkilotlar</h1>
        </div>
      </div>

      <OrganizationTable
        organizations={organizationsList!}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onEdit={handleOpenEditModal}
        onDelete={handelOpenDeleteModal}
        onBulkDelete={handleBulkDelete}
        onCreateNew={handleOpenCreateModal}
        isLoading={isPending}
        totalPages={organizationsList?.count || 1}
        currentPage={+page}
        onPageChange={handlePageChange}
        totalItems={organizationsList?.count || 0}
      />

      <OrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOrganization}
        organization={editingOrganization}
        mode={modalMode}
        isDoingAction={isCreatingOrg || isEditingOrg}
      />

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false })}
        onConfirm={handleDelete}
        title={
          deleteConfirmation.isBulk
            ? "Tashkilotlarni o'chirish"
            : "Tashkilotni o'chirish"
        }
        message={
          deleteConfirmation.isBulk
            ? `Haqiqatan ham ${selectedIds.length} ta tanlangan tashkilotni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`
            : "Haqiqatan ham bu tashkilotni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
        }
        isDoingAction={isDeletingOrg}
      />
    </div>
  );
}
