"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ClassificatorElementModal } from "@/components/classificator-element/classificator-element-modal";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";
import { ClassificatorTable } from "@/components/classificator-element/classificator-table";
import { useGetClassificatorDetail } from "@/api/hooks/use-classificator-detail";
import { useEditClassificator } from "@/api/hooks/use-classificator";
import { ClassificatorElement } from "@/api/types/classificator";
import { useSnackbar } from "@/providers/snackbar-provider";
import { ErrorCard } from "@/ui/error-card";
import { LoadingCard } from "@/ui/loading-card";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/querykey";

export default function ClassificatorDetailPage() {
  const params = useParams();
  const classificatorId = params.id as string;
  const { showSuccess, showError } = useSnackbar();

  const {
    data: classificatorDetail,

    isPending: isDetailPending,
    error,
  } = useGetClassificatorDetail(classificatorId);

  const { mutate: editClassificator, isPending } = useEditClassificator();
  const queryClient = useQueryClient();

  // Modal states
  const [isElementModalOpen, setIsElementModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedElement, setSelectedElement] = useState<
    ClassificatorElement | undefined
  >();
  const [elementToDelete, setElementToDelete] = useState<string | null>(null);

  const classificatorName = classificatorDetail?.name || "Klassifikator";

  const handleCreateElement = () => {
    setModalMode("create");
    setSelectedElement(undefined);
    setIsElementModalOpen(true);
  };

  const handleEditElement = (element: ClassificatorElement) => {
    setModalMode("edit");
    setSelectedElement(element);
    setIsElementModalOpen(true);
  };

  const handleDeleteElement = (element: ClassificatorElement) => {
    setElementToDelete(element.id);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = (elementIds: string[]) => {
    if (!classificatorDetail) return;

    const updatedElements = classificatorDetail.elements.filter(
      (el) => !elementIds.includes(el.id)
    );

    editClassificator(
      {
        id: classificatorId,
        data: {
          name: classificatorDetail.name,
          elements: updatedElements.map((el) => ({ name: el.name, id: el.id })),
        },
      },
      {
        onSuccess: () => {
          showSuccess("Elementlar muvaffaqiyatli o'chirildi");
          setIsDeleteDialogOpen(false);
        },
        onError: () => {
          showError("Elementlarni o'chirishda xatolik yuz berdi");
        },
      }
    );
  };

  const handleSaveElement = (
    data: Omit<ClassificatorElement, "id"> | Omit<ClassificatorElement, "id">[]
  ) => {
    if (!classificatorDetail) return;

    console.log("Modal mode:", modalMode);
    console.log("Received data:", data);
    console.log("Selected element:", selectedElement);

    let elementsToSend: { id?: string; name: string }[] = [];

    if (modalMode === "create") {
      // For creation, we need to add new elements to existing ones
      const existingElements = classificatorDetail.elements.map((el) => ({
        id: el.id,
        name: el.name,
      }));

      if (Array.isArray(data)) {
        // Bulk creation - add new elements (without id)
        const newElements = data.map((elementData) => ({
          name: elementData.name,
        }));
        elementsToSend = [...existingElements, ...newElements];
      } else {
        // Single element creation - add new element (without id)
        elementsToSend = [...existingElements, { name: data.name }];
      }
    } else if (modalMode === "edit" && selectedElement) {
      // For edit, we need to update the specific element (with id)
      if (!Array.isArray(data)) {
        elementsToSend = classificatorDetail.elements.map(
          (el) =>
            el.id === selectedElement.id
              ? { id: el.id, name: data.name } // Keep existing id for update
              : { id: el.id, name: el.name } // Keep existing id for unchanged elements
        );
      }
    }

    console.log("Elements to send to API:", elementsToSend);

    editClassificator(
      {
        id: classificatorId,
        data: {
          name: classificatorDetail.name,
          elements: elementsToSend,
        },
      },
      {
        onSuccess: (responseData) => {
          console.log("API response:", responseData);

          // Update the cache with the response data
          queryClient.setQueryData(
            [queryKeys.classificators.detail(classificatorId)],
            responseData
          );

          const successMessage =
            modalMode === "create"
              ? Array.isArray(data)
                ? `${data.length} ta element muvaffaqiyatli qo'shildi`
                : "Element muvaffaqiyatli qo'shildi"
              : "Element muvaffaqiyatli tahrirlandi";

          showSuccess(successMessage);
          setIsElementModalOpen(false);
        },
        onError: (error) => {
          console.error("API error:", error);

          const errorMessage =
            modalMode === "create"
              ? "Element(lar)ni qo'shishda xatolik yuz berdi"
              : "Elementni tahrirlashda xatolik yuz berdi";

          showError(errorMessage);
        },
      }
    );
  };

  const confirmDelete = () => {
    if (elementToDelete && classificatorDetail) {
      const updatedElements = classificatorDetail.elements.filter(
        (el) => el.id !== elementToDelete
      );

      editClassificator(
        {
          id: classificatorId,
          data: {
            name: classificatorDetail.name,
            elements: updatedElements.map((el) => ({
              name: el.name,
              id: el.id,
            })),
          },
        },
        {
          onSuccess: () => {
            showSuccess("Element muvaffaqiyatli o'chirildi");
            setElementToDelete(null);
            setIsDeleteDialogOpen(false);
          },
          onError: () => {
            showError("Elementni o'chirishda xatolik yuz berdi");
          },
        }
      );
    }
  };

  if (error) {
    return (
      <ErrorCard
        variant="error"
        title="Xatolik yuz berdi"
        message={
          (error as any)?.response?.data?.detail ||
          (error as any)?.message ||
          "Klassifikator ma'lumotlarini yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
        }
        onRetry={() => window.location.reload()}
        backHref="/classificators"
        backLabel="Orqaga qaytish"
        retryLabel="Qayta yuklash"
      />
    );
  }

  if (isDetailPending) {
    return (
      <LoadingCard
        variant="page"
        breadCrumbs={[
          { label: "Asosiy", href: "/" },
          { label: "Klassifikator", href: "/classificators" },
        ]}
      />
    );
  }

  // Not found state
  if (!classificatorDetail) {
    return (
      <ErrorCard
        variant="not-found"
        title="Klassifikator topilmadi"
        message="So'ralgan klassifikator mavjud emas yoki o'chirilgan bo'lishi mumkin."
        backHref="/classificators"
        backLabel="Klassifikatorlar ro'yxatiga qaytish"
        showRetry={false}
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
            <span>Klassifikator</span>
            <span>›</span>
            <span className="text-[#1f2937]">{classificatorName}</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#1f2937]">
            {classificatorName}
          </h1>
        </div>
      </div>

      <ClassificatorTable
        elements={classificatorDetail.elements}
        onEdit={handleEditElement}
        onDelete={handleDeleteElement}
        onBulkDelete={handleBulkDelete}
        onCreateNew={handleCreateElement}
      />

      <ClassificatorElementModal
        isOpen={isElementModalOpen}
        onClose={() => setIsElementModalOpen(false)}
        onSave={handleSaveElement}
        element={selectedElement}
        mode={modalMode}
        isPending={isPending}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Elementni o'chirish"
        message="Haqiqatan ham bu elementni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
        isDoingAction={isPending}
        isDoingActionText="O'chirilmoqda"
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="danger"
      />
    </div>
  );
}
