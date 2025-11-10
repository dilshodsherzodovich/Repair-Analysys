import { TableCell } from "./table";
import { TableRow } from "./table";
import { Skeleton } from "./skeleton";

export function TableSkeleton({
  rows = 5,
  columns = 7,
}: {
  rows?: number;
  columns?: number;
}) {
  return Array.from({ length: rows }).map((_, index) => (
    <TableRow key={index}>
      <TableCell colSpan={columns} className="p-3">
        <Skeleton className="h-10 w-full" />
      </TableCell>
    </TableRow>
  ));
}
