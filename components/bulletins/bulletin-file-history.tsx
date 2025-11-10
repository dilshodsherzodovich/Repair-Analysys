"use client";

import { useState } from "react";
import {
  Download,
  File,
  ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { BulletinFile } from "@/api/types/bulleten";
import { TableSkeleton } from "@/ui/table-skeleton";
import { PermissionGuard } from "../permission-guard";
import {
  useCreateBulletinFileStatusHistory,
  useUpdateBulletinFile,
  useCreateBulletinFile,
  useDeleteBulletinFile,
} from "@/api/hooks/use-bulletin";
import { useSnackbar } from "@/providers/snackbar-provider";
import { LoadingButton } from "@/ui/loading-button";
import { BulletinFileUploadModal } from "./bulletin-file-upload-modal";
import { useParams } from "next/navigation";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/querykey";
import { ConfirmationDialog } from "@/ui/confirmation-dialog";

interface BulletinFileHistoryProps {
  files: BulletinFile[];
  isLoading: boolean;
}

// Status mapping to Uzbek labels
const statusLabels: { [key: string]: string } = {
  on_time: "Vaqtida",
  late: "Kechikkan",
  not_submitted: "Yuklanmagan",
};

const getStatusLabel = (status: string): string => {
  return statusLabels[status] || status;
};

const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "on_time":
      return "default";
    case "late":
      return "destructive";
    case "not_submitted":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "on_time":
      return "bg-green-100 text-green-800 border-green-200";
    case "late":
      return "bg-red-100 text-red-800 border-red-200";
    case "not_submitted":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension || "")) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  if (["pdf"].includes(extension || "")) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (["doc", "docx"].includes(extension || "")) {
    return <FileText className="h-5 w-5 text-blue-600" />;
  }
  if (["xls", "xlsx"].includes(extension || "")) {
    return <FileText className="h-5 w-5 text-green-600" />;
  }
  if (["ppt", "pptx"].includes(extension || "")) {
    return <FileText className="h-5 w-5 text-orange-600" />;
  }
  if (["zip", "rar", "7z"].includes(extension || "")) {
    return <File className="h-5 w-5 text-purple-500" />;
  }

  return <File className="h-5 w-5 text-gray-500" />;
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

