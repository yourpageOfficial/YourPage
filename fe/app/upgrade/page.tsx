"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpgradeCreatorPage() {
  const { user, fetchMe } = useAuth();
  const router = useRouter();
  const [pageSlug, setPageSlug] = useState("");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user?.role === "creator") {
    router.replace("/dashboard");
    return null;
  }

  const handleUpgrade = async () => {
    setLoading(true); setError("");
    try {
      await api.post("/auth/upgrade-creator", { page_slug: pageSlug, display_name: displayName });
      await fetchMe();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal upgrade");
    } finally { setLoading(false); }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Jadi Creator</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mulai monetisasi kontenmu di YourPage</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nama tampilan" />
            </div>
            <div>
              <label className="text-sm font-medium">Page Slug</label>
              <Input value={pageSlug} onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))} placeholder="username" />
              <p className="text-xs text-gray-400 mt-1">Halaman kamu: yourpage.id/c/{pageSlug || "..."}</p>
            </div>
            <Button className="w-full" onClick={handleUpgrade} disabled={loading || !pageSlug || !displayName}>
              {loading ? "Memproses..." : "Upgrade ke Creator"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}
