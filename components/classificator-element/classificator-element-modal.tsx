"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Upload, FileSpreadsheet, Plus, X, AlertCircle } from "lucide-react";
import { ClassificatorElement } from "@/api/types/classificator";
import { LoadingButton } from "@/ui/loading-button";

interface ClassificatorElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<ClassificatorElement, "id"> | Omit<ClassificatorElement, "id">[]
  ) => void;
  element?: ClassificatorElement;
  mode: "create" | "edit";
  isPending: boolean;
}

export function ClassificatorElementModal({
  isOpen,
  onClose,
  onSave,
  element,
  mode,
  isPending,
}: ClassificatorElementModalProps) {
  const [activeTab, setActiveTab] = useState("individual");
  const [elementName, setElementName] = useState("");

  // Bulk creation state
  const [bulkElements, setBulkElements] = useState<string[]>([]);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedElements, setUploadedElements] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && element) {
      setElementName(element.name);
      setActiveTab("individual");
    } else {
      setElementName("");
      setActiveTab("individual");
    }
  }, [mode, element, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const elementsToSave: Omit<ClassificatorElement, "id">[] = [];

    if (activeTab === "individual") {
      // Add the single element if it exists
      if (elementName.trim()) {
        elementsToSave.push({
          name: elementName.trim(),
        });
      }

      // Add all bulk elements
      bulkElements.forEach((elementName) => {
        elementsToSave.push({
          name: elementName,
        });
      });
    } else if (activeTab === "template" && uploadedElements.length > 0) {
      // Add all uploaded elements
      uploadedElements.forEach((elementName) => {
        elementsToSave.push({
          name: elementName,
        });
      });
    }

    // Send all elements at once
    if (elementsToSave.length > 0) {
      if (elementsToSave.length === 1) {
        onSave(elementsToSave[0]);
      } else {
        onSave(elementsToSave);
      }
    }
  };

  const handleClose = () => {
    onClose();
    setElementName("");
    setBulkElements([]);
    setSelectedFile(null);
    setUploadedElements([]);
    setError(null);
  };

  // Bulk creation handlers
  const addBulkElement = () => {
    if (elementName.trim()) {
      setBulkElements([...bulkElements, elementName.trim()]);
      setElementName("");
    }
  };

  const removeBulkElement = (index: number) => {
    setBulkElements(bulkElements.filter((_, i) => i !== index));
  };

  const handleBulkSubmit = () => {
    const elementsToSave: Omit<ClassificatorElement, "id">[] = [];

    // Add the current input if it exists
    if (elementName.trim()) {
      elementsToSave.push({
        name: elementName.trim(),
      });
    }

    // Add all bulk elements
    bulkElements.forEach((elementName) => {
      elementsToSave.push({
        name: elementName,
      });
    });

    // Send all elements at once
    if (elementsToSave.length > 0) {
      if (elementsToSave.length === 1) {
        onSave(elementsToSave[0]);
      } else {
        onSave(elementsToSave);
      }
    }
  };

  // File upload handlers with real Excel parsing
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "application/octet-stream", // Some systems may use this for Excel files
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Faqat Excel fayllar (.xlsx, .xls) qabul qilinadi");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setSelectedFile(file);

    try {
      // Dynamic import of xlsx library
      const XLSX = await import("xlsx");

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Extract element names from the first column (accept any type and convert to string)
          const elements: string[] = [];
          jsonData.forEach((row: any, rowIndex: number) => {
            if (row && row[0] !== undefined && row[0] !== null) {
              // Convert any type to string
              let elementValue: string;

              if (typeof row[0] === "string") {
                elementValue = row[0].trim();
              } else if (typeof row[0] === "number") {
                elementValue = row[0].toString();
              } else if (typeof row[0] === "boolean") {
                elementValue = row[0] ? "True" : "False";
              } else if (row[0] instanceof Date) {
                elementValue = row[0].toLocaleDateString();
              } else {
                // For any other type, convert to string
                elementValue = String(row[0]).trim();
              }

              // Only add if the converted value is not empty
              if (elementValue && elementValue.length > 0) {
                elements.push(elementValue);
              }
            }
          });

          if (elements.length === 0) {
            setError(
              "Excel faylda element nomlari topilmadi. Birinchi ustunda element nomlari bo'lishi kerak."
            );
            setUploadedElements([]);
          } else {
            setUploadedElements(elements);
            setError(null);
          }
        } catch (parseError) {
          setError(
            "Excel faylni o'qishda xatolik yuz berdi. Fayl formatini tekshiring."
          );
          setUploadedElements([]);
        }
      };

      reader.onerror = () => {
        setError("Faylni o'qishda xatolik yuz berdi.");
        setUploadedElements([]);
      };

      reader.readAsArrayBuffer(file);
    } catch (importError) {
      setError("Excel fayllarni o'qish uchun kerakli kutubxona yuklanmadi.");
      setUploadedElements([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadedElements([]);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--foreground)]">
            {mode === "create" ? "Element qo'shish" : "Elementni tahrirlash"}
          </DialogTitle>
        </DialogHeader>

        {mode === "edit" ? (
          // Edit mode - simple single input
          <div className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label
                htmlFor="edit-name"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Element nomi
              </Label>
              <Input
                id="edit-name"
                value={elementName}
                onChange={(e) => setElementName(e.target.value)}
                placeholder="Element nomini kiriting"
                className="w-full"
              />
            </div>
          </div>
        ) : (
          // Create mode - full tabbed interface
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-[var(--muted)] p-1 rounded-lg">
              <TabsTrigger
                value="individual"
                className="data-[state=active]:bg-white data-[state=active]:text-[var(--foreground)] cursor-pointer"
              >
                Alohida
              </TabsTrigger>
              <TabsTrigger
                value="template"
                className="data-[state=active]:bg-white data-[state=active]:text-[var(--foreground)] cursor-pointer"
              >
                Shablon
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Input
                      value={elementName}
                      onChange={(e) => setElementName(e.target.value)}
                      placeholder="Element nomini kiriting"
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && addBulkElement()}
                    />
                    <Button
                      type="button"
                      onClick={addBulkElement}
                      disabled={!elementName.trim()}
                      className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Qo'shish
                    </Button>
                  </div>
                </div>

                {bulkElements.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-[var(--foreground)]">
                        Qo'shilgan elementlar ({bulkElements.length})
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        className=" hover:bg-[var(--primary)]  px-6"
                        onClick={() => setBulkElements([])}
                      >
                        Barchasini tozalash
                      </Button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-2 border border-[var(--border)] rounded-lg p-3 bg-[var(--background)]">
                      {bulkElements.map((element, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-md"
                        >
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {element}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBulkElement(index)}
                            className="h-7 w-7 p-0  text-[white] bg-[var(--destructive)]/30 hover:bg-[var(--destructive)]/60"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-[var(--foreground)]">
                    Excel fayl yuklash
                  </Label>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center bg-[var(--muted)]/30">
                    {!selectedFile ? (
                      <div className="space-y-4">
                        <Upload className="mx-auto h-16 w-16 text-[var(--muted-foreground)]" />
                        <div className="space-y-2">
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer"
                          >
                            <span className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 underline">
                              Fayl tanlang
                            </span>
                            <span className="text-[var(--muted-foreground)]">
                              {" "}
                              yoki surib yuklang
                            </span>
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Faqat Excel fayllar (.xlsx, .xls) qabul qilinadi
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <FileSpreadsheet className="mx-auto h-16 w-16 text-green-500" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                          {isProcessing && (
                            <p className="text-xs text-blue-600">
                              Fayl o'qilmoqda...
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeFile}
                          className="border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Faylni olib tashlash
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {uploadedElements.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-[var(--foreground)]">
                      Fayldan o'qilgan elementlar ({uploadedElements.length})
                    </Label>
                    <div className="max-h-40 overflow-y-auto space-y-2 border border-[var(--border)] rounded-lg p-3 bg-[var(--background)]">
                      {uploadedElements.map((element, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 bg-[var(--muted)] rounded-md"
                        >
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {element}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-[var(--border)]"
          >
            Bekor qilish
          </Button>

          {mode === "edit" ? (
            <LoadingButton
              type="submit"
              onClick={handleSubmit}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-6"
              disabled={!elementName.trim()}
              isPending={isPending}
            >
              O'zgarishlarni saqlash
            </LoadingButton>
          ) : activeTab === "individual" &&
            (bulkElements.length > 0 || elementName.trim()) ? (
            <LoadingButton
              type="button"
              onClick={handleBulkSubmit}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-6"
              isPending={isPending}
            >
              {(() => {
                const totalElements =
                  bulkElements.length + (elementName.trim() ? 1 : 0);
                return `${totalElements} ta elementni qo'shish`;
              })()}
            </LoadingButton>
          ) : (
            <LoadingButton
              type="submit"
              onClick={handleSubmit}
              isPending={isPending}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-6"
              disabled={
                (activeTab === "individual" &&
                  !elementName.trim() &&
                  bulkElements.length === 0) ||
                (activeTab === "template" && uploadedElements.length === 0)
              }
            >
              Saqlash
            </LoadingButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
