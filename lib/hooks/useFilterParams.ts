import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useFilterParams = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset page when filters change
    if (updates.page === undefined) {
      params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const getQueryValue = (name: string) => searchParams.get(name) || "";

  const getAllQueryValues = (): Record<string, string> => {
    return Object.fromEntries(searchParams.entries());
  };

  return {
    updateQuery,
    getQueryValue,
    getAllQueryValues,
  };
};
