"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { PageTransition } from "@/components/ui/page-transition";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — gradient branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-300/10 rounded-full blur-3xl" />
        <div className="relative text-center text-white">
          <p className="text-4xl font-display font-black tracking-tight">
            <span>Your</span><span className="text-accent">.</span><span>Page</span>
          </p>
          <p className="mt-4 text-xl text-primary-100 font-medium">Halaman kamu,<br />penghasilanmu.</p>
          <div className="mt-8 flex items-center justify-center gap-2 text-primary-200 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Dipercaya kreator Indonesia</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-navy-900 px-4 py-8">
        <PageTransition>
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="text-3xl font-black">
                <span className="text-primary">Your</span><span className="text-accent">.</span><span className="dark:text-white">Page</span>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">Selamat Datang 👋</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Masuk ke akun kamu</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Email</label>
                <Input ref={emailRef} type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Password</label>
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  iconRight={
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600" aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">Lupa password?</Link>
              </div>
              <Button type="submit" className="w-full h-12" loading={loading}>Masuk</Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
              Belum punya akun? <Link href="/register" className="text-primary font-semibold hover:underline">Daftar Gratis</Link>
            </p>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
