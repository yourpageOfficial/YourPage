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
import { useTranslation } from "@/lib/internationalization";

export default function SuspendedPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [appeal, setAppeal] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitAppeal = async () => {
    setLoading(true);
    try { await api.post("/auth/appeal", { reason: appeal }); setSubmitted(true); toast.success(t.auth.appealSuccess); }
    catch { toast.error(t.auth.appealFailed); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-navy-900">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-display font-black tracking-tight mb-2">{t.auth.suspendedTitle}</h1>
          {user?.ban_reason && <Alert variant="error" className="text-left mt-4">{user.ban_reason}</Alert>}

          {submitted ? (
            <div className="mt-6"><Alert variant="info">{t.auth.appealSubmitted}</Alert></div>
          ) : (
            <div className="mt-6 text-left space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.auth.suspendedDesc}</p>
              <Textarea value={appeal} onChange={e => setAppeal(e.target.value)} placeholder={t.auth.appealPlaceholder} maxLength={1000} showCount />
              <Button className="w-full rounded-xl" onClick={submitAppeal} loading={loading} disabled={!appeal.trim()}>{t.auth.appealSendButton}</Button>
            </div>
          )}
          <Button variant="ghost" className="mt-4" onClick={logout}>{t.auth.logoutButton}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
