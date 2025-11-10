"use client";

import { useState, useEffect } from "react";
import { redirect, useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Badge } from "@/ui/badge";
import {
  useBulletinDetail,
  useCreateBulletinFile,
} from "@/api/hooks/use-bulletin";
import {
  useCreateBulletinRow,
  useUpdateBulletinRow,
  useDeleteBulletinRow,
} from "@/api/hooks/use-bulletin";
import {
  BulletinRow,
  BulletinColumn,
  BulletinCreateRow,
  BulletinFile,
  Bulletin,
} from "@/api/types/bulleten";
import { useSnackbar } from "@/providers/snackbar-provider";
import { ErrorCard } from "@/ui/error-card";
import { BulletinDataGrid } from "@/components/bulletins/bulletin-data-grid";

import { LoadingCard } from "@/ui/loading-card";
import { FileUpload } from "@/ui/file-upload";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/querykey";
import { canAccessSection } from "@/lib/permissions";
import { BulletinFileHistory } from "@/components/bulletins/bulletin-file-history";
import { PermissionGuard } from "@/components/permission-guard";
import { BulletinDetailsCard } from "@/components/bulletins/bulletin-details-card";

export default function BulletinDetailPage() {
  const user = JSON.parse(localStorage.getItem("user")!);

  if (!user || !canAccessSection(user, "bulletin_detail")) {
    redirect("/");
  }

  const queryClient = useQueryClient();
  const params = useParams();
  const router = useRouter();
  const bulletinId = params.id as string;

  const [rows, setRows] = useState<BulletinRow[]>([]);
  const [loadingRows, setLoadingRows] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const { data: bulletin, isLoading, isError } = useBulletinDetail(bulletinId);
  const { mutate: createBulletinRow, isPending: isCreatingRow } =
    useCreateBulletinRow();
  const { mutate: updateBulletinRow, isPending: isUpdatingRow } =
    useUpdateBulletinRow();
  const { mutate: deleteBulletinRow, isPending: isDeletingRow } =
    useDeleteBulletinRow();
  const { mutate: createBulletinFile } = useCreateBulletinFile();

  const { showSuccess, showError } = useSnackbar();

  // Initialize rows from bulletin data
  useEffect(() => {
    if (bulletin?.rows) {
      setRows(bulletin.rows);
    }
  }, [bulletin]);

  const handleAddRow = () => {
    const newRow: BulletinRow = {
      id: `temp-${Date.now()}`,
      order: 1,
      values: {},
    };
    setRows([...rows, newRow]);
  };

  const handleUpdateRow = (
    rowId: string,
    column: string,
    value: string | number
  ) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              values: {
                ...row.values,
                [column]: value,
              },
            }
          : row
      )
    );
  };

  const handleDeleteRow = (rowId: string) => {
    // If it's a temp row, just remove it from state
    if (rowId.startsWith("temp-")) {
      setRows((prevRows) => prevRows.filter((row) => row.id !== rowId));
      return;
    }

    // For existing rows, call the delete API
    setLoadingRows((prev) => new Set(prev).add(rowId));

    deleteBulletinRow(rowId, {
      onSuccess: () => {
        showSuccess("Qator muvaffaqiyatli o'chirildi");
        setRows((prevRows) => prevRows.filter((row) => row.id !== rowId));
        setLoadingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
      },
      onError: (error) => {
        showError("Qator o'chirishda xatolik yuz berdi");
        console.error(error);
        setLoadingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
      },
    });
  };

  const handleFileSubmit = (files: File[]) => {
    if (files.length === 0) return;

    setIsUploadingFile(true);

    // Upload the first file (assuming single file upload based on your API)
    createBulletinFile(
      { id: bulletinId, upload_file: files[0] },
      {
        onSuccess: () => {
          showSuccess("Fayl muvaffaqiyatli yuklandi");
          setUploadedFiles([]); // Clear the uploaded files after successful upload
          queryClient.invalidateQueries({
            queryKey: [queryKeys.bulletins.detail(bulletinId)],
          });
          setIsUploadingFile(false);
        },
        onError: (error) => {
          showError(`${(error as any).response.data[0]}`);
          setIsUploadingFile(false);
        },
      }
    );
  };

  const handleSaveRow = (
    rowId: string,
    updatedValues?: Record<string, string | number>
  ) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    // Use updatedValues if provided, otherwise use current row values
    const valuesToUse = updatedValues || row.values;

    // Convert values object to array format for API
    const valuesArray = Object.entries(valuesToUse || {})
      .filter(
        ([column, value]) =>
          column && value !== "" && value !== null && value !== undefined
      )
      .map(([column, value]) => ({
        column,
        value,
      }));

    if (valuesArray.length === 0) {
      showError("Qator bo'sh bo'lmasligi kerak");
      return;
    }

    setLoadingRows((prev) => new Set(prev).add(rowId));

    const requestData: BulletinCreateRow = {
      journal: bulletinId,
      values: valuesArray,
    };

    const isNewRow = rowId.startsWith("temp-");

    if (isNewRow) {
      createBulletinRow(requestData, {
        onSuccess: () => {
          showSuccess("Bulletin qatori muvaffaqiyatli yaratildi");
          // Remove the temp row after successful save
          setRows((prevRows) => prevRows.filter((row) => row.id !== rowId));
          setLoadingRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(rowId);
            return newSet;
          });
        },
        onError: (error) => {
          showError("Bulletin qatori yaratishda xatolik");
          console.error(error);
          setLoadingRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(rowId);
            return newSet;
          });
        },
      });
    } else {
      updateBulletinRow(
        { id: rowId, data: requestData },
        {
          onSuccess: () => {
            showSuccess("Qator muvaffaqiyatli yangilandi");
            setLoadingRows((prev) => {
              const newSet = new Set(prev);
              newSet.delete(rowId);
              return newSet;
            });
          },
          onError: (error) => {
            showError("Qator yangilashda xatolik yuz berdi");
            console.error(error);
            setLoadingRows((prev) => {
              const newSet = new Set(prev);
              newSet.delete(rowId);
              return newSet;
            });
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <LoadingCard
        breadCrumbs={[
          { label: "Asosiy", href: "/" },
          { label: "Blyutenlar", href: "/bulletins" },
        ]}
      />
    );
  }

  if (isError || !bulletin) {
    return <ErrorCard title="Xatolik" message="Bulletin yuklanmadi" />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Orqaga</span>
          </Button>
          <h1 className="text-2xl font-bold">{bulletin.name}</h1>
        </div>
      </div>

      {/* Simple Info */}
      <PermissionGuard permission="view_bulletin_main_info">
        <BulletinDetailsCard bulletin={bulletin} />
      </PermissionGuard>

      {/* Data Grid */}
      <PermissionGuard permission="view_bulletin_table">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Bulletin Ma'lumotlari</h2>
          </div>
          <BulletinDataGrid
            columns={bulletin.columns || []}
            rows={rows}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
            onSaveRow={handleSaveRow}
            onAddRow={handleAddRow}
            loadingRows={loadingRows}
          />
        </Card>
      </PermissionGuard>

      {/* File History */}
      <BulletinFileHistory
        files={bulletin.upload_history || []}
        isLoading={isLoading}
      />
    </div>
  );
}
