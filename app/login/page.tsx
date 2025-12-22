"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/ui/button";
import { getSmartDepoUrl } from "@/lib/config";
import { ArrowRight, Shield, Zap, Users } from "lucide-react";

export default function LoginPage() {
  const [smartDepoUrl, setSmartDepoUrl] = useState("https://mydepo.uz/");

  useEffect(() => {
    const redirectUri = encodeURIComponent(window.location.origin);
    setSmartDepoUrl(`${getSmartDepoUrl()}/?redirect_uri=${redirectUri}`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
        ></motion.div>
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"
        ></motion.div>
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg mx-auto px-6 py-12 relative z-10"
      >
        {/* Main Card */}
        <div className="relative">
          {/* Glassmorphism Card */}
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-white/20 p-8 md:p-10">
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2354bf] via-[#4978ce] to-[#644ac4] rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-[#2354bf] to-[#4978ce] rounded-2xl flex items-center justify-center shadow-xl">
                    <div className="grid grid-cols-2 gap-1.5 p-2">
                      <div className="w-3 h-3 bg-white rounded-md"></div>
                      <div className="w-3 h-3 bg-white/80 rounded-md"></div>
                      <div className="w-3 h-3 bg-white/80 rounded-md"></div>
                      <div className="w-3 h-3 bg-white rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#2354bf] via-[#4978ce] to-[#644ac4] bg-clip-text text-transparent mb-3">
                Tamir Tahlili Tizimi
              </h1>
              <p className="text-[#64748b] text-sm md:text-base">
                Lokomotivlardan foydalanish tizimi
              </p>
            </motion.div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100/50">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#2354bf] to-[#4978ce] rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#475569] leading-relaxed">
                      Tizimga kirish{" "}
                      <span className="font-semibold text-[#2354bf]">
                        Smart Depo
                      </span>{" "}
                      autentifikatsiya xizmati orqali amalga oshiriladi.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <div className="text-center p-4 rounded-lg bg-white/50 border border-gray-100">
                <Zap className="w-5 h-5 text-[#4978ce] mx-auto mb-2" />
                <p className="text-xs text-[#64748b] font-medium">Tezkor</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/50 border border-gray-100">
                <Shield className="w-5 h-5 text-[#2354bf] mx-auto mb-2" />
                <p className="text-xs text-[#64748b] font-medium">Xavfsiz</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/50 border border-gray-100">
                <Users className="w-5 h-5 text-[#644ac4] mx-auto mb-2" />
                <p className="text-xs text-[#64748b] font-medium">Qulay</p>
              </div>
            </motion.div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button
                asChild
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-[#2354bf] via-[#4978ce] to-[#644ac4] hover:from-[#1e47a8] hover:via-[#3d6bc4] hover:to-[#5538a8] text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Link
                  href={smartDepoUrl}
                  className="flex items-center justify-center gap-2"
                >
                  <span>Smart Depo tizimi orqali kirish</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>

            {/* Footer Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-[#64748b]">
                Nosoz ishni tezda yuborish kerakmi?{" "}
                <Link
                  href="/defective-works/create"
                  className="font-semibold text-[#2354bf] hover:text-[#1e47a8] hover:underline transition-colors"
                >
                  Xabar berish sahifasiga o'ting
                </Link>
                .
              </p>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-[#94a3b8]">
            © {new Date().getFullYear()} Smart Depo. Barcha huquqlar
            himoyalangan.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
