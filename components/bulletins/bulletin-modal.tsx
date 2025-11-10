"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Check } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { MultiSelect } from "@/ui/multi-select";
import { DatePicker } from "@/ui/date-picker";
import React from "react";
import {
  Bulletin,
  BulletinCreateBody,
  BulletinDeadline,
} from "@/api/types/bulleten";
import {
  useOrganizations,
  useStatisticsOrganizations,
} from "@/api/hooks/use-organizations";
import { useDepartments } from "@/api/hooks/use-departmants";
import { useStatisticsUsers, useUsers } from "@/api/hooks/use-user";
import { Badge } from "@/ui/badge";
import { LoadingButton } from "@/ui/loading-button";

interface BulletinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulletinCreateBody) => void;
  mode: "create" | "edit";
  bulletin?: Bulletin;
  isLoading: boolean;
}

interface BulletinFormData {
  name: string;
  description: string;
  deadline: BulletinDeadline; // Use the actual deadline object directly
  currentDeadline: Date | undefined;
  mainOrganizations: string[];
  secondaryOrganizations: string[];
  responsibleEmployees: string[];
  statisticsOrganizations: string[];
  type_of_journal_display?: string;
}

interface SelectedMainOrg {
  mainOrgId: string;
  mainOrgName: string;
  secondaryOrgs: string[];
}

const deadlineOptions = [
  { value: "weekly", label: "Haftalik" },
  { value: "monthly", label: "Oylik" },
  { value: "quarterly", label: "Choraklik" },
  { value: "yearly", label: "Yillik" },
];

const docTypeOptions = [
  { value: "bulleten", label: "Byulleten" },
  { value: "table", label: "Jadval" },
];

// Helper function to convert day names to numbers (0 = Monday, 6 = Sunday)
const getDayOfWeekNumber = (dayName: string): number => {
  const dayMap: { [key: string]: number } = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  return dayMap[dayName] || 0;
};

// Helper function for month names
const getMonthName = (monthNumber: number): string => {
  const months = [
    "",
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ];
  return months[monthNumber] || "";
};

// Helper function for day names
const getDayName = (dayNumber: number): string => {
  const days = [
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
    "Yakshanba",
  ];
  return days[dayNumber] || "";
};

// Helper function to get next deadlines
const getNextDeadlines = (
  periodType: string,
  value: any,
  interval: number = 1,
  count: number = 4
): Date[] => {
  const deadlines: Date[] = [];
  const today = new Date();

  if (periodType === "weekly") {
    const dayOfWeek = value;
    const currentDay = today.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    const nextDeadline = new Date(today);
    nextDeadline.setDate(today.getDate() + daysUntilTarget);

    for (let i = 0; i < count; i++) {
      const deadline = new Date(nextDeadline);
      deadline.setDate(nextDeadline.getDate() + i * 7);
      deadlines.push(deadline);
    }
  } else if (periodType === "monthly") {
    const dayOfMonth = value;
    const currentYear = today.getFullYear();

    // Show all 12 months of the current year
    for (let month = 0; month < 12; month++) {
      const deadline = new Date(currentYear, month, dayOfMonth);
      deadlines.push(deadline);
    }
  } else if (periodType === "yearly") {
    const startDate = new Date(value);
    const nextDeadline = new Date(startDate);

    for (let i = 0; i < count; i++) {
      const deadline = new Date(nextDeadline);
      deadline.setFullYear(nextDeadline.getFullYear() + i * interval);
      deadlines.push(deadline);
    }
  }

  return deadlines;
};

// Helper function to get months for each quarter
const getQuarterMonths = (
  quarter: number
): { value: number; label: string }[] => {
  const quarterMonths = {
    1: [
      { value: 1, label: "Yanvar" },
      { value: 2, label: "Fevral" },
      { value: 3, label: "Mart" },
    ],
    2: [
      { value: 4, label: "Aprel" },
      { value: 5, label: "May" },
      { value: 6, label: "Iyun" },
    ],
    3: [
      { value: 7, label: "Iyul" },
      { value: 8, label: "Avgust" },
      { value: 9, label: "Sentabr" },
    ],
    4: [
      { value: 10, label: "Oktabr" },
      { value: 11, label: "Noyabr" },
      { value: 12, label: "Dekabr" },
    ],
  };

  return quarterMonths[quarter as keyof typeof quarterMonths] || [];
};

