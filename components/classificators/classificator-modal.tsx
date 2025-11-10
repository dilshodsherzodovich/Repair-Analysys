"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/ui/modal";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Card } from "@/ui/card";
import {
  Classificator,
  ClassificatorCreateParams,
} from "@/api/types/classificator";
import { LoadingButton } from "@/ui/loading-button";

interface ClassificatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClassificatorCreateParams) => void;
  classificator?: Classificator;
  mode: "create" | "edit";
  isPending: boolean;
}

export function ClassificatorModal({
  isOpen,
  onClose,
  onSave,
  classificator,
  isPending,
  mode,
}: ClassificatorModalProps) {
  const [formData, setFormData] = useState<ClassificatorCreateParams>({
    name: "",
    elements: [],
  });

  const [elementName, setElementName] = useState("");

  useEffect(() => {
    if (mode === "edit" && classificator) {
      setFormData({
        name: classificator.name,
        elements: classificator.elements.map((el) => ({ name: el.name })),
      });
    } else {
      setFormData({
        name: "",
        elements: [],
      });
    }
    setElementName("");
  }, [mode, classificator, isOpen]);

  const handleAddElement = () => {
    if (elementName.trim()) {
      setFormData({
        ...formData,
        elements: [...formData.elements, { name: elementName.trim() }],
      });
      setElementName("");
    }
  };

  const handleRemoveElement = (index: number) => {
    setFormData({
      ...formData,
      elements: formData.elements.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({
      name: "",
      elements: [],
    });
    setElementName("");
  };

  const title =
    mode === "create" ? "Klassifikator yaratish" : "Klassifikatorni tahrirlash";
  const submitText = mode === "create" ? "Yaratish" : "O'zgarishlarni saqlash";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <Card className="border-none p-0 mt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Klassifikator nomi
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Klassifikator nomini kiriting"
                required
              />
            </div>

            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Elementlar
              </Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={elementName}
                    onChange={(e) => setElementName(e.target.value)}
                    placeholder="Element nomini kiriting"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddElement();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddElement}
                    disabled={!elementName.trim()}
                    className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
                  >
                    Qo'shish
                  </Button>
                </div>

                {formData.elements.length > 0 && (
                  <div className="space-y-2">
                    {formData.elements.map((element, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <span className="text-sm">{element.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveElement(index)}
                          className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Bekor qilish
            </Button>
            <LoadingButton
              isPending={isPending}
              type="submit"
              disabled={!formData.name.trim()}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-8"
            >
              {submitText}
            </LoadingButton>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
