"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX } from "lucide-react";
import { toast } from "@/lib/toast";
import api from "@/lib/api";

export default function SuspendedPage() {
  const { user, logout } = useAuth();
  const [appeal, setAppeal] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitAppeal = async () => {
    setLoading(true);
    try { await api.post("/auth/appeal", { reason: appeal }); setSubmitted(true); toast.success("Banding terkirim"); }
    catch { toast.error("Gagal mengirim banding"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-navy-900">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-display font-black tracking-tight mb-2">Akun Ditangguhkan</h1>
          {user?.ban_reason && <Alert variant="error" className="text-left mt-4">{user.ban_reason}</Alert>}

          {submitted ? (
            <div className="mt-6"><Alert variant="info">Banding sudah dikirim. Kami akan meninjau dalam 1-3 hari kerja.</Alert></div>
          ) : (
            <div className="mt-6 text-left space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Jelaskan mengapa akun kamu harus dipulihkan:</p>
              <Textarea value={appeal} onChange={e => setAppeal(e.target.value)} placeholder="Tulis banding kamu..." maxLength={1000} showCount />
              <Button className="w-full rounded-xl" onClick={submitAppeal} loading={loading} disabled={!appeal.trim()}>Kirim Banding</Button>
            </div>
          )}
          <Button variant="ghost" className="mt-4" onClick={logout}>Keluar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
