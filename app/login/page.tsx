"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/ui/button";
import { getSmartDepoUrl } from "@/lib/config";

export default function LoginPage() {
  const [smartDepoUrl, setSmartDepoUrl] = useState("https://smartdepo.uz/");

  useEffect(() => {
    const redirectUri = encodeURIComponent(window.location.origin);
    setSmartDepoUrl(`${getSmartDepoUrl()}/?redirect_uri=${redirectUri}`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="rounded-lg border border-[#e5e7eb] shadow-sm p-8 bg-white">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2354bf] to-[#4978ce] rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                  <div className="w-2 h-2 bg-white/80 rounded-sm"></div>
                  <div className="w-2 h-2 bg-white/80 rounded-sm"></div>
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#1f2937] mb-2">
              Tamir Tahlili Tizimi
            </h1>
          </div>

          {/* Login Section */}
          <div className="mb-6">
            <p className="text-sm text-[#6b7280] mb-6">
              Tizimga kirish Smart Depo autentifikatsiya xizmati orqali amalga
              oshiriladi.
            </p>
          </div>

          {/* Smart Depo Login Button */}
          <Button asChild className="w-full h-12 text-base font-semibold">
            <Link href={smartDepoUrl}>Smart Depo tizimi orqali kirish</Link>
          </Button>

          {/* Footer Link */}
          <div className="mt-6 text-center text-sm text-[#6b7280]">
            <p>
              Nosoz ishni tezda yuborish kerakmi?{" "}
              <Link
                href="/defective-works/create"
                className="font-semibold text-[#2354bf] hover:underline"
              >
                Xabar berish sahifasiga o'ting
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#9ca3af]">
            © {new Date().getFullYear()} Smart Depo. Barcha huquqlar
            himoyalangan.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
