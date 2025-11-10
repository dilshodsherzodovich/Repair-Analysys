"use client";

import { useState } from "react";
import {
  Calendar,
  Building2,
  FileText,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Bulletin } from "@/api/types/bulleten";

interface BulletinDetailsCardProps {
  bulletin: Bulletin;
}

export function BulletinDetailsCard({ bulletin }: BulletinDetailsCardProps) {
  const [showOrganizations, setShowOrganizations] = useState(false);

  const getDeadlineLabel = (periodType: string) => {
    switch (periodType) {
      case "weekly":
        return "Haftalik";
      case "monthly":
        return "Oylik";
      case "quarterly":
        return "Choraklik";
      case "every_n_months":
        return "Har n oy";
      default:
        return periodType;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* First Row - Basic Details */}
        <div className="grid grid-cols-12 gap-4 text-sm">
          <div className="flex items-start gap-2 col-span-3">
            <FileText className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5" />
            <div>
              <span className="text-[var(--muted-foreground)]">Nomi:</span>
              <p className="font-bold text-[var(--foreground)]">
                {bulletin.name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 col-span-3">
            <FileText className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5" />
            <div>
              <span className="text-[var(--muted-foreground)]">Tavsif:</span>
              <p className="font-bold text-[var(--foreground)]">
                {bulletin.description || "Tavsif yo'q"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 col-span-3">
            <Calendar className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5" />
            <div>
              <span className="text-[var(--muted-foreground)]">
                Joriy muddat:
              </span>
              <p className="font-bold text-[var(--foreground)]">
                {bulletin.deadline?.current_deadline
                  ? formatDate(bulletin.deadline.current_deadline)
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 col-span-3">
            <Calendar className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5" />
            <div>
              <span className="text-[var(--muted-foreground)]">
                Muddat turi:
              </span>
              <p className="font-bold text-[var(--foreground)]">
                {getDeadlineLabel(bulletin.deadline?.period_type || "")}
              </p>
            </div>
          </div>
        </div>

        {/* Second Row - Organizations (Collapsible) */}
        <div className="col-span-12">
          <div className="flex items-center ">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setShowOrganizations(!showOrganizations)}
            >
              <Building2 className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span className="text-[var(--muted-foreground)] text-sm">
                Tashkilotlar:
              </span>
              <Badge variant="secondary" className="text-xs">
                {bulletin.main_organizations_list?.length || 0} ta
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOrganizations(!showOrganizations)}
              className="h-8 px-2 hover:bg-transparent hover:text-primary"
            >
              {showOrganizations ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {showOrganizations && (
            <div className="mt-3 space-y-3">
              {bulletin.main_organizations_list?.map((org) => (
                <div
                  key={org.id}
                  className="border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/10"
                >
                  <div className="text-sm font-medium text-[var(--foreground)] mb-2">
                    {org.name}
                  </div>
                  {org.secondary_organizations &&
                  org.secondary_organizations.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted-foreground)] font-medium">
                        Quyi tashkilotlar:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {org.secondary_organizations.map((dept) => (
                          <Badge
                            key={dept.id}
                            variant="secondary"
                            className="text-xs px-2 py-1 border-[var(--border)] break-words whitespace-normal"
                          >
                            {dept.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--muted-foreground)] italic">
                      Quyi tashkilotlar yo'q
                    </div>
                  )}
                </div>
              )) || (
                <div className="text-sm text-[var(--muted-foreground)] italic">
                  Tashkilotlar tanlanmagan
                </div>
              )}
            </div>
          )}
        </div>

        {/* Third Row - Additional Details */}
        <div className="grid grid-cols-12 gap-4 text-sm">
          <div className="flex items-start gap-2 col-span-3">
            <Calendar className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5" />
            <div>
              <span className="text-[var(--muted-foreground)]">
                Yaratilgan sanasi:
              </span>
              <p className="font-bold text-[var(--foreground)]">
                {bulletin.created ? formatDate(bulletin.created) : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 col-span-9">
            <Users className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5" />
            <div className="flex-1">
              <span className="text-[var(--muted-foreground)]">
                Mas'ul xodimlar:
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {bulletin.employees_list?.map((employee) => (
                  <Badge
                    key={employee.id}
                    variant="outline"
                    className="text-xs px-2 py-1 border-[var(--border)] bg-[var(--primary)]/10 text-[var(--primary)] break-words"
                  >
                    {employee.first_name} {employee.last_name}
                  </Badge>
                )) || (
                  <span className="text-[var(--muted-foreground)] text-sm">
                    Xodimlar yo'q
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
 