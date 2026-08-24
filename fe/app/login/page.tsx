"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { PageTransition } from "@/components/ui/page-transition";
import { Eye, EyeOff, Sparkles, QrCode, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

type LoginStep = "credentials" | "2fa" | "qr";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials");

  // Credentials step
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // 2FA step
  const [challengeToken, setChallengeToken] = useState("");
  const [otp, setOtp] = useState("");

  // QR step
  const [qrToken, setQrToken] = useState("");
  const [qrPolling, setQrPolling] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (step === "2fa") otpRef.current?.focus(); }, [step]);

  // QR polling
  const startQRPoll = useCallback((token: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setQrPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/auth/qr-login/poll/${token}`);
        if (data?.data?.access_token) {
          clearInterval(pollRef.current!);
          // Reload to pick up cookies
          window.location.href = "/";
        }
      } catch {
        // 204 = still waiting, ignore
      }
    }, 2000);
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleLoadQR = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/auth/qr-login");
      const token = data.data.token;
      setQrToken(token);
      setStep("qr");
      startQRPoll(token);
    } catch {
      setError("Gagal membuat QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const resp = data.data;
      if (resp.requires_2fa) {
        setChallengeToken(resp.challenge_token);
        setStep("2fa");
      } else {
        // Normal login — auth store handles token via cookie
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login gagal. Periksa email dan password.");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/2fa/login", { challenge_token: challengeToken, otp });
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.error || "Kode OTP salah atau expired.");
      setOtp("");
      otpRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = qrToken
    // Point at a page, not the API: scanning performs a GET, while the confirm
    // endpoint is an authenticated POST — and approving another device must be
    // an explicit action, never a side effect of opening a link.
    ? `${window.location.origin}/qr-confirm?token=${qrToken}`
    : "";

  return (
    <div className="flex min-h-screen">
      {/* Left — gradient branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden items-center justify-center p-12">
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

            {/* ── STEP: Credentials ── */}
            {step === "credentials" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">Selamat Datang 👋</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Masuk ke akun kamu</p>
                </div>
                <form onSubmit={handleCredentials} className="space-y-4">
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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-navy-900 px-2 text-gray-500">atau</span></div>
                </div>

                <Button variant="outline" className="w-full" onClick={handleLoadQR} loading={loading}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Login dengan QR Code
                </Button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                  Belum punya akun? <Link href="/register" className="text-primary font-semibold hover:underline">Daftar Gratis</Link>
                </p>
              </>
            )}

            {/* ── STEP: 2FA OTP ── */}
            {step === "2fa" && (
              <>
                <button onClick={() => setStep("credentials")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>
                <div className="mb-8">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-display font-black">Verifikasi 2FA</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Kode OTP 6 digit dikirim ke email <strong>{email}</strong>.<br />
                    Berlaku 5 menit.
                  </p>
                </div>
                <form onSubmit={handleTwoFA} className="space-y-4">
                  {error && <Alert variant="error">{error}</Alert>}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Kode OTP</label>
                    <Input
                      ref={otpRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center text-2xl tracking-widest font-mono"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-12" loading={loading} disabled={otp.length !== 6}>
                    Verifikasi
                  </Button>
                </form>
              </>
            )}

            {/* ── STEP: QR Login ── */}
            {step === "qr" && (
              <>
                <button onClick={() => { setStep("credentials"); if (pollRef.current) clearInterval(pollRef.current); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>
                <div className="mb-6">
                  <h1 className="text-2xl font-display font-black">Login dengan QR</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Scan QR code ini dari HP kamu yang sudah login di YourPage.
                  </p>
                </div>

                {error && <Alert variant="error">{error}</Alert>}

                <div className="flex flex-col items-center gap-4">
                  {/* QR Code — tampilkan sebagai teks link untuk saat ini */}
                  <div className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-white dark:bg-navy-800 text-center">
                    <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                      <div className="text-xs text-gray-400 break-all px-2">
                        <p className="font-mono text-[10px] mb-2">QR Token:</p>
                        <p className="font-bold">{qrToken}</p>
                      </div>
                    </div>
                  </div>
                  {qrPolling && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Menunggu konfirmasi dari HP...
                    </p>
                  )}
                  <p className="text-xs text-gray-400 text-center max-w-xs">
                    Buka YourPage di HP → Profil → Konfirmasi QR Login
                  </p>
                </div>
              </>
            )}
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
