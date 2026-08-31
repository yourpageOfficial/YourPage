"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrength } from "@/components/password-strength-meter";

export function ChangePasswordCard() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const mismatch = newPw && confirmPw && newPw !== confirmPw;

  const change = useMutation({
    mutationFn: () => api.post("/auth/change-password", { old_password: oldPw, new_password: newPw }),
    onSuccess: () => {
      toast.success("Password berhasil diubah!");
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || "Gagal mengubah password";
      toast.error(msg);
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">🔒 Ganti Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Gunakan password yang kuat dan belum pernah digunakan sebelumnya untuk melindungi akun kamu.
        </p>
        <div>
          <label htmlFor="old-password-input" className="text-sm font-medium mb-1 block">
            Password Lama
          </label>
          <Input
            id="old-password-input"
            type="password"
            placeholder="Password lama"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="new-password-input" className="text-sm font-medium mb-1 block">
            Password Baru
          </label>
          <Input
            id="new-password-input"
            type="password"
            placeholder="Min 8 karakter"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          {newPw && <PasswordStrength password={newPw} />}
        </div>
        <div>
          <label htmlFor="confirm-password-input" className="text-sm font-medium mb-1 block">
            Konfirmasi Password
          </label>
          <Input
            id="confirm-password-input"
            type="password"
            placeholder="Ulangi password baru"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
          {mismatch && <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>}
        </div>
        <Button
          onClick={() => change.mutate()}
          disabled={change.isPending || !oldPw || newPw.length < 8 || !!mismatch}
        >
          {change.isPending ? "Memproses..." : "Ganti Password"}
        </Button>
      </CardContent>
    </Card>
  );
}
