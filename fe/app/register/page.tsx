"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { PasswordStrength } from "@/components/ui/password-strength";
import { PageTransition } from "@/components/ui/page-transition";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";

function RoleOptions({ role, setRole }: { role: "supporter" | "creator"; setRole: (r: "supporter" | "creator") => void }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setRole("supporter")}
        className={`rounded-2xl border-2 p-4 text-left transition-all ${role === "supporter" ? "border-primary bg-primary-50 dark:bg-primary-900/20 shadow-glow" : "border-primary-100 dark:border-primary-900/30 hover:border-primary-200 dark:hover:border-blue-800"}`}
      >
        <p className={`text-sm font-bold ${role === "supporter" ? "text-primary" : ""}`}>☕ {t("auth.supporter")}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">{t("auth.supporter_desc")}</p>
      </button>
      <button
        type="button"
        onClick={() => setRole("creator")}
        className={`rounded-2xl border-2 p-4 text-left transition-all ${role === "creator" ? "border-primary bg-primary-50 dark:bg-primary-900/20 shadow-glow" : "border-primary-100 dark:border-primary-900/30 hover:border-primary-200 dark:hover:border-blue-800"}`}
      >
        <p className={`text-sm font-bold ${role === "creator" ? "text-primary" : ""}`}>🎨 {t("auth.creator")}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">{t("auth.creator_desc")}</p>
      </button>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="p-8 text-center">Loading...</div>}><RegisterContent /></Suspense>;
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"supporter" | "creator">("supporter");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailRegex.test(email)) { setError(t("validation.invalid_email")); return; }
    if (password !== confirmPassword) { setError(t("auth.password_mismatch")); return; }
    setLoading(true);
    try {
      await register(email, username, password, role, referralCode || undefined);
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || t("auth.registration_failed"));
    } finally {
      setLoading(false);
    }
  };

  const pwToggle = (
    <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600" aria-label={showPw ? t("auth.hide_password") : t("auth.show_password")}>
      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="flex min-h-screen">
      {/* Left — gradient branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="relative text-center text-white">
          <p className="text-4xl font-display font-black tracking-tight">
            <span>Your</span><span className="text-accent">.</span><span>Page</span>
          </p>
          <p className="mt-4 text-xl text-primary-100 font-medium" dangerouslySetInnerHTML={{ __html: t("auth.hero_subtitle").replace("\n", "<br />") }}></p>
          <div className="mt-8 flex items-center justify-center gap-2 text-primary-200 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>{t("auth.hero_footer")}</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-navy-900 px-4 py-8 overflow-y-auto">
        <PageTransition>
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-6">
              <Link href="/" className="text-3xl font-black">
                <span className="text-primary">Your</span><span className="text-accent">.</span><span className="dark:text-white">Page</span>
              </Link>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">{t("auth.register_title")} ✨</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{t("auth.register_subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t("auth.register_as")}</label>
                <RoleOptions role={role} setRole={setRole} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">{t("auth.email")}</label>
                <Input type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" error={email && !emailRegex.test(email) ? t("validation.invalid_email") : undefined} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Username</label>
                <Input placeholder={t("auth.username_placeholder")} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))} required maxLength={30} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">{t("auth.password")}</label>
                <Input type={showPw ? "text" : "password"} placeholder={t("auth.password_placeholder")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" iconRight={pwToggle} />
                <PasswordStrength password={password} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">{t("auth.confirm_password")}</label>
                <Input type={showPw ? "text" : "password"} placeholder={t("auth.confirm_password_placeholder")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required error={confirmPassword && password !== confirmPassword ? t("auth.password_mismatch") : undefined} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">{t("auth.referral_code_optional")}</label>
                <Input placeholder={t("auth.referral_placeholder")} value={referralCode} onChange={(e) => setReferralCode(e.target.value.trim())} />
                {referralCode && <p className="text-xs text-green-600 mt-1.5">🎁 {t("auth.referral_reward")}</p>}
              </div>
              <Button type="submit" className="w-full h-12" loading={loading}>{t("auth.register_button")}</Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t("auth.already_have_account")} <Link href="/login" className="text-primary font-semibold hover:underline">{t("auth.login_link")}</Link>
            </p>
            <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-3" dangerouslySetInnerHTML={{ __html: t("auth.terms_agreement").replace("Syarat & Ketentuan", `<a href="/terms" class="underline">Syarat & Ketentuan</a>`).replace("Kebijakan Privasi", `<a href="/privacy" class="underline">Kebijakan Privasi</a>`) }}></p>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
