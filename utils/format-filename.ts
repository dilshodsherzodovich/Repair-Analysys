import { truncate } from "@/lib/utils";

export const formatFilename = (filename: string) => {
  return filename.split("/").pop() || "download";
};

export const truncateFilename = (
  fileString: string,
  options: { length?: number } = {}
) => {
  const { length = 100 } = options;
  const lastSegment = fileString?.split("/").pop() ?? "";
  if (!lastSegment) return "";

  const lastDotIndex = lastSegment.lastIndexOf(".");
  const hasExtension =
    lastDotIndex > 0 && lastDotIndex < lastSegment.length - 1;

  const namePart = hasExtension
    ? lastSegment.slice(0, lastDotIndex)
    : lastSegment;
  const extension = hasExtension ? lastSegment.slice(lastDotIndex + 1) : "";

  const truncated = truncate(namePart, { length });
  return extension ? `${truncated}.${extension}` : truncated;
};
