import { TableCell } from "./table";
import { TableRow } from "./table";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

export function TableSkeleton({
  rows = 5,
  columns = 7,
  cellClassName,
}: {
  rows?: number;
  columns?: number;
  cellClassName?: string;
}) {
  return Array.from({ length: rows }).map((_, index) => (
    <TableRow key={index}>
      <TableCell colSpan={columns} className={cn("p-3", cellClassName)}>
        <Skeleton className="h-10 w-full" />
      </TableCell>
    </TableRow>
  ));
}
