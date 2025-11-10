"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/ui/modal";
import { Input } from "@/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/ui/select";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Card } from "@/ui/card";
import { UserData } from "@/api/types/user";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useDepartments } from "@/api/hooks/use-departmants";
import { userRoles } from "@/lib/users";
import { getRoleName } from "@/lib/utils";
import { LoadingButton } from "@/ui/loading-button";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  user?: UserData;
  onSubmit: (formData: any) => void;
  isLoading?: boolean;
}

export function UserModal({
  isOpen,
  onClose,
  mode,
  user,
  onSubmit,
  isLoading = false,
}: UserModalProps) {
  const { data: organizations, isPending: isLoadingOrganizations } =
    useOrganizations({
      no_page: true,
    });
  const { data: departments, isPending: isLoadingDepartments } = useDepartments(
    {
      no_page: true,
    }
  );

  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    secondary_organization_id: "",
    organization: "",
    username: "",
    password: "",
    role: "",
    status: "active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [deptSearchTerm, setDeptSearchTerm] = useState("");

  // Filter departments based on selected organization
  const filteredDepartments = useMemo(() => {
    if (!formData.organization || !departments?.results) {
      return [];
    }
    return departments.results.filter(
      (dept) => dept.organization_id === formData.organization
    );
  }, [formData.organization, departments?.results]);

  // Filter organizations based on search term
  const filteredOrganizations = useMemo(() => {
    if (!organizations?.results) return [];
    if (!orgSearchTerm) return organizations.results;
    return organizations.results.filter((org) =>
      org.name.toLowerCase().includes(orgSearchTerm.toLowerCase())
    );
  }, [organizations?.results, orgSearchTerm]);

  // Filter departments based on search term
  const filteredDepartmentsBySearch = useMemo(() => {
    if (!deptSearchTerm) return filteredDepartments;
    return filteredDepartments.filter((dept) =>
      dept.name.toLowerCase().includes(deptSearchTerm.toLowerCase())
    );
  }, [filteredDepartments, deptSearchTerm]);

  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        lastName: user?.last_name || "",
        firstName: user?.first_name || "",
        secondary_organization_id: user?.profile?.secondary_organization.id!,
        organization: user?.profile?.secondary_organization.organization.id!,
        username: user.username,
        password: "",
        role: user.role,
        status: user.is_active ? "active" : "inactive",
      });
    } else {
      setFormData({
        lastName: "",
        firstName: "",
        secondary_organization_id: "",
        organization: "",
        username: "",
        password: "",
        role: "",
        status: "active",
      });
    }
    setErrors({});
    setOrgSearchTerm("");
    setDeptSearchTerm("");
  }, [mode, user, isOpen]);

  // Reset secondary organization when main organization changes
  useEffect(() => {
    if (formData.organization) {
      // Check if current secondary organization belongs to selected main organization
      const currentDept = departments?.results?.find(
        (dept) => dept.id === formData.secondary_organization_id
      );

      if (
        !currentDept ||
        currentDept.organization_id !== formData.organization
      ) {
        setFormData((prev) => ({
          ...prev,
          secondary_organization_id: "",
        }));
      }
    }
    setDeptSearchTerm(""); // Clear department search when organization changes
  }, [
    formData.organization,
    departments?.results,
    formData.secondary_organization_id,
  ]);

  const isSubmitButtonDisabled = useMemo(() => {
    return (
      !formData.lastName.trim() ||
      !formData.firstName.trim() ||
      !formData.username.trim() ||
      !formData.role ||
      !formData.secondary_organization_id
    );
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Familiya kiritilishi shart";
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Ism kiritilishi shart";
    }
    if (!formData.username.trim()) {
      newErrors.login = "Foydalanuvchi nomi kiritilishi shart";
    }
    if (mode === "create" && !formData.password.trim()) {
      newErrors.password = "Parol kiritilishi shart";
    }
    if (!formData.role) {
      newErrors.role = "Rol tanlanishi shart";
    }
    if (!formData.secondary_organization_id) {
      newErrors.department = "Quyi tashkilot tanlanishi shart";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(
      mode === "create"
        ? {
            first_name: formData.firstName,
            last_name: formData.lastName,
            username: formData.username,
            role: formData.role,
            is_active: formData.status === "active",
            password: formData.password,
            profile: {
              secondary_organization_id: formData.secondary_organization_id,
            },
          }
        : {
            first_name: formData.firstName,
            last_name: formData.lastName,
            username: formData.username,
            role: formData.role,
            is_active: formData.status === "active",
            password: formData.password,
            profile: {
              secondary_organization_id: formData.secondary_organization_id,
            },
          }
    );
  };

  const title =
    mode === "create"
      ? "Yangi foydalanuvchi yaratish"
      : "Foydalanuvchi ma'lumotlarini tahrirlash";
  const submitText = mode === "create" ? "Saqlash" : "Yangilash";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <Card className="border-none p-0 mt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Familiyasi *
              </Label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Ismi *
              </Label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Tashkilot *
              </Label>
              <Select
                value={formData.organization}
                onValueChange={(value) => {
                  setFormData({ ...formData, organization: value });
                  setOrgSearchTerm(""); // Clear search after selection
                }}
              >
                <SelectTrigger
                  className={errors.organization ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Tashkilot tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      placeholder="Qidirish..."
                      value={orgSearchTerm}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onChange={(e) => setOrgSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredOrganizations.length > 0 ? (
                      filteredOrganizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                        Tashkilot topilmadi
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
              {errors.organization && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.organization}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Quyi tashkilot *
              </Label>
              <Select
                value={formData.secondary_organization_id}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    secondary_organization_id: value,
                  });
                  setDeptSearchTerm(""); // Clear search after selection
                }}
                disabled={!formData.organization}
              >
                <SelectTrigger
                  className={errors.department ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={
                      !formData.organization
                        ? "Avval tashkilot tanlang"
                        : filteredDepartmentsBySearch.length === 0
                        ? "Bu tashkilotda quyi tashkilotlar yo'q"
                        : "Quyi tashkilot tanlang"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      placeholder="Qidirish..."
                      value={deptSearchTerm}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onChange={(e) => setDeptSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      disabled={!formData.organization}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredDepartmentsBySearch.length > 0 ? (
                      filteredDepartmentsBySearch.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                        {!formData.organization
                          ? "Avval tashkilot tanlang"
                          : "Quyi tashkilot topilmadi"}
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-red-500 text-xs mt-1">{errors.department}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Foydalanuvchi nomi *
              </Label>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className={errors.login ? "border-red-500" : ""}
                autoComplete="off"
              />
              {errors.login && (
                <p className="text-red-500 text-xs mt-1">{errors.login}</p>
              )}
            </div>

            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Parol *
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={errors.password ? "border-red-500" : ""}
                autoComplete="off"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">
                Rol *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Rol tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {getRoleName(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm text-[var(--muted-foreground)]">
              Holati
            </Label>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`status-${mode}`}
                  value="active"
                  checked={formData.status === "active"}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-4 h-4 text-[var(--primary)] border-gray-300 focus:ring-[var(--primary)]"
                />
                <span className="text-[var(--foreground)] text-sm">Faol</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`status-${mode}`}
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-4 h-4 text-[var(--primary)] border-gray-300 focus:ring-[var(--primary)]"
                />
                <span className="text-[var(--foreground)] text-sm">Nofaol</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Bekor qilish
            </Button>
            <LoadingButton
              type="submit"
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-8"
              disabled={isSubmitButtonDisabled || isLoading}
              isPending={isLoading}
            >
              {submitText}
            </LoadingButton>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
