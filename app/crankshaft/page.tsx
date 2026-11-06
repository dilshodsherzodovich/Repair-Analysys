"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/api/services/auth.service";

/** The list lives per organization; open the user's own one. */
export default function CrankshaftIndexPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const user = authService.getUser();
      const orgId = user?.branch?.organization?.id;
      router.replace(orgId ? `/crankshaft/${orgId}` : "/");
    } catch {
      router.replace("/");
    }
  }, [router]);

  return null;
}
