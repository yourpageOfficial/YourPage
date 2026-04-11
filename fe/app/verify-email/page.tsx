"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    api.post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { router.push("/dashboard"); clearInterval(t); } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <PageTransition>
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center">
            {status === "loading" && <p className="text-gray-500">Memverifikasi...</p>}
            {status === "success" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Email Terverifikasi! ✅</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Akun kamu sudah aktif sepenuhnya.</p>
                <p className="text-xs text-gray-400 mb-4">Redirect ke dashboard dalam {countdown} detik...</p>
                <Link href="/dashboard"><Button className="w-full">Buka Dashboard</Button></Link>
              </motion.div>
            )}
            {status === "error" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Link Tidak Valid</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Link verifikasi sudah expired atau tidak valid.</p>
                <Link href="/login"><Button variant="outline" className="w-full">Kembali ke Login</Button></Link>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </PageTransition>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Memuat...</p></div>}><VerifyContent /></Suspense>;
}
