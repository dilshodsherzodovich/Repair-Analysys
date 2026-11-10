"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authService } from "@/api/services/auth.service";
import { storeAuth } from "@/api/hooks/use-auth";
import { Button } from "@/ui/button";

import { LoadingScreen } from "@/ui/empty-state";
function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const called = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState<string | null>(null);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state") ?? undefined;

    if (!code) {
      router.replace("/login");
      return;
    }

    const attempt = (retriesLeft: number) => {
      authService
        .oauthCallback(code, state)
        .then((data) => {
          storeAuth(data);
          const role = data.role?.toLowerCase() || "";
          const orgId = data.branch?.organization?.id;

          if (role === "sriv_moderator" || role === "sriv_admin") {
            router.replace("/delays");
          } else if (role === "repair_staff") {
            router.replace(`/duty-uzel/${orgId}`);
          } else if (role === "passport_staff") {
            router.replace(`/depo/${orgId}`);
          } else {
            router.replace("/");
          }
        })
        .catch((err) => {
          if (err?.response?.status === 400) {
            const detail =
              err.response?.data?.detail || "Bu tizimga kirishga ruxsat yo'q.";
            setUnauthorized(detail);
            return;
          }
          if (retriesLeft > 0) {
            attempt(retriesLeft - 1);
          } else {
            setError(
              "Autentifikatsiya muvaffaqiyatsiz. Iltimos, qayta urinib ko'ring.",
            );
          }
        });
    };

    attempt(2);
  }, [searchParams, router]);

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-destructive-subtle rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Ruxsat yo'q
          </h2>
          <p className="text-muted-foreground mb-6">{unauthorized}</p>
          <Button size="lg" className="w-full"
            onClick={() => authService.logout()}
          >
            Boshqa hisob bilan kirish
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="link" className="h-auto p-0"
            onClick={() => router.replace("/login")}
          >
            Kirish sahifasiga qaytish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LoadingScreen label="Autentifikatsiya amalga oshirilmoqda..." />
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <LoadingScreen />
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