export function BulletinFileHistory({
  files,
  isLoading,
}: BulletinFileHistoryProps) {
  const { mutate: updateBulletinFile, isPending } = useUpdateBulletinFile();
  const {
    mutate: createBulletinFileStatusHistory,
    isPending: isCreatingBulletinFileStatusHistory,
  } = useCreateBulletinFileStatusHistory();
  const { mutate: createBulletinFile, isPending: isCreatingFile } =
    useCreateBulletinFile();
  const { mutate: deleteBulletinFile, isPending: isDeletingFile } =
    useDeleteBulletinFile();

  const { showSuccess, showError } = useSnackbar();
  const { id: journalId } = useParams();
  const queryClient = useQueryClient();

  // Modal state - simplified to use one modal for both cases
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    fileId?: string;
  }>({ isOpen: false });
  const [selectedFileForEdit, setSelectedFileForEdit] =
    useState<BulletinFile | null>(null);
  const [isNewFileMode, setIsNewFileMode] = useState(false);

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (fileId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const confirmDeleteBulletinFile = () => {
    deleteBulletinFile(
      { fileId: deleteConfirmation.fileId!, journalId: journalId as string },
      {
        onSuccess: () => {
          showSuccess("Fayl muvaffaqiyatli o'chirildi");
          setDeleteConfirmation({ isOpen: false });
        },
        onError: () => {
          showError("Fayl o'chirishda xatolik yuz berdi");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Yuklangan fayllar</h2>
          <p className="text-sm text-gray-600 mt-1">
            Bulletin uchun yuklangan fayllar tarixi
          </p>
        </div>
        <TableSkeleton rows={5} columns={6} />
      </Card>
    );
  }

  const handleGiveAccessToEditBulletinFile = (
    id: string,
    editable: boolean
  ) => {
    updateBulletinFile(
      {
        id,
        journal: journalId as string,
        data: { editable },
      },
      {
        onSuccess: (_, { data }) => {
          showSuccess(
            ` ${
              data.editable
                ? "Tahrirlashga ruxsat berildi"
                : "Tahrirlashga ruxsat bekor qilindi"
            }`
          );
        },
        onError: () => {
          showError("Fayl tahrirlash ruxsat berishda xatolik");
        },
      }
    );
  };

  const handleUpdateBulletinFile = (
    id: string,
    upload_file: File,
    description: string,
    journal_id: string
  ) => {
    createBulletinFileStatusHistory(
      {
        j_upload_history_id: id,
        upload_file,
        description,
        journal_id,
      },
      {
        onSuccess: () => {
          showSuccess("Fayl muvaffaqiyatli tahrirlendi");
          setIsUploadModalOpen(false);
          setSelectedFileForEdit(null);
        },
        onError: () => {
          showError("Fayl tahrirlashda xatolik");
        },
      }
    );
  };

  const handleEditFileClick = (file: BulletinFile) => {
    setSelectedFileForEdit(file);
    setIsNewFileMode(false);
    setIsUploadModalOpen(true);
  };

  const handleNewFileClick = () => {
    setSelectedFileForEdit(null);
    setIsNewFileMode(true);
    setIsUploadModalOpen(true);
  };

  const handleModalClose = () => {
    setIsUploadModalOpen(false);
    setSelectedFileForEdit(null);
    setIsNewFileMode(false);
  };

  const handleFileUpload = (file: File, description: string) => {
    if (selectedFileForEdit) {
      handleUpdateBulletinFile(
        selectedFileForEdit.id,
        file,
        description,
        journalId as string
      );
    }
  };

  const getActualFile = (file: BulletinFile) => {
    if (!file.uploaded_files || file.uploaded_files.length === 0) {
      return null;
    }
    return file.uploaded_files.find(
      (upload_file) => upload_file.status_display === "Actual"
    );
  };

  const hasUploadFiles = (file: BulletinFile) => {
    return file.uploaded_files && file.uploaded_files.length > 0;
  };

  const handleNewFileUpload = (file: File, description: string) => {
    createBulletinFile(
      { id: journalId as string, upload_file: file },
      {
        onSuccess: () => {
          showSuccess("Yangi fayl muvaffaqiyatli yuklandi");
          queryClient.invalidateQueries({
            queryKey: [queryKeys.bulletins.detail(journalId as string)],
          });
          setIsUploadModalOpen(false);
          setIsNewFileMode(false);
        },
        onError: (error) => {
          showError((error as any).response.data[0]);
        },
      }
    );
  };

  return (
    <>
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Yuklangan fayllar</h2>
            <p className="text-sm text-gray-600 mt-1">
              Bulletin uchun yuklangan fayllar tarixi
            </p>
          </div>
          <PermissionGuard permission="create_bulletin_file">
            <Button
              onClick={handleNewFileClick}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Yangi fayl yuklash</span>
            </Button>
          </PermissionGuard>
        </div>

        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-[var(--table-header-fg)]">
                <PermissionGuard permission="view_bulletin_file_history">
                  <TableHead className="w-16 p-3"></TableHead>
                </PermissionGuard>
                <TableHead className="p-3">Fayl nomi</TableHead>
                <TableHead className="p-3">Fayl tavsifi</TableHead>
                <TableHead className="p-3">Foydalanuvchi</TableHead>
                <TableHead className="p-3">Yuklangan sana</TableHead>
                <TableHead className="p-3">Muddat</TableHead>
                <TableHead className="p-3">Holat</TableHead>
                <TableHead className="p-3">Tahrir holati</TableHead>
                <TableHead className="w-24 p-3">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Hali hech qanday fayl yuklanmagan
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => {
                  const actualFile = getActualFile(file);
                  const isExpanded = expandedRows.has(file.id);
                  const hasHistory =
                    hasUploadFiles(file) &&
                    file.uploaded_files &&
                    file.uploaded_files.length;

                  return (
                    <React.Fragment key={file.id}>
                      {/* Main Row */}
                      <TableRow
                        className="transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleRowExpansion(file.id)}
                      >
                        <PermissionGuard permission="view_bulletin_file_history">
                          <TableCell className="font-semibold text-[var(--primary)] p-3">
                            {hasHistory && (
                              <button className="flex items-center text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5 mr-1" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 mr-1" />
                                )}
                              </button>
                            )}
                          </TableCell>
                        </PermissionGuard>
                        <TableCell className="p-3">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(actualFile?.upload_file || "unknown")}
                            <div>
                              <div className="font-medium text-[var(--foreground)]">
                                {actualFile ? actualFile.upload_file_name : "-"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {actualFile?.description || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <div>
                            <div className="font-medium text-[var(--foreground)]">
                              {file.user_info.full_name}
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">
                              @{file.user_info.username}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-[var(--muted-foreground)]">
                          {formatDate(file.created)}
                        </TableCell>
                        <TableCell className="p-3 text-[var(--muted-foreground)]">
                          {formatDate(file.deadline)}
                        </TableCell>
                        <TableCell className="p-3">
                          <Badge
                            variant={getStatusVariant(file.status)}
                            className={`${getStatusColor(
                              file.status
                            )} border-none`}
                          >
                            <div className="flex items-center space-x-1">
                              {file.status === "on_time" && (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              {file.status === "late" && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {file.status === "not_submitted" && (
                                <Clock className="h-3 w-3" />
                              )}
                              <span>{getStatusLabel(file.status)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3">
                          <Badge variant="outline" className="border-none">
                            <span>
                              {file.editable
                                ? "Ruxsat berilgan"
                                : "Ruxsat berilmagan"}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <a href={actualFile?.upload_file || ""}>
                              <Button
                                variant="outline"
                                size="icon"
                                disabled={!actualFile}
                                className="h-8 w-8 p-0 border border-[var(--border)] disabled:opacity-50"
                                aria-label="Yuklab olish"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="h-4 w-4 text-[var(--primary)]" />
                              </Button>
                            </a>

                            <PermissionGuard permission="give_access_to_edit_bulletin_file">
                              <LoadingButton
                                className="min-w-[160px]"
                                isPending={isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGiveAccessToEditBulletinFile(
                                    file.id,
                                    !file.editable
                                  );
                                }}
                                disabled={!actualFile}
                                variant={
                                  file.editable ? "destructive" : "default"
                                }
                                size="sm"
                              >
                                {!file.editable
                                  ? "Tahrirlash ruxsat berish"
                                  : "Tahrirlashni bekor qilish"}
                              </LoadingButton>
                            </PermissionGuard>

                            {file.editable && (
                              <PermissionGuard permission="edit_bulletin_file">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFileClick(file);
                                  }}
                                >
                                  <Edit className="h-4 w-4 text-[var(--primary)]" />
                                </Button>
                              </PermissionGuard>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      <PermissionGuard permission="view_bulletin_file_history">
                        {isExpanded && hasHistory && file.uploaded_files && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={8} className="p-0">
                              <div className="bg-muted/10 border-l-4 border-l-[var(--primary)]/30">
                                <div className="p-4">
                                  <div className="mb-3">
                                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
                                      Fayl tarixi
                                    </h3>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                      Bu faylning barcha versiyalari
                                    </p>
                                  </div>

                                  <div className="overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/30 text-[var(--table-header-fg)]">
                                          <TableHead className="p-2 text-xs">
                                            Fayl nomi
                                          </TableHead>
                                          <TableHead className="p-2 text-xs">
                                            Tavsif
                                          </TableHead>
                                          <TableHead className="p-2 text-xs">
                                            Holat
                                          </TableHead>
                                          <TableHead className="p-2 text-xs">
                                            Yuklangan sana
                                          </TableHead>
                                          <TableHead className="p-2 text-xs text-center">
                                            Amallar
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {file.uploaded_files.map(
                                          (uploadFile) => (
                                            <TableRow
                                              key={`${file.id}-${uploadFile.id}`}
                                              className="hover:bg-muted/20"
                                            >
                                              <TableCell className="p-2">
                                                <div className="flex items-center space-x-2">
                                                  {getFileIcon(
                                                    uploadFile.upload_file
                                                  )}
                                                  <span className="text-xs font-medium text-[var(--foreground)]">
                                                    {
                                                      uploadFile.upload_file_name
                                                    }
                                                  </span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="p-2">
                                                <div className="text-xs text-[var(--foreground)]">
                                                  {uploadFile.description ||
                                                    "-"}
                                                </div>
                                              </TableCell>

                                              <TableCell className="p-2">
                                                <Badge
                                                  variant={
                                                    uploadFile.status_display ===
                                                    "Actual"
                                                      ? "default"
                                                      : "secondary"
                                                  }
                                                  className={`text-xs ${
                                                    uploadFile.status_display ===
                                                    "Actual"
                                                      ? "bg-green-100 text-green-800 border-green-200"
                                                      : "bg-gray-100 text-gray-800 border-gray-200"
                                                  } border-none`}
                                                >
                                                  {uploadFile.status_display ===
                                                  "Actual"
                                                    ? "Joriy"
                                                    : "Eski"}
                                                </Badge>
                                              </TableCell>

                                              <TableCell className="p-2 text-xs text-[var(--muted-foreground)]">
                                                {formatDate(uploadFile.created)}
                                              </TableCell>
                                              <TableCell className="p-2 text-center">
                                                <div className="p-2 flex gap-2">
                                                  <a
                                                    href={
                                                      uploadFile.upload_file ||
                                                      ""
                                                    }
                                                  >
                                                    <Button
                                                      variant="outline"
                                                      size="icon"
                                                      className="h-6 w-6 p-0 border border-[var(--border)] hover:bg-[var(--primary)]/10"
                                                      aria-label="Yuklab olish"
                                                    >
                                                      <Download className="h-3 w-3 text-[var(--primary)]" />
                                                    </Button>
                                                  </a>
                                                  <PermissionGuard permission="delete_bulletin_file">
                                                    <Button
                                                      variant="outline"
                                                      size="icon"
                                                      className="h-6 w-6 p-0 border border-[var(--border)] hover:bg-[var(--destructive)]/10"
                                                      aria-label="O'chirish"
                                                      onClick={() =>
                                                        setDeleteConfirmation({
                                                          isOpen: true,
                                                          fileId:
                                                            uploadFile?.id,
                                                        })
                                                      }
                                                    >
                                                      <Trash2 className="h-3 w-3 text-[var(--destructive)]" />
                                                    </Button>
                                                  </PermissionGuard>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </PermissionGuard>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <BulletinFileUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleModalClose}
        onUpload={isNewFileMode ? handleNewFileUpload : handleFileUpload}
        file={selectedFileForEdit}
        isUploading={
          isNewFileMode
            ? isCreatingFile
            : isPending || isCreatingBulletinFileStatusHistory
        }
        isNewFile={isNewFileMode}
      />

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        isDoingAction={isDeletingFile}
        onClose={() => setDeleteConfirmation({ isOpen: false })}
        onConfirm={confirmDeleteBulletinFile}
        title={"Byulleten faylini o'chirish"}
        message={
          "Haqiqatan ham bu faylni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
        }
      />
    </>
  );
}
