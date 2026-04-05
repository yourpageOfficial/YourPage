"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = useMutation({
    mutationFn: () => api.post("/auth/forgot-password", { email }),
    onSuccess: () => { setError(""); setSent(true); },
    onError: (err: any) => setError(err.response?.data?.error || "Gagal mengirim email"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Lupa Password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-14 w-14 text-green-500" />
              <p className="font-medium">Email terkirim!</p>
              <p className="text-sm text-gray-500">Cek inbox <span className="font-semibold">{email}</span> dan klik link reset password. Link berlaku 15 menit.</p>
              <Link href="/login" className="block text-sm text-primary hover:underline">Kembali ke Login</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <p className="text-sm text-gray-500">Masukkan email akun kamu, kami akan kirimkan link reset password.</p>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && email && send.mutate()}
              />
              <Button
                className="w-full h-11"
                onClick={() => send.mutate()}
                disabled={send.isPending || !email}
              >
                {send.isPending ? "Mengirim..." : "Kirim Link Reset"}
              </Button>
              <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-primary">Kembali ke Login</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
