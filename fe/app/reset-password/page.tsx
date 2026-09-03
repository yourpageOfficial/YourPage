"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { PasswordStrength } from "@/components/ui/password-strength";
import { StepIndicator } from "@/components/ui/step-indicator";
import { PageTransition } from "@/components/ui/page-transition";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = useMutation({
    mutationFn: () => {
      if (!token) return Promise.reject(new Error(t.auth.invalidToken));
      if (password.length < 8) return Promise.reject(new Error(t.auth.passwordMin));
      if (password !== confirm) return Promise.reject(new Error(t.auth.passwordMismatch));
      return api.post("/auth/reset-password", { token, new_password: password });
    },
    onSuccess: () => { setError(""); setDone(true); },
    onError: (err: any) => setError(err.response?.data?.error || err.message || t.auth.resetFailed),
  });

  const pwToggle = (
    <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600" aria-label={showPw ? t.auth.hidePassword : t.auth.showPassword}>
      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  if (!token) {
    return (
      <div className="text-center">
        <Alert variant="error">{t.auth.invalidToken}</Alert>
        <Button className="mt-4" onClick={() => router.push("/login")}>{t.auth.goToLogin}</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <p className="text-lg font-semibold">{t.auth.resetSuccessTitle}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.auth.resetSuccessDesc}</p>
        <Button onClick={() => router.push("/login")}>{t.auth.goToLogin}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.auth.resetNewPassword}</label>
        <Input type={showPw ? "text" : "password"} placeholder={t.auth.newPasswordPlaceholder} value={password} onChange={e => setPassword(e.target.value)} iconRight={pwToggle} />
        <PasswordStrength password={password} />
      </div>
      <div>
        <label className="text-sm font-medium">{t.auth.resetConfirmPassword}</label>
        <Input type={showPw ? "text" : "password"} placeholder={t.auth.passwordLabel} value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1" error={confirm && password !== confirm ? t.auth.passwordMismatch : undefined} />
      </div>
      <Button className="w-full h-11" onClick={() => reset.mutate()} loading={reset.isPending} disabled={!password || !confirm}>{t.auth.resetButton}</Button>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const steps = [{ label: t.auth.resetTitle }, { label: t.auth.resetSubtitle }, { label: t.auth.resetNewPassword }];
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <PageTransition>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">{t.auth.resetTitle}</CardTitle>
            <StepIndicator steps={steps} current={2} className="mt-4" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-center text-sm text-gray-500">{t.auth.loading}</p>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </PageTransition>
    </main>
  );
}
