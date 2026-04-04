"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"supporter" | "creator">("supporter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, username, password, role);
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || t("register_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-gray-900 px-3 sm:px-4 pb-safe">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="text-2xl font-bold text-primary">YourPage</Link>
          <CardTitle>{t("register")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Input type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder={t("username")} value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input type="password" placeholder={t("password_min")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <div className="flex gap-2">
              <Button type="button" variant={role === "supporter" ? "default" : "outline"} className="flex-1" onClick={() => setRole("supporter")}>
                {t("supporter")}
              </Button>
              <Button type="button" variant={role === "creator" ? "default" : "outline"} className="flex-1" onClick={() => setRole("creator")}>
                {t("creator")}
              </Button>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("processing") : t("register")}
            </Button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {t("has_account")} <Link href="/login" className="text-primary hover:underline">{t("login")}</Link>
            </p>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              {t("terms_agree")} <a href="/terms" className="underline">{t("terms_link")}</a> {t("privacy_link") && `dan <a href="/privacy" className="underline">${t("privacy_link")}</a>`}.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
