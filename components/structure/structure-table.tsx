"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Checkbox } from "@/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Card } from "@/ui/card";
import { StructureFilters } from "./structure-filters";
import Link from "next/link";

interface Bulletin {
  id: string;
  name: string;
  category: string;
  createdDate: string;
  responsibleAssigned: boolean;
  responsible: string;
  status: "active" | "inactive" | "completed";
  responsibleDepartment: string;
  receivingOrganizations: string[];
  responsiblePersons: string[];
  periodType: string;
}

interface StructureTableProps {
  bulletins: Bulletin[];
}

export function StructureTable({ bulletins }: StructureTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredBulletins = bulletins.filter((bulletin) => {
    const matchesSearch = bulletin.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || bulletin.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || bulletin.status === statusFilter;
    const matchesDepartment =
      departmentFilter === "all" ||
      bulletin.responsibleDepartment === departmentFilter;
    return (
      matchesSearch && matchesCategory && matchesStatus && matchesDepartment
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredBulletins.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // Mock data for display purposes
  const organizationLabels: { [key: string]: string } = {
    org1: "Byulletenni qabul qiluvchi davlat idorasi 1",
    org2: "Byulletenni qabul qiluvchi davlat idorasi 2",
    org3: "Byulletenni qabul qiluvchi davlat idorasi 3",
    org4: "Byulletenni qabul qiluvchi davlat idorasi 4",
    org5: "Byulletenni qabul qiluvchi davlat idorasi 5",
    org6: "Byulletenni qabul qiluvchi davlat idorasi 6",
    org7: "Byulletenni qabul qiluvchi davlat idorasi 7",
    org8: "Byulletenni qabul qiluvchi davlat idorasi 8",
  };

  const personLabels: { [key: string]: string } = {
    person1: "Umarov A.P.",
    person2: "Siddiqov M.R.",
    person3: "Karimov Sh.T.",
    person4: "Axmedov N.K.",
    person5: "Yusupov D.A.",
    person6: "Rahimov T.S.",
    person7: "Mirzaev K.X.",
    person8: "Safarov A.M.",
  };

  return (
    <Card className="rounded-xl">
      <StructureFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCount={selectedIds.length}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
      />
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-[var(--table-header-fg)]">
              <TableHead className="w-12 p-3">
                <Checkbox
                  checked={
                    selectedIds.length === filteredBulletins.length &&
                    filteredBulletins.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-16 p-3">№</TableHead>
              <TableHead className="p-3">Byulleten nomi</TableHead>
              <TableHead className="p-3">Mas'ul Quyi tashkilot</TableHead>
              <TableHead className="p-3">Qabul qiluvchi tashkilotlar</TableHead>
              <TableHead className="p-3">Mas'ul shaxslar</TableHead>
              <TableHead className="p-3">Muddat turi</TableHead>
              <TableHead className="p-3">Yaratilgan sana</TableHead>
              <TableHead className="p-3">Holat</TableHead>
              <TableHead className="w-20 p-3">Struktura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBulletins.map((bulletin, index) => (
              <TableRow
                key={bulletin.id}
                className="transition-colors hover:bg-muted/50"
              >
                <TableCell className="p-3">
                  <Checkbox
                    checked={selectedIds.includes(bulletin.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(bulletin.id, !!checked)
                    }
                  />
                </TableCell>
                <TableCell className="font-semibold text-[var(--primary)] p-3">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium p-3 max-w-xs">
                  <div className="truncate" title={bulletin.name}>
                    {bulletin.name}
                  </div>
                </TableCell>
                <TableCell className="p-3">
                  <Badge
                    variant="secondary"
                    className="bg-[var(--muted)] text-[var(--foreground)] border-none"
                  >
                    {bulletin.responsibleDepartment}
                  </Badge>
                </TableCell>
                <TableCell className="p-3 max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {bulletin.receivingOrganizations.map((orgId) => (
                      <Badge
                        key={orgId}
                        variant="outline"
                        className="text-xs px-2 py-1 border-[var(--border)]"
                      >
                        {organizationLabels[orgId] || orgId}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="p-3 max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {bulletin.responsiblePersons.map((personId) => (
                      <Badge
                        key={personId}
                        variant="outline"
                        className="text-xs px-2 py-1 border-[var(--border)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      >
                        {personLabels[personId] || personId}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="p-3">
                  <Badge
                    variant="secondary"
                    className="bg-[var(--muted)]/50 text-[var(--foreground)] border-none"
                  >
                    {bulletin.periodType}
                  </Badge>
                </TableCell>
                <TableCell className="p-3 text-[var(--muted-foreground)]">
                  {bulletin.createdDate}
                </TableCell>
                <TableCell className="p-3">
                  <Badge
                    variant={
                      bulletin.status === "active" ? "default" : "secondary"
                    }
                    className={
                      bulletin.status === "active"
                        ? "bg-green-100 text-green-800 border-none"
                        : bulletin.status === "completed"
                        ? "bg-blue-100 text-blue-800 border-none"
                        : "bg-gray-100 text-gray-800 border-none"
                    }
                  >
                    {bulletin.status === "active"
                      ? "Faol"
                      : bulletin.status === "completed"
                      ? "Bajarilgan"
                      : "Nofaol"}
                  </Badge>
                </TableCell>
                <TableCell className="p-3">
                  <Link
                    href={`/bulletins/${bulletin.id}/structure`}
                    className="inline-flex items-center justify-center h-8 w-8 p-0 border border-[var(--border)] rounded-md hover:bg-[var(--primary)]/10 transition-colors"
                    aria-label="Struktura"
                  >
                    <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredBulletins.length === 0 && (
        <div className="text-center py-8 text-[var(--muted-foreground)]">
          Byulletenlar topilmadi.
        </div>
      )}
    </Card>
  );
}
