"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { getSmartDepoUrl } from "@/lib/config";
import { ArrowRight, Loader2, Shield, Zap, Users } from "lucide-react";
import { config } from "@/lib/config";
import { useEchLogin, useLogin } from "@/api/hooks/use-auth";

// Dev-only credentials form is compiled away in production builds.
const IS_DEV = process.env.NODE_ENV === "development";

export default function LoginPage() {
  const [smartDepoUrl, setSmartDepoUrl] = useState("https://mydepo.uz/");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showEchLogin, setShowEchLogin] = useState(false);
  const [echUsername, setEchUsername] = useState("");
  const [echPassword, setEchPassword] = useState("");
  const { mutate: login, isPending, isError, error } = useLogin();
  const echLogin = useEchLogin();

  useEffect(() => {
    const redirectUri = encodeURIComponent(window.location.origin);
    setSmartDepoUrl(`${getSmartDepoUrl()}/?redirect_uri=${redirectUri}`);
  }, []);

  const handleSsoLogin = () => {
    window.location.href = config.ssoLoginUrl;
  };

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || isPending) return;
    login({ username, password });
  };

  const handleEchLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!echUsername || !echPassword || echLogin.isPending) return;
    echLogin.mutate({ username: echUsername, password: echPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-surface-muted via-primary-subtle to-category-indigo/10">
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
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
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
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-category-indigo/20 rounded-full blur-3xl"
        ></motion.div>
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-category-violet/10 rounded-full blur-3xl"></div>
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
          <div className="backdrop-blur-xl bg-background/80 rounded-xl shadow-2xl border border-background/20 p-8 md:p-10">
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-brand-purple rounded-xl blur-lg opacity-50"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center shadow-xl">
                    <div className="grid grid-cols-2 gap-1.5 p-2">
                      <div className="w-3 h-3 bg-background rounded-md"></div>
                      <div className="w-3 h-3 bg-background/80 rounded-md"></div>
                      <div className="w-3 h-3 bg-background/80 rounded-md"></div>
                      <div className="w-3 h-3 bg-background rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary to-brand-purple bg-clip-text text-transparent mb-3">
                Tamir Tahlili Tizimi
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
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
              <div className="bg-gradient-to-r from-primary-subtle to-category-indigo/10 rounded-xl p-6 border border-primary-subtle/50">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                      Tizimga kirish{" "}
                      <span className="font-semibold text-primary">
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
              <div className="text-center p-4 rounded-lg bg-background/50 border border-muted">
                <Zap className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Tezkor</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border border-muted">
                <Shield className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Xavfsiz</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border border-muted">
                <Users className="w-5 h-5 text-brand-purple mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Qulay</p>
              </div>
            </motion.div>

            {/* Login: SSO buttons in production, credentials form in dev */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col gap-3"
            >
              {!IS_DEV && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      asChild
                      className="h-14 text-sm font-semibold bg-gradient-to-r from-primary via-primary to-brand-purple text-primary-foreground shadow-lg group"
                    >
                      <Link
                        href={smartDepoUrl}
                        className="flex items-center justify-center gap-2"
                      >
                        <span>MyDepo orqali kirish</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEchLogin((value) => !value)}
                      className="h-14 text-sm font-semibold border-2 border-success text-success hover:bg-success-subtle"
                    >
                      ECH foydalanuvchisi
                    </Button>
                  </div>

                  <Button
                    onClick={handleSsoLogin}
                    className="w-full h-14 text-base font-semibold bg-background hover:bg-surface-muted text-primary border-2 border-primary shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>SSO orqali kirish</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </>
              )}

              {IS_DEV && (
                <form onSubmit={handleDevLogin} className="flex flex-col gap-3">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Login"
                    autoComplete="username"
                    className="h-12 bg-background"
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Parol"
                    autoComplete="current-password"
                    className="h-12 bg-background"
                  />
                  {isError && (
                    <p className="text-sm text-destructive">
                      {(error as any)?.response?.data?.detail ||
                        (error as any)?.response?.data?.non_field_errors?.[0] ||
                        "Login yoki parol noto'g'ri"}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={isPending || !username || !password}
                    className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary via-primary to-brand-purple hover:from-brand-blue hover:via-brand-blue-light hover:to-brand-violet text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 group disabled:opacity-60"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                      <span>Kirish</span>
                      {!isPending && (
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      )}
                    </span>
                  </Button>
                  <p className="text-center text-xs text-foreground-subtle">
                    Dev rejimi — login/parol orqali kirish
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEchLogin((value) => !value)}
                    className="h-12 border-2 border-success text-success hover:bg-success-subtle"
                  >
                    ECH foydalanuvchisi sifatida kirish
                  </Button>
                </form>
              )}

              {showEchLogin && (
                <form
                  onSubmit={handleEchLogin}
                  className="mt-2 flex flex-col gap-3 rounded-xl border border-success/30 bg-success-subtle/60 p-4"
                >
                  <p className="text-sm font-semibold text-success">
                    ECH foydalanuvchisi kirishi
                  </p>
                  <Input
                    value={echUsername}
                    onChange={(event) => setEchUsername(event.target.value)}
                    placeholder="Login"
                    autoComplete="username"
                    className="h-12 bg-background"
                  />
                  <Input
                    type="password"
                    value={echPassword}
                    onChange={(event) => setEchPassword(event.target.value)}
                    placeholder="Parol"
                    autoComplete="current-password"
                    className="h-12 bg-background"
                  />
                  {echLogin.isError && (
                    <p className="text-sm text-destructive">
                      {(echLogin.error as any)?.response?.data?.detail ||
                        echLogin.error?.message ||
                        "Login yoki parol noto'g'ri"}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      echLogin.isPending || !echUsername || !echPassword
                    }
                    variant="success"
                    className="h-12"
                  >
                    {echLogin.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    ECH tizimiga kirish
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Footer Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                Nosoz ishni tezda yuborish kerakmi?{" "}
                <Link
                  href="/defective-works/create"
                  className="font-semibold text-primary hover:text-brand-blue hover:underline transition-colors"
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
          <p className="text-xs text-foreground-subtle">
            © {new Date().getFullYear()} Smart Depo. Barcha huquqlar
            himoyalangan.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
