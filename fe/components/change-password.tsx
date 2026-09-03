"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrength } from "@/components/password-strength-meter";
import { useTranslation } from "@/lib/internationalization";

export function ChangePasswordCard() {
  const { t } = useTranslation();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const mismatch = newPw && confirmPw && newPw !== confirmPw;

  const change = useMutation({
    mutationFn: () => api.post("/auth/change-password", { old_password: oldPw, new_password: newPw }),
    onSuccess: () => {
      toast.success(t.compAccount.passwordChangeSuccess);
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || t.compAccount.passwordChangeFailed;
      toast.error(msg);
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.compAccount.changePasswordTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.compAccount.changePasswordDesc}
        </p>
        <div>
          <label htmlFor="old-password-input" className="text-sm font-medium mb-1 block">
            {t.compAccount.oldPasswordLabel}
          </label>
          <Input
            id="old-password-input"
            type="password"
            placeholder={t.compAccount.oldPasswordPlaceholder}
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="new-password-input" className="text-sm font-medium mb-1 block">
            {t.compAccount.newPasswordLabel}
          </label>
          <Input
            id="new-password-input"
            type="password"
            placeholder={t.compAccount.newPasswordPlaceholder}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          {newPw && <PasswordStrength password={newPw} />}
        </div>
        <div>
          <label htmlFor="confirm-password-input" className="text-sm font-medium mb-1 block">
            {t.compAccount.confirmPasswordLabel}
          </label>
          <Input
            id="confirm-password-input"
            type="password"
            placeholder={t.compAccount.confirmPasswordPlaceholder}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
          {mismatch && <p className="text-xs text-red-500 mt-1">{t.compAccount.passwordMismatch}</p>}
        </div>
        <Button
          onClick={() => change.mutate()}
          disabled={change.isPending || !oldPw || newPw.length < 8 || !!mismatch}
        >
          {change.isPending ? t.compAccount.loadingDots : t.compAccount.changePasswordTitle.replace("🔒 ", "")}
        </Button>
      </CardContent>
    </Card>
  );
}
