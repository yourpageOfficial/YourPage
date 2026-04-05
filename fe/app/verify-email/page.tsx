"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    api.post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="p-8 text-center">
          {status === "loading" && <p className="text-gray-500">Memverifikasi...</p>}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Email Terverifikasi! ✅</h2>
              <p className="text-sm text-gray-500 mb-4">Akun kamu sudah aktif sepenuhnya.</p>
              <Link href="/dashboard"><Button className="w-full">Buka Dashboard</Button></Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Link Tidak Valid</h2>
              <p className="text-sm text-gray-500 mb-4">Link verifikasi sudah expired atau tidak valid.</p>
              <Link href="/login"><Button variant="outline" className="w-full">Kembali ke Login</Button></Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Memuat...</p></div>}><VerifyContent /></Suspense>;
}
