import { UserRole } from "@/api/types/user";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPageCount(
  totalItems: number,
  itemsPerPage: number = 10
): number {
  return Math.ceil(totalItems / itemsPerPage);
}

export const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("uz-UZ");
  } catch {
    return dateString;
  }
};

export const getRoleName = (roleName: UserRole): string => {
  switch (roleName) {
    case "admin": {
      return "Administrator";
    }
    case "tamir tehnik": {
      return "Ta'mir tehnik";
    }
    default: {
      return "";
    }
  }
};

export const truncate = (text: string, options: { length: number }) => {
  return text.length > options.length
    ? text.slice(0, options.length) + "..."
    : text;
};

export const getFileName = (url: string) => {
  if (!url) return "Fayl topilmadi";
  const fileName = url.split("/").pop() || "download";

  return truncate(fileName, { length: 100 });
};
