"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authService } from "@/api/services/auth.service";
import { storeAuth } from "@/api/hooks/use-auth";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Ruxsat yo'q
          </h2>
          <p className="text-gray-500 mb-6">{unauthorized}</p>
          <button
            onClick={() => authService.logout()}
            className="w-full h-11 bg-gradient-to-r from-[#2354bf] to-[#4978ce] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Boshqa hisob bilan kirish
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="text-[#2354bf] hover:underline"
          >
            Kirish sahifasiga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Autentifikatsiya amalga oshirilmoqda...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
