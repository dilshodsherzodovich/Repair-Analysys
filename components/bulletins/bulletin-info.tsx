"use client";

import { Card } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Bulletin } from "@/api/types/bulleten";

interface BulletinInfoProps {
  bulletin: Bulletin;
}

const deadlineLabels: { [key: string]: string } = {
  weekly: "Haftalik",
  monthly: "Oylik",
  quarterly: "Choraklik",
  every_n_months: "Har N oyda",
  daily: "Kunlik",
  yearly: "Yillik",
};

export function BulletinInfo({ bulletin }: BulletinInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Asosiy ma'lumotlar
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)]">
              Nomi
            </label>
            <p className="text-[var(--foreground)]">{bulletin.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)]">
              Tavsifi
            </label>
            <p className="text-[var(--foreground)]">{bulletin.description}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)]">
              Muddat turi
            </label>
            <Badge variant="secondary" className="mt-1">
              {deadlineLabels[bulletin.deadline?.period_type] ||
                bulletin.deadline?.period_type ||
                "N/A"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Organizations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Tashkilotlar
        </h3>
        <div className="space-y-3">
          {(bulletin.main_organizations_list || []).map((mainOrg) => (
            <div
              key={mainOrg.id}
              className="border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/10"
            >
              <div className="font-medium text-[var(--foreground)] mb-2">
                {mainOrg.name}
              </div>
              {mainOrg.secondary_organizations &&
              mainOrg.secondary_organizations.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {mainOrg.secondary_organizations.map((secOrg) => (
                    <Badge
                      key={secOrg.id}
                      variant="outline"
                      className="text-xs"
                    >
                      {secOrg.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[var(--muted-foreground)] italic">
                  Ikkinchi darajali tashkilotlar yo'q
                </div>
              )}
            </div>
          ))}
          {(!bulletin.main_organizations_list ||
            bulletin.main_organizations_list.length === 0) && (
            <div className="text-sm text-[var(--muted-foreground)] italic">
              Tashkilotlar tanlanmagan
            </div>
          )}
        </div>
      </Card>

      {/* Responsible Persons */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Mas'ul shaxslar
        </h3>
        <div className="space-y-2">
          {(bulletin.employees_list || []).map((emp) => (
            <Badge
              key={emp.id}
              variant="outline"
              className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20"
            >
              {emp.first_name} {emp.last_name}
            </Badge>
          ))}
          {(!bulletin.employees_list ||
            bulletin.employees_list.length === 0) && (
            <div className="text-sm text-[var(--muted-foreground)] italic">
              Mas'ul shaxslar tanlanmagan
            </div>
          )}
        </div>
      </Card>

      {/* Additional Information */}
      <Card className="p-6 md:col-span-2 lg:col-span-3">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Qo'shimcha ma'lumotlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)]">
              Yaratilgan sana
            </label>
            <p className="text-[var(--foreground)]">
              {bulletin.created
                ? new Date(bulletin.created).toLocaleDateString("uz-UZ")
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)]">
              Oxirgi yangilanish
            </label>
            <p className="text-[var(--foreground)]">
              {bulletin.updated
                ? new Date(bulletin.updated).toLocaleDateString("uz-UZ")
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)]">
              Yaratuvchi
            </label>
            <p className="text-[var(--foreground)]">
              {bulletin.user_info?.full_name ||
                bulletin.user_info?.username ||
                "N/A"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
