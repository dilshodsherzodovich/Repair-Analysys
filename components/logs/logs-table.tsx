"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Card } from "@/ui/card";
import PageFilters from "@/ui/filters";
import { Pagination } from "@/ui/pagination";
import { PaginatedData } from "@/api/types/general";
import { ContentType, ContentTypeVerbose, LogItem } from "@/api/types/logs";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { TableSkeleton } from "@/ui/table-skeleton";
import { useUsers } from "@/api/hooks/use-user";
import { format, formatDate } from "date-fns";
import { uz } from "date-fns/locale";
import { getPageCount } from "@/lib/utils";

interface LogsTableProps {
  logs?: PaginatedData<LogItem>;
  isLoading?: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export default function LogsTable({
  logs,
  isLoading,
  page,
  onPageChange,
}: LogsTableProps) {
  const { updateQuery } = useFilterParams();

  const { data: users, isPending: isGettingUsers } = useUsers({
    no_page: true,
  });

  const contentTypeOptions: {
    value: ContentType;
    label: ContentTypeVerbose;
  }[] = [
    {
      value: "CustomUser",
      label: "Foydalanuvchi",
    },
    {
      value: "Profile",
      label: "Profile",
    },
    {
      value: "Classificator",
      label: "Classificator",
    },
    {
      value: "Element",
      label: "Element",
    },
    {
      value: "Organization",
      label: "Tashkilot",
    },
    {
      value: "SecondaryOrganization",
      label: "Quyi tashkilot",
    },
    {
      value: "Journal",
      label: "Bulleten",
    },
    {
      value: "Column",
      label: "Ustun",
    },
    {
      value: "RowValue",
      label: "Qator qiymati",
    },
    {
      value: "UploadedFile",
      label: "Fayl",
    },
    {
      value: "JournalUploadHistory",
      label: "Bulleten tarihi",
    },
  ];

  const filters = useMemo(() => {
    return [
      {
        name: "user",
        label: "Bajaruvchi",
        isSelect: true,
        options: [
          { label: "Barcha foydalanuvchilar", value: "" },
          ...(users?.results.map((user) => ({
            label: user.first_name + user.last_name,
            value: user.id,
          })) || []),
        ],
        placeholder: "Barcha foydalanuvchilar",
        searchable: true,
        clearable: true,
        Loading: isGettingUsers,
      },
      {
        name: "content_type",
        label: "Kontent",
        isSelect: true,
        options: [
          { label: "Barcha kontentlar", value: "" },
          ...contentTypeOptions,
        ],
        placeholder: "Barcha kontentlar",
        searchable: true,
        clearable: true,
        Loading: false,
      },
      {
        name: "action",
        label: "Harakat",
        isSelect: true,
        options: [
          { label: "Barcha harakatlar", value: "" },
          {
            label: "Get",
            value: "get",
          },
          {
            label: "Yaratish",
            value: "post",
          },
          {
            label: "Yangilash",
            value: "update",
          },
          {
            label: "O'chirish",
            value: "delete",
          },
          {
            label: "Tizimga kirish",
            value: "login",
          },
          {
            label: "Tizimdan chiqish",
            value: "logout",
          },
        ],
        placeholder: "Barcha harakatlar",
        searchable: true,
        clearable: true,
        Loading: false,
      },
    ];
  }, [users]);

  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <PageFilters filters={filters} />

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead className="max-w-[100px]">Tavsif</TableHead>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Amal</TableHead>
                <TableHead>Kontent</TableHead>
                <TableHead>Vaqt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={8} columns={6} />
              ) : logs?.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-sm whitespace-nowrap text-[var(--muted-foreground)]">
                      Loglar topilmadi.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {logs?.results?.map((log, idx) => (
                    <TableRow key={(log as any).id ?? idx}>
                      <TableCell>{(page - 1) * 10 + idx + 1}</TableCell>
                      <TableCell
                        className="max-w-[420px] truncate"
                        title={log.description || ""}
                      >
                        {log.description}
                      </TableCell>
                      <TableCell>
                        {log.user_info?.full_name ?? log.user_info?.username}
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        {log.content_type_verbose ?? log.content_type}
                      </TableCell>
                      <TableCell>
                        {log.created
                          ? format(log?.created, "dd.MM.yy HH:mm")
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>

          <Pagination
            onPageChange={onPageChange}
            currentPage={+page}
            totalPages={getPageCount(logs?.count || 0, 10) || 1}
          />
        </div>
      </Card>
    </div>
  );
}
