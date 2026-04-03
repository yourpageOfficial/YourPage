"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Lemah", color: "bg-red-500" };
  if (s <= 2) return { score: s, label: "Sedang", color: "bg-yellow-500" };
  if (s <= 3) return { score: s, label: "Kuat", color: "bg-blue-500" };
  return { score: s, label: "Sangat Kuat", color: "bg-green-500" };
}

export function ChangePasswordCard() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const mismatch = newPw && confirmPw && newPw !== confirmPw;
  const strength = getStrength(newPw);

  const change = useMutation({
    mutationFn: () => api.post("/auth/change-password", { old_password: oldPw, new_password: newPw }),
    onSuccess: () => { toast.success("Password berhasil diubah!"); setOldPw(""); setNewPw(""); setConfirmPw(""); },
    onError: (e: any) => toast.error(e.response?.data?.error?.includes("Sesi") ? "Password lama salah" : "Gagal mengubah password"),
  });

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">🔒 Ganti Password</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Akun kamu memiliki saldo Credit. Gunakan password yang kuat.</p>
        <Input type="password" placeholder="Password lama" value={oldPw} onChange={e => setOldPw(e.target.value)} />
        <div>
          <Input type="password" placeholder="Password baru (min 8 karakter)" value={newPw} onChange={e => setNewPw(e.target.value)} />
          {newPw && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : "bg-gray-200 dark:bg-gray-700"}`} />
                ))}
              </div>
              <p className={`text-xs mt-1 ${strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-yellow-500" : "text-green-500"}`}>{strength.label}</p>
            </div>
          )}
        </div>
        <div>
          <Input type="password" placeholder="Konfirmasi password baru" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          {mismatch && <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>}
        </div>
        <Button onClick={() => change.mutate()} disabled={change.isPending || !oldPw || newPw.length < 8 || !!mismatch}>
          {change.isPending ? "Memproses..." : "Ganti Password"}
        </Button>
      </CardContent>
    </Card>
  );
}
