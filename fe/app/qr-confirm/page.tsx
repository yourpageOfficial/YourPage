"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2, MonitorSmartphone } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

function QRConfirmContent() {
  const { t, interpolate } = useTranslation();
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const token = params.get("token") || "";

  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const confirm = async () => {
    setState("sending");
    setError("");
    try {
      await api.post("/auth/qr-login/confirm", { qr_token: token });
      setState("done");
    } catch (err: any) {
      setError(err.response?.data?.error || t.auth.qrConfirmFailed);
      setState("idle");
    }
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-semibold">{t.auth.qrMissingTitle}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t.auth.qrMissingDesc}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{t.auth.loading}</CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-semibold">{t.auth.qrLoginRequiredTitle}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t.auth.qrLoginRequiredDesc}
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push(`/login?next=${encodeURIComponent(`/qr-confirm?token=${token}`)}`)}
          >
            {t.auth.loginButton}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state === "done") {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <p className="mt-4 text-lg font-semibold">{t.auth.qrConfirmSuccess}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {interpolate(t.auth.qrAddDesc, { name: user.display_name })}
          </p>
          <Button className="mt-6" variant="outline" onClick={() => router.push("/")}>{t.auth.goToLogin}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MonitorSmartphone className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">{t.auth.qrConfirmTitle}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {interpolate(t.auth.qrConfirmDesc, { name: user.display_name })}
          </p>
          <p className="mt-3 font-mono text-xs tracking-widest text-gray-400 dark:text-gray-500">{token}</p>
        </div>

        {error && <Alert variant="error" className="mt-5">{error}</Alert>}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>{t.auth.qrCancelButton}</Button>
          <Button className="flex-1" onClick={confirm} disabled={state === "sending"}>
            {state === "sending" ? t.auth.qrConfirming : t.auth.qrConfirmButton}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QRConfirmPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-10">
        <Suspense fallback={<div />}>
          <QRConfirmContent />
        </Suspense>
      </main>
    </>
  );
}