export function BulletinModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  bulletin,
  isLoading,
}: BulletinModalProps) {
  const [formData, setFormData] = useState<BulletinFormData>({
    name: "",
    description: "",
    deadline: {
      id: 0,
      period_type: "",
      day_of_week: null,
      day_of_month: null,
      quarterly_deadlines: null,
      year_interval: 1, // Default interval for yearly
      current_deadline: null,
    },
    currentDeadline: undefined,
    mainOrganizations: [],
    secondaryOrganizations: [],
    responsibleEmployees: [],
    statisticsOrganizations: [],
    type_of_journal_display: "",
  });

  const [selectedMainOrgs, setSelectedMainOrgs] = useState<SelectedMainOrg[]>(
    []
  );
  const [currentMainOrgId, setCurrentMainOrgId] = useState<string>("");
  const [currentSecondaryOrgs, setCurrentSecondaryOrgs] = useState<string[]>(
    []
  );
  const [mainOrgSearchTerm, setMainOrgSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch data from API
  const { data: organizationsData, isLoading: orgsLoading } = useOrganizations({
    no_page: true,
  });
  const { data: departmentsData, isLoading: deptsLoading } = useDepartments({
    no_page: true,
  });
  const { data: usersData, isLoading: usersLoading } = useStatisticsUsers();
  const { data: statsOrgsData, isLoading: statsOrgsLoading } =
    useStatisticsOrganizations({ no_page: true });

  const organizations = organizationsData?.results || [];
  const departments = departmentsData?.results || [];
  const users = usersData?.results || [];
  const statisticsOrganizations = statsOrgsData || [];

  // Users filtered by selected statistics organizations
  const filteredUsers = useMemo(() => {
    if (!formData.statisticsOrganizations?.length) return [];
    return users.filter((user: any) =>
      formData.statisticsOrganizations.includes(
        user?.profile.secondary_organization?.id
      )
    );
  }, [users, formData.statisticsOrganizations]);

  // Helper function to reconstruct selectedMainOrgs from bulletin data
  const reconstructSelectedMainOrgs = (bulletin: Bulletin) => {
    if (
      !bulletin.main_organizations_list ||
      !bulletin.main_organizations_list.length
    ) {
      return [];
    }

    const reconstructed: SelectedMainOrg[] = [];

    bulletin.main_organizations_list.forEach((mainOrg) => {
      const secondaryOrgIds = mainOrg.secondary_organizations.map(
        (dept) => dept.id
      );

      reconstructed.push({
        mainOrgId: mainOrg.id,
        mainOrgName: mainOrg.name,
        secondaryOrgs: secondaryOrgIds,
      });
    });

    return reconstructed;
  };

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && bulletin) {
        const reconstructedMainOrgs = reconstructSelectedMainOrgs(bulletin);

        setFormData({
          name: bulletin.name || "",
          description: bulletin.description || "",
          deadline: bulletin.deadline || {
            id: 0,
            period_type: "",
            day_of_week: null,
            day_of_month: null,
            quarterly_deadlines: null,
            year_interval: null,
            current_deadline: null,
          },
          currentDeadline: bulletin.deadline?.current_deadline
            ? new Date(bulletin.deadline.current_deadline)
            : undefined,
          mainOrganizations:
            bulletin.main_organizations_list?.map((org) => org.id) || [],
          secondaryOrganizations: reconstructedMainOrgs.flatMap(
            (org) => org.secondaryOrgs
          ),
          responsibleEmployees:
            bulletin.employees_list?.map((emp) => emp.id) || [],
          statisticsOrganizations: [],
          type_of_journal_display: bulletin.type_of_journal_display || "",
        });

        setSelectedMainOrgs(reconstructedMainOrgs);
      } else {
        setFormData({
          name: "",
          description: "",
          deadline: {
            id: 0,
            period_type: "",
            day_of_week: null,
            day_of_month: null,
            quarterly_deadlines: null,
            year_interval: null,
            current_deadline: null,
          },
          currentDeadline: undefined,
          mainOrganizations: [],
          secondaryOrganizations: [],
          responsibleEmployees: [],
          statisticsOrganizations: [],
          type_of_journal_display: "",
        });
        setSelectedMainOrgs([]);
        setCurrentMainOrgId("");
        setCurrentSecondaryOrgs([]);
      }
      // Clear errors when modal opens
      setErrors({});
    }
  }, [isOpen, mode, bulletin, departments]);

  const createBulletinData = (
    formData: BulletinFormData
  ): BulletinCreateBody => {
    // Create the deadline object based on period_type - only include relevant fields
    let deadline: BulletinDeadline;
    if (formData.deadline.period_type === "weekly") {
      deadline = {
        period_type: "weekly",
        day_of_week: formData.deadline.day_of_week,
        day_of_month: null,
        quarterly_deadlines: null,
        current_deadline: null,
      };
    } else if (formData.deadline.period_type === "monthly") {
      deadline = {
        period_type: "monthly",
        day_of_week: null,
        day_of_month: formData.deadline.day_of_month,
        quarterly_deadlines: null,

        current_deadline: null,
      };
    } else if (formData.deadline.period_type === "quarterly") {
      deadline = {
        period_type: "quarterly",
        day_of_week: null,
        day_of_month: null,
        quarterly_deadlines: formData.deadline.quarterly_deadlines,
        current_deadline: null,
      };
    } else if (formData.deadline.period_type === "yearly") {
      deadline = {
        period_type: "yearly",
        day_of_week: null,
        day_of_month: null,
        quarterly_deadlines: null,
        year_interval: formData.deadline.year_interval,
        current_deadline: formData.deadline.current_deadline,
      };
    } else {
      // Fallback for empty period_type
      deadline = {
        period_type: "",
        day_of_week: null,
        day_of_month: null,
        quarterly_deadlines: null,
        current_deadline: null,
      };
    }

    return {
      name: formData.name,
      description: formData.description,
      deadline,
      columns: [],
      organizations: formData.secondaryOrganizations,
      main_organizations: formData.mainOrganizations,
      responsible_employees: formData.responsibleEmployees,
      type_of_journal_display: formData.type_of_journal_display,
    };
  };

  const handleAddMainOrganization = () => {
    if (currentMainOrgId && currentSecondaryOrgs.length > 0) {
      const mainOrg = organizations.find((org) => org.id === currentMainOrgId);
      if (mainOrg) {
        const newSelectedMainOrg: SelectedMainOrg = {
          mainOrgId: currentMainOrgId,
          mainOrgName: mainOrg.name,
          secondaryOrgs: [...currentSecondaryOrgs],
        };

        setSelectedMainOrgs([...selectedMainOrgs, newSelectedMainOrg]);

        // Update form data
        const allMainOrgs = [...selectedMainOrgs, newSelectedMainOrg].map(
          (org) => org.mainOrgId
        );
        const allSecondaryOrgs = [
          ...selectedMainOrgs,
          newSelectedMainOrg,
        ].flatMap((org) => org.secondaryOrgs);

        setFormData({
          ...formData,
          mainOrganizations: allMainOrgs,
          secondaryOrganizations: allSecondaryOrgs,
        });

        setCurrentMainOrgId("");
        setCurrentSecondaryOrgs([]);
      }
    }
  };

  const handleRemoveMainOrganization = (mainOrgId: string) => {
    const updatedSelectedMainOrgs = selectedMainOrgs.filter(
      (org) => org.mainOrgId !== mainOrgId
    );
    setSelectedMainOrgs(updatedSelectedMainOrgs);

    // Update form data
    const allMainOrgs = updatedSelectedMainOrgs.map((org) => org.mainOrgId);
    const allSecondaryOrgs = updatedSelectedMainOrgs.flatMap(
      (org) => org.secondaryOrgs
    );

    setFormData({
      ...formData,
      mainOrganizations: allMainOrgs,
      secondaryOrganizations: allSecondaryOrgs,
    });
  };

  // Add validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Byulleten nomini kiriting";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Byulleten tavsifini kiriting";
    }
    if (!formData.deadline.period_type) {
      newErrors.deadline = "Muddat turini tanlang";
    }
    if (!formData.type_of_journal_display) {
      newErrors.type_of_journal_display = "Hujjat turini tanlang";
    }
    if (formData.mainOrganizations.length === 0) {
      newErrors.mainOrganizations = "Kamida bitta asosiy tashkilotni tanlang";
    }
    if (formData.secondaryOrganizations.length === 0) {
      newErrors.secondaryOrganizations =
        "Kamida bitta quyi tashkilotni tanlang";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const bulletinData = createBulletinData(formData);
    onSubmit(bulletinData);
  };

  const handleResponsibleEmployeeChange = (values: string[]) => {
    setFormData({
      ...formData,
      responsibleEmployees: values,
    });
    // Clear error when user makes selection
    if (values.length > 0 && errors.responsibleEmployees) {
      setErrors((prev) => ({ ...prev, responsibleEmployees: "" }));
    }
  };

  const handleStatisticsOrganizationsChange = (values: string[]) => {
    // When orgs filter changes, prune previously selected employees that no longer match
    const prunedEmployees = formData.responsibleEmployees.filter((empId) =>
      users.some(
        (u: any) => u.id === empId && values.includes(u?.organization_id)
      )
    );
    setFormData({
      ...formData,
      statisticsOrganizations: values,
      responsibleEmployees: prunedEmployees,
    });
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.description.trim() &&
      formData.deadline.period_type &&
      formData.currentDeadline &&
      formData.mainOrganizations.length > 0 &&
      formData.secondaryOrganizations.length > 0 &&
      formData.responsibleEmployees.length > 0
    );
  };

  const availableMainOrgs = useMemo(() => {
    const selectedIds = selectedMainOrgs.map((org) => org.mainOrgId);
    return organizations?.filter((org) => !selectedIds.includes(org.id)) || [];
  }, [selectedMainOrgs, organizations]);

  const getCurrentSecondaryOrgs = () => {
    if (!currentMainOrgId) return [];
    // Filter departments that belong to the selected main organization
    return departments.filter(
      (dept) => dept.organization_id === currentMainOrgId
    );
  };

  const getSecondaryOrgName = (secOrgId: string) => {
    const secOrg = departments.find((dept) => dept.id === secOrgId);
    return secOrg?.name || secOrgId;
  };

  if (orgsLoading || deptsLoading || usersLoading || statsOrgsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[var(--foreground)]">
              {mode === "create"
                ? "Yangi byulletenni qo'shish"
                : "Byulletenni tahrirlash"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-[var(--muted-foreground)]">
              Ma'lumotlar yuklanmoqda...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] flex flex-col overflow-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-[var(--foreground)]">
            {mode === "create"
              ? "Yangi byulletenni qo'shish"
              : "Byulletenni tahrirlash"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 pt-4 w-full h-full"
          >
            {/* First Row - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bulletin Name */}
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Byulletenni nomini kiriting
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (e.target.value.trim() && errors.name) {
                      setErrors((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                  placeholder="Byulletenni nomini kiriting"
                  className={`w-full border-[var(--border)] ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Document Type */}
              <div className="space-y-3">
                <Label
                  htmlFor="doc_type"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Hujjat turini tanlang
                </Label>
                <Select
                  value={formData.type_of_journal_display}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      type_of_journal_display: value,
                    });
                    if (value && errors.type_of_journal_display) {
                      setErrors((prev) => ({
                        ...prev,
                        type_of_journal_display: "",
                      }));
                    }
                  }}
                >
                  <SelectTrigger
                    className={`w-full border-[var(--border)] ${
                      errors.type_of_journal_display ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Hujjat turini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {docTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type_of_journal_display && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.type_of_journal_display}
                  </p>
                )}
              </div>
            </div>

            {/* Bulletin Description - Full Width */}
            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Byulletenni tavsifini kiriting
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (e.target.value.trim() && errors.description) {
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }
                }}
                placeholder="Byulletenni tavsifini kiriting"
                className={`w-full border-[var(--border)] ${
                  errors.description ? "border-red-500" : ""
                }`}
                required
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Organization Selection - Full Width */}
            <div className="space-y-4">
              {/* Selected Organizations Display */}
              {selectedMainOrgs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[var(--foreground)]">
                    Tanlangan tashkilotlar:
                  </h4>
                  {selectedMainOrgs.map((selectedOrg) => (
                    <div
                      key={selectedOrg.mainOrgId}
                      className="p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[var(--foreground)]">
                          {selectedOrg.mainOrgName}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRemoveMainOrganization(selectedOrg.mainOrgId)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedOrg.secondaryOrgs.map((secOrgId) => (
                          <Badge
                            key={secOrgId}
                            variant="secondary"
                            className="text-xs"
                          >
                            {getSecondaryOrgName(secOrgId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Organization */}
              <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/10">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
                  Yangi tashkilot qo'shish:
                </h4>

                {/* Step 1: Select Main Organization */}
                <div className="space-y-3 mb-4 w-[100%]">
                  <Label className="text-sm font-medium text-[var(--foreground)]">
                    1. Asosiy tashkilotni tanlang
                  </Label>
                  <Select
                    value={currentMainOrgId}
                    onValueChange={(value) => {
                      setCurrentMainOrgId(value);
                      setCurrentSecondaryOrgs([]);
                      setMainOrgSearchTerm("");
                    }}
                  >
                    <SelectTrigger className="w-full border-[var(--border)]">
                      <SelectValue placeholder="Asosiy tashkilotni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b border-[var(--border)]">
                        <input
                          type="text"
                          placeholder="Qidirish..."
                          value={mainOrgSearchTerm}
                          onChange={(e) => setMainOrgSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onKeyUp={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {availableMainOrgs
                          .filter((org) =>
                            org.name
                              .toLowerCase()
                              .includes(mainOrgSearchTerm.toLowerCase())
                          )
                          .map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        {availableMainOrgs.filter((org) =>
                          org.name
                            .toLowerCase()
                            .includes(mainOrgSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                            Tashkilot topilmadi
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: Select Secondary Organizations */}
                {currentMainOrgId && (
                  <div className="space-y-3 mb-4">
                    <Label className="text-sm font-medium text-[var(--foreground)]">
                      2. Quyi tashkilotlarni tanlang
                    </Label>
                    {getCurrentSecondaryOrgs().length === 0 ? (
                      <div className="text-sm text-[var(--muted-foreground)] p-3 border border-[var(--border)] rounded-md">
                        Bu asosiy tashkilot uchun quyi tashkilotlar mavjud emas
                      </div>
                    ) : (
                      <MultiSelect
                        options={getCurrentSecondaryOrgs().map((org) => ({
                          value: org.id,
                          label: org.name,
                        }))}
                        selectedValues={currentSecondaryOrgs}
                        onSelectionChange={setCurrentSecondaryOrgs}
                        placeholder="Quyi tashkilotlarni tanlang"
                        searchPlaceholder="Quyi tashkilotlarni qidirish..."
                        emptyMessage="Quyi tashkilot topilmadi"
                      />
                    )}
                  </div>
                )}

                {/* Add Button */}
                {currentMainOrgId && currentSecondaryOrgs.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleAddMainOrganization}
                    className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tashkilotni qo'shish
                  </Button>
                )}
              </div>

              {/* Organization validation errors */}
              {errors.mainOrganizations && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.mainOrganizations}
                </p>
              )}
              {errors.secondaryOrganizations && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.secondaryOrganizations}
                </p>
              )}
            </div>

            {/* Statistics Organizations Filter for Users - Full Width */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Statistika tashkilotlarini tanlang
              </Label>
              <MultiSelect
                options={statisticsOrganizations?.map((org: any) => ({
                  value: org.id,
                  label: org.name,
                }))}
                selectedValues={formData.statisticsOrganizations}
                onSelectionChange={handleStatisticsOrganizationsChange}
                placeholder="Tashkilotlarni tanlang"
                searchPlaceholder="Tashkilotlarni qidirish..."
                emptyMessage="Tashkilot topilmadi"
              />
            </div>

            {/* Responsible Employees - Full Width */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Mas'ul shaxslarni tanlang
              </Label>
              {formData.statisticsOrganizations.length === 0 ? (
                <div className="text-sm text-[var(--muted-foreground)] p-3 border border-[var(--border)] rounded-md">
                  Avval statistika tashkilotlarini tanlang. Shundan so'ng, faqat
                  shu tashkilotlarga tegishli foydalanuvchilar ko'rsatiladi.
                </div>
              ) : (
                <MultiSelect
                  options={filteredUsers.map((user: any) => ({
                    value: user.id,
                    label: `${user.first_name} ${user.last_name}`,
                  }))}
                  selectedValues={formData.responsibleEmployees}
                  onSelectionChange={handleResponsibleEmployeeChange}
                  placeholder="Mas'ul shaxslarni tanlang"
                  searchPlaceholder="Mas'ul shaxslarni qidirish..."
                  emptyMessage="Mas'ul shaxs topilmadi"
                />
              )}
              {errors.responsibleEmployees && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.responsibleEmployees}
                </p>
              )}
            </div>

            {/* Deadline Section - Moved to End */}
            <div className="space-y-6 border-t border-[var(--border)] pt-6">
              <h3 className="text-lg font-bold text-primary">
                Muddat sozlamalari
              </h3>

              {/* Deadline Type Selection */}
              <div className="space-y-3">
                <Label
                  htmlFor="deadline"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Muddat turini tanlang
                </Label>
                <Select
                  value={formData.deadline.period_type}
                  onValueChange={(value) => {
                    let updatedDeadline = {
                      ...formData.deadline,
                      period_type: value,
                    };

                    // Set default values based on period type
                    if (value === "weekly") {
                      updatedDeadline.day_of_week = 0; // Dushanba (Monday)
                    } else if (value === "monthly") {
                      updatedDeadline.day_of_month = 15; // 15th of month
                    } else if (value === "quarterly") {
                      updatedDeadline.quarterly_deadlines = [
                        { quarter: 1, month: 1, day: 15 }, // Yanvar 15
                        { quarter: 2, month: 4, day: 15 }, // Aprel 15
                        { quarter: 3, month: 7, day: 15 }, // Iyul 15
                        { quarter: 4, month: 10, day: 15 }, // Oktabr 15
                      ];
                    } else if (value === "yearly") {
                      updatedDeadline.year_interval = 1; // 1 year interval
                    }

                    setFormData({
                      ...formData,
                      deadline: updatedDeadline,
                    });
                  }}
                >
                  <SelectTrigger
                    className={`w-full border-[var(--border)] ${
                      errors.deadline ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Muddat turini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {deadlineOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deadline && (
                  <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
                )}
              </div>

              {/* Dynamic Deadline Configuration Based on Type */}
              {formData.deadline.period_type && (
                <div className="space-y-4 rounded-lg bg-[var(--muted)]/10">
                  {/* Weekly Configuration */}
                  {formData.deadline.period_type === "weekly" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--foreground)]">
                        Haftaning kunini tanlang
                      </Label>
                      <Select
                        value={formData.deadline.day_of_week?.toString() || ""}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            deadline: {
                              ...formData.deadline,
                              day_of_week: parseInt(value),
                            },
                          });
                        }}
                      >
                        <SelectTrigger className="w-full border-[var(--border)]">
                          <SelectValue placeholder="Haftaning kunini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Dushanba</SelectItem>
                          <SelectItem value="1">Seshanba</SelectItem>
                          <SelectItem value="2">Chorshanba</SelectItem>
                          <SelectItem value="3">Payshanba</SelectItem>
                          <SelectItem value="4">Juma</SelectItem>
                          <SelectItem value="5">Shanba</SelectItem>
                          <SelectItem value="6">Yakshanba</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Monthly Configuration */}
                  {formData.deadline.period_type === "monthly" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--foreground)]">
                        Oyning kunini tanlang
                      </Label>
                      <Select
                        value={formData.deadline.day_of_month?.toString() || ""}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            deadline: {
                              ...formData.deadline,
                              day_of_month: parseInt(value),
                            },
                          });
                        }}
                      >
                        <SelectTrigger className="w-full border-[var(--border)]">
                          <SelectValue placeholder="Kunni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quarterly Configuration */}
                  {formData.deadline.period_type === "quarterly" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((quarter) => {
                          const quarterConfig =
                            formData.deadline.quarterly_deadlines?.find(
                              (q) => q.quarter === quarter
                            );
                          return (
                            <div
                              key={quarter}
                              className="space-y-3 p-3 border border-[var(--border)] rounded-lg"
                            >
                              <h5 className="text-sm font-medium text-[var(--foreground)]">
                                Chorak № {quarter}
                              </h5>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-[var(--muted-foreground)]">
                                    Oyni tanlang
                                  </Label>
                                  <Select
                                    value={
                                      quarterConfig?.month?.toString() || ""
                                    }
                                    onValueChange={(value) => {
                                      const newConfig = [
                                        ...(formData.deadline
                                          .quarterly_deadlines || []),
                                      ];
                                      const existingIndex = newConfig.findIndex(
                                        (q) => q.quarter === quarter
                                      );

                                      if (existingIndex >= 0) {
                                        newConfig[existingIndex] = {
                                          ...newConfig[existingIndex],
                                          month: parseInt(value),
                                        };
                                      } else {
                                        newConfig.push({
                                          quarter,
                                          month: parseInt(value),
                                          day: 15, // Default day
                                        });
                                      }

                                      setFormData({
                                        ...formData,
                                        deadline: {
                                          ...formData.deadline,
                                          quarterly_deadlines: newConfig,
                                        },
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-full border-[var(--border)]">
                                      <SelectValue placeholder="Oy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getQuarterMonths(quarter).map(
                                        (month) => (
                                          <SelectItem
                                            key={month.value}
                                            value={month.value.toString()}
                                          >
                                            {month.label}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs text-[var(--muted-foreground)]">
                                    Kunni tanlang
                                  </Label>
                                  <Select
                                    value={
                                      quarterConfig?.day?.toString() || "15"
                                    }
                                    onValueChange={(value) => {
                                      const newConfig = [
                                        ...(formData.deadline
                                          .quarterly_deadlines || []),
                                      ];
                                      const existingIndex = newConfig.findIndex(
                                        (q) => q.quarter === quarter
                                      );

                                      if (existingIndex >= 0) {
                                        newConfig[existingIndex] = {
                                          ...newConfig[existingIndex],
                                          day: parseInt(value),
                                        };
                                      } else {
                                        newConfig.push({
                                          quarter,
                                          month:
                                            quarterConfig?.month ||
                                            getQuarterMonths(quarter)[0].value,
                                          day: parseInt(value),
                                        });
                                      }

                                      setFormData({
                                        ...formData,
                                        deadline: {
                                          ...formData.deadline,
                                          quarterly_deadlines: newConfig,
                                        },
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-full border-[var(--border)]">
                                      <SelectValue placeholder="Kun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from(
                                        { length: 31 },
                                        (_, i) => i + 1
                                      ).map((day) => (
                                        <SelectItem
                                          key={day}
                                          value={day.toString()}
                                        >
                                          {day}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Yearly Configuration */}
                  {formData.deadline.period_type === "yearly" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-[var(--foreground)]">
                            Birinchi qabul qilish sanasi
                          </Label>
                          <DatePicker
                            placeholder="Birinchi qabul qilish sanasi"
                            value={
                              formData.deadline.current_deadline
                                ? new Date(formData.deadline.current_deadline)
                                : undefined
                            }
                            onValueChange={(date) => {
                              setFormData({
                                ...formData,
                                deadline: {
                                  ...formData.deadline,
                                  current_deadline: date
                                    ? date.toISOString()
                                    : null,
                                },
                              });
                            }}
                            minDate={new Date()}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-[var(--foreground)]">
                            Muddati yillarda (davri)
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.deadline.year_interval || ""}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                deadline: {
                                  ...formData.deadline,
                                  year_interval: parseInt(e.target.value) || 1,
                                },
                              });
                            }}
                            placeholder="Yillik interval"
                            className="w-full border-[var(--border)]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results Preview */}
                  {formData.deadline.period_type && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--foreground)]">
                        Tanlov natijasi:
                      </Label>
                      <div className="p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {formData.deadline.period_type === "weekly" &&
                            formData.deadline.day_of_week !== null && (
                              <div className="space-y-2">
                                <div className="font-medium text-[var(--foreground)]">
                                  Haftalik:{" "}
                                  {getDayName(formData.deadline.day_of_week)}
                                </div>
                                <div className="text-xs">
                                  Keyingi 8 ta muddat:
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {getNextDeadlines(
                                    "weekly",
                                    formData.deadline.day_of_week,
                                    8
                                  ).map((date, index) => (
                                    <div
                                      key={index}
                                      className="text-center p-2 bg-[var(--primary)] text-white rounded text-xs"
                                    >
                                      {date.toLocaleDateString("uz-UZ")}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          {formData.deadline.period_type === "monthly" &&
                            formData.deadline.day_of_month && (
                              <div className="space-y-2">
                                <div className="font-medium text-[var(--foreground)]">
                                  Oylik: Har oyning{" "}
                                  {formData.deadline.day_of_month}-kuni
                                </div>
                                <div className="text-xs">
                                  Bir yillik muddatlar:
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {getNextDeadlines(
                                    "monthly",
                                    formData.deadline.day_of_month,
                                    12
                                  ).map((date, index) => (
                                    <div
                                      key={index}
                                      className="text-center p-2 bg-[var(--primary)] text-white rounded text-xs"
                                    >
                                      {date.getDate()}-
                                      {getMonthName(date.getMonth() + 1)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          {formData.deadline.period_type === "quarterly" &&
                            formData.deadline.quarterly_deadlines && (
                              <div className="grid grid-cols-4 gap-2">
                                {formData.deadline.quarterly_deadlines.map(
                                  (quarter, index) => (
                                    <div
                                      key={index}
                                      className="text-center p-2 bg-[var(--primary)] text-white rounded"
                                    >
                                      Chorak № {index + 1}
                                      <br />
                                      {quarter.month &&
                                        quarter.day &&
                                        `${getMonthName(quarter.month)} ${
                                          quarter.day
                                        }`}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          {formData.deadline.period_type === "yearly" &&
                            formData.deadline.current_deadline && (
                              <div className="space-y-2">
                                <div className="font-medium text-[var(--foreground)]">
                                  Yillik:{" "}
                                  {new Date(
                                    formData.deadline.current_deadline
                                  ).toLocaleDateString("uz-UZ")}{" "}
                                  dan boshlab
                                  {formData.deadline.year_interval &&
                                    ` har ${formData.deadline.year_interval} yilda`}
                                </div>
                                <div className="text-xs">
                                  Keyingi 8 ta muddat:
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {getNextDeadlines(
                                    "yearly",
                                    formData.deadline.current_deadline,
                                    formData.deadline.year_interval || 1,
                                    8
                                  ).map((date, index) => (
                                    <div
                                      key={index}
                                      className="text-center p-2 bg-[var(--primary)] text-white rounded text-xs"
                                    >
                                      {date.toLocaleDateString("uz-UZ")}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Current Deadline Date Picker */}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 ">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[var(--border)]"
              >
                Bekor qilish
              </Button>
              <LoadingButton
                type="submit"
                disabled={!isFormValid()}
                isPending={isLoading}
              >
                {mode === "create" ? "Saqlash" : "O'zgarishlarni saqlash"}
              </LoadingButton>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
