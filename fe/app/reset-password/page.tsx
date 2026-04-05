"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = useMutation({
    mutationFn: () => {
      if (!token) return Promise.reject(new Error("Token tidak valid"));
      if (password.length < 8) return Promise.reject(new Error("Password minimal 8 karakter"));
      if (password !== confirm) return Promise.reject(new Error("Konfirmasi password tidak cocok"));
      return api.post("/auth/reset-password", { token, new_password: password });
    },
    onSuccess: () => { setError(""); setDone(true); },
    onError: (err: any) => setError(err.response?.data?.error || err.message || "Gagal reset password"),
  });

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 font-medium">Link tidak valid atau sudah kadaluarsa.</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>Kembali ke Login</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <p className="text-lg font-semibold">Password berhasil direset!</p>
        <p className="text-sm text-gray-500">Silakan login dengan password baru kamu.</p>
        <Button onClick={() => router.push("/login")}>Login Sekarang</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="text-sm font-medium">Password Baru</label>
        <Input
          type="password"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Konfirmasi Password</label>
        <Input
          type="password"
          placeholder="Ulangi password baru"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="mt-1"
        />
      </div>
      <Button
        className="w-full h-11"
        onClick={() => reset.mutate()}
        disabled={reset.isPending || !password || !confirm}
      >
        {reset.isPending ? "Memproses..." : "Reset Password"}
      </Button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-center text-sm text-gray-500">Memuat...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
