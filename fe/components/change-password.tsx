"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { useTranslation } from "@/lib/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getStrength(pw: string, t: (key: string) => string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: t("password_strength.weak"), color: "bg-red-500" };
  if (s <= 2) return { score: s, label: t("password_strength.medium"), color: "bg-yellow-500" };
  if (s <= 3) return { score: s, label: t("password_strength.strong"), color: "bg-primary-500" };
  return { score: s, label: t("password_strength.very_strong"), color: "bg-green-500" };
}

export function ChangePasswordCard() {
  const { t } = useTranslation();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const mismatch = newPw && confirmPw && newPw !== confirmPw;
  const strength = getStrength(newPw, t);

  const change = useMutation({
    mutationFn: () => api.post("/auth/change-password", { old_password: oldPw, new_password: newPw }),
    onSuccess: () => { toast.success(t("change_password.success")); setOldPw(""); setNewPw(""); setConfirmPw(""); },
    onError: (e: any) => toast.error(e.response?.data?.error?.includes("Sesi") ? t("change_password.old_password_wrong") : t("change_password.failed")),
  });

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">🔒 {t("common.update")} Password</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("wallet.credits")}</p>
        <div><label className="text-sm font-medium mb-1 block">{t("change_password.old_password")}</label><Input type="password" placeholder={t("change_password.old_password")} value={oldPw} onChange={e => setOldPw(e.target.value)} /></div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t("change_password.new_password")}</label>
          <Input type="password" placeholder={t("change_password.min_8_chars")} value={newPw} onChange={e => setNewPw(e.target.value)} />
          {newPw && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : "bg-primary-100 dark:bg-navy-800"}`} />
                ))}
              </div>
              <p className={`text-xs mt-1 ${strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-yellow-500" : "text-green-500"}`}>{strength.label}</p>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t("change_password.confirm_new_password")}</label>
          <Input type="password" placeholder={t("change_password.confirm_new_password")} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          {mismatch && <p className="text-xs text-red-500 mt-1">{t("auth.password_mismatch")}</p>}
        </div>
        <Button onClick={() => change.mutate()} disabled={change.isPending || !oldPw || newPw.length < 8 || !!mismatch}>
          {change.isPending ? t("common.processing") : `${t("common.update")} Password`}
        </Button>
      </CardContent>
    </Card>
  );
}
