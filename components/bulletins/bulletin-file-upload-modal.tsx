"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/ui/modal";
import { FileUpload } from "@/ui/file-upload";
import { BulletinFile } from "@/api/types/bulleten";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Send } from "lucide-react";

interface BulletinFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, description: string) => void;
  file: BulletinFile | null;
  isUploading?: boolean;
  isNewFile?: boolean; // New prop to distinguish between new file and edit file
}

export function BulletinFileUploadModal({
  isOpen,
  onClose,
  onUpload,
  file,
  isUploading = false,
  isNewFile = false,
}: BulletinFileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File[]>([]);
  const [description, setDescription] = useState("");

  // Reset form when modal opens/closes or when file changes
  useEffect(() => {
    if (isOpen) {
      setSelectedFile([]);
      setDescription("");
    }
  }, [isOpen, file]);

  const handleFileChange = (files: File[]) => {
    setSelectedFile(files);
  };

  const handleSubmit = (files: File[]) => {
    if (files.length > 0) {
      onUpload(files[0], description);
    }
  };

  const handleClose = () => {
    setSelectedFile([]);
    setDescription("");
    onClose();
  };

  const getTitle = () => {
    return isNewFile ? "Yangi fayl yuklash" : "Faylni yangilash";
  };

  const getInputPlaceholder = () => {
    return isNewFile ? "Fayl haqida izoh (ixtiyoriy)" : "Izoh";
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()} size="lg">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {!isNewFile && file && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Joriy fayl:</p>
              <p className="text-sm text-gray-600">
                {file.uploaded_files?.[0]?.upload_file || "Fayl topilmadi"}
              </p>
            </div>
          )}
        </div>

        <FileUpload
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
          multiple={false}
          maxSize={200}
          maxFiles={1}
          onFilesChange={handleFileChange}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          filesUploaded={selectedFile}
          isUploadingFile={isUploading}
        />
        <Input
          placeholder={getInputPlaceholder()}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4"
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit(selectedFile)}
            disabled={selectedFile.length === 0 || isUploading}
            className="px-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Yuklanmoqda...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Yuklash
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
