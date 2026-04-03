"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user, loading, fetchMe } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("access_token") && !user && loading) {
      fetchMe();
    }
  }, [user, loading, fetchMe]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // Creator → redirect to public page
    if (user.role === "creator" || user.role === "admin") {
      const slug = user.creator_profile?.page_slug || user.username;
      router.replace(`/c/${slug}`);
    }
    // Supporter stays on this page
  }, [user, loading, router]);

  if (loading || !user) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat...</div>;

  // Supporter profile
  if (user.role === "supporter") {
    return (
      <AuthGuard>
        <Navbar />
        <main className="mx-auto max-w-md px-3 sm:px-4 py-8">
          <Card>
            <CardContent className="pt-8 pb-6 px-4 sm:px-6">
              {/* Centered avatar */}
              <div className="flex flex-col items-center text-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover border-4 border-white shadow" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary shadow">
                    {user.display_name[0]}
                  </div>
                )}
                <h1 className="mt-3 text-xl font-bold">{user.display_name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                <Badge className="mt-2">{user.role}</Badge>
                {user.bio && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{user.bio}</p>}
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <a href="/s" className="block w-full text-center py-2.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-colors">
                  Dashboard
                </a>
                <a href="/upgrade" className="block w-full text-center py-2.5 rounded-md border text-sm font-medium text-primary hover:bg-primary-50 transition-colors">
                  Upgrade ke Creator
                </a>
              </div>
            </CardContent>
          </Card>
        </main>
      </AuthGuard>
    );
  }

  return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Redirecting...</div>;
}
