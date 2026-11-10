"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, ModalFooter } from "@/ui/modal";
import { Input } from "@/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/ui/select";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { UserData } from "@/api/types/user";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useDepartments } from "@/api/hooks/use-departmants";
import { userRoles } from "@/lib/users";
import { getRoleName } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";

import { Field, FieldGrid } from "@/ui/field";
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
      <form onSubmit={handleSubmit} className="space-y-5">
          <FieldGrid columns={2}>
            <Field label="Familiyasi" required error={errors.lastName}>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                aria-invalid={!!errors.lastName}
              />
            </Field>
            <Field label="Ismi" required error={errors.firstName}>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                aria-invalid={!!errors.firstName}
              />
            </Field>
          </FieldGrid>

          <FieldGrid columns={2}>
            <Field label="Tashkilot" required error={errors.organization}>
              <Select
                value={formData.organization}
                onValueChange={(value) => {
                  setFormData({ ...formData, organization: value });
                  setOrgSearchTerm(""); // Clear search after selection
                }}
              >
                <SelectTrigger
                  aria-invalid={!!errors.organization}
                >
                  <SelectValue placeholder="Tashkilot tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b border-border">
                    <Input variant="compact"
                      type="text"
                      placeholder="Qidirish..."
                      value={orgSearchTerm}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onChange={(e) => setOrgSearchTerm(e.target.value)}
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
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Tashkilot topilmadi
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Quyi tashkilot" required error={errors.department}>
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
                  aria-invalid={!!errors.department}
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
                  <div className="p-2 border-b border-border">
                    <Input variant="compact"
                      type="text"
                      placeholder="Qidirish..."
                      value={deptSearchTerm}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onChange={(e) => setDeptSearchTerm(e.target.value)}
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
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {!formData.organization
                          ? "Avval tashkilot tanlang"
                          : "Quyi tashkilot topilmadi"}
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </Field>
          </FieldGrid>

          <FieldGrid columns={3}>
            <Field label="Foydalanuvchi nomi" required error={errors.login}>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                aria-invalid={!!errors.login}
                autoComplete="off"
              />
            </Field>

            <Field label="Parol" required error={errors.password}>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                aria-invalid={!!errors.password}
                autoComplete="off"
              />
            </Field>

            <Field label="Rol" required error={errors.role}>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger aria-invalid={!!errors.role}>
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
            </Field>
          </FieldGrid>

          <Field label="Holati">
            <RadioGroup
              name={`status-${mode}`}
              value={formData.status}
              onValueChange={(status) => setFormData({ ...formData, status })}
              className="mt-2 flex items-center gap-6"
            >
              <Label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="active" />
                <span className="text-foreground text-sm">Faol</span>
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="inactive" />
                <span className="text-foreground text-sm">Nofaol</span>
              </Label>
            </RadioGroup>
          </Field>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="min-w-24 px-8"
              disabled={isSubmitButtonDisabled}
              loading={isLoading}
            >
              {submitText}
            </Button>
          </ModalFooter>
        </form>
    </Modal>
  );
}
