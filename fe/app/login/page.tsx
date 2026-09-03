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
import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { useTranslation } from "@/lib/internationalization";

type LoginStep = "credentials" | "2fa" | "qr" | "magic";

export default function LoginPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<LoginStep>("credentials");

  // Credentials step
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Magic Link step
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

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
      setError(t.auth.qrConfirmFailed);
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
      setError(err.response?.data?.error || t.auth.loginButton + " failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail) return;
    setMagicLoading(true);
    setError("");
    try {
      await api.post("/auth/magic-link", { email: magicEmail });
      setMagicSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || t.auth.forgotSendFailed);
    } finally {
      setMagicLoading(false);
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
                  <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">{t.auth.loginTitle}</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{t.auth.loginSubtitle}</p>
                </div>
                <form onSubmit={handleCredentials} className="space-y-4">
                  {error && <Alert variant="error">{error}</Alert>}
                  <div>
                    <label htmlFor="login-email" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">{t.auth.emailLabel}</label>
                    <Input id="login-email" ref={emailRef} type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">{t.auth.passwordLabel}</label>
                    <Input
                      id="login-password"
                      type={showPw ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      iconRight={
                        <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600" aria-label={showPw ? t.auth.hidePassword : t.auth.showPassword}>
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">{t.auth.forgotPasswordLink}</Link>
                  </div>
                  <Button type="submit" className="w-full h-12" loading={loading}>{t.auth.loginButton}</Button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-navy-900 px-2 text-gray-500">{t.auth.orDivider}</span></div>
                </div>

                <div className="space-y-3">
                  <SocialAuthButtons />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
                    onClick={() => { setError(""); setMagicSent(false); setStep("magic"); }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {t.auth.magicLinkButton}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleLoadQR} loading={loading}>
                    <QrCode className="h-4 w-4 mr-2" />
                    {t.auth.loginWithQR}
                  </Button>
                </div>


                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                  {t.auth.dontHaveAccount} <Link href="/register" className="text-primary font-semibold hover:underline">{t.auth.registerButton}</Link>
                </p>
              </>
            )}

            {/* ── STEP: 2FA OTP ── */}
            {step === "2fa" && (
              <>
                <button onClick={() => setStep("credentials")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                  <ArrowLeft className="h-4 w-4" /> {t.common.back}
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
                    <label htmlFor="otp-code" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Kode OTP</label>
                    <Input
                      id="otp-code"
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
                  <ArrowLeft className="h-4 w-4" /> {t.common.back}
                </button>
                <div className="mb-6">
                  <h1 className="text-2xl font-display font-black">{t.auth.loginWithQR}</h1>
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
                      <span className="animate-spin">⏳</span> {t.auth.qrDoingDesc}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 text-center max-w-xs">
                    Buka YourPage di HP → Profil → Konfirmasi QR Login
                  </p>
                </div>
              </>
            )}

            {/* ── STEP: MAGIC LINK ── */}
            {step === "magic" && (
              <>
                <button onClick={() => setStep("credentials")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                  <ArrowLeft className="h-4 w-4" /> {t.common.back}
                </button>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-display font-black">{t.auth.magicLinkButton}</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                    Kami akan mengirimkan link sekali pakai ke email kamu untuk langsung masuk tanpa password.
                  </p>
                </div>

                {error && <Alert variant="error">{error}</Alert>}

                {magicSent ? (
                  <div className="p-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl text-center space-y-3">
                    <p className="font-semibold text-green-800 dark:text-green-300">{t.auth.forgotSentTitle}</p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      Periksa inbox atau folder spam di <strong>{magicEmail}</strong>. Link berlaku selama 15 menit.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setMagicSent(false)}>
                      {t.auth.sending.replace("...", "")}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMagicLink} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                        {t.auth.emailLabel}
                      </label>
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12" loading={magicLoading}>
                      {t.auth.magicLinkButton}
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
