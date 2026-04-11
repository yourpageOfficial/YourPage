"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { PageTransition } from "@/components/ui/page-transition";
import { Mail, Sparkles } from "lucide-react";
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
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden items-center justify-center p-12">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="relative text-center text-white">
          <p className="text-4xl font-display font-black tracking-tight"><span>Your</span><span className="text-accent">.</span><span>Page</span></p>
          <p className="mt-4 text-xl text-primary-100 font-medium">Jangan khawatir,<br />kami bantu reset.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-navy-900 px-4 py-8">
        <PageTransition>
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="text-3xl font-black"><span className="text-primary">Your</span><span className="text-accent">.</span><span className="dark:text-white">Page</span></Link>
            </div>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto"><Mail className="h-8 w-8 text-primary" /></div>
                <h1 className="text-2xl font-display font-black tracking-tight">Email Terkirim!</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cek inbox <span className="font-semibold">{email}</span> dan klik link reset password. Link berlaku 15 menit.</p>
                <Link href="/login" className="block text-sm text-primary font-semibold hover:underline">← Kembali ke Login</Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">Lupa Password? 🔑</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Masukkan email akun kamu, kami kirimkan link reset.</p>
                <div className="space-y-4">
                  {error && <Alert variant="error">{error}</Alert>}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Email</label>
                    <Input type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && email && send.mutate()} />
                  </div>
                  <Button className="w-full h-12" onClick={() => send.mutate()} loading={send.isPending} disabled={!email}>Kirim Link Reset</Button>
                  <p className="text-center text-sm text-gray-500"><Link href="/login" className="text-primary font-semibold hover:underline">← Kembali ke Login</Link></p>
                </div>
              </>
            )}
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
