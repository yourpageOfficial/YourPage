"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
  role?: "creator" | "admin" | "supporter";
  requireAuth?: boolean;
}

export function AuthGuard({ children, role, requireAuth = true }: Props) {
  const { user, loading, fetchMe } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !user && loading) {
      fetchMe();
    }
  }, [user, loading, fetchMe]);

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.replace("/login");
      return;
    }

    if (role && user) {
      if (role === "admin" && user.role !== "admin") {
        router.replace("/");
        return;
      }
      if (role === "creator" && user.role !== "creator" && user.role !== "admin") {
        router.replace("/upgrade");
        return;
      }
    }
  }, [user, loading, role, requireAuth, router]);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;
  if (requireAuth && !user) return null;
  if (role === "admin" && user?.role !== "admin") return null;
  if (role === "creator" && user?.role !== "creator" && user?.role !== "admin") return null;

  return <>{children}</>;
}
