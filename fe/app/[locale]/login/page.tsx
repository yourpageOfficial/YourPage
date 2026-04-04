"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || t("login_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-gray-900 px-3 sm:px-4 pb-safe">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="text-2xl font-bold text-primary">YourPage</Link>
          <CardTitle>{t("login")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Input type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("processing") : t("login")}
            </Button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {t("no_account")} <Link href="/register" className="text-primary hover:underline">{t("register")}</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
