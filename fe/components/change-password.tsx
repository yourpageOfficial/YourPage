"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

export function ChangePasswordCard() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const mismatch = newPw && confirmPw && newPw !== confirmPw;

  const change = useMutation({
    mutationFn: () => api.post("/auth/change-password", { old_password: oldPw, new_password: newPw }),
    onSuccess: () => { toast.success("Password berhasil diubah!"); setOldPw(""); setNewPw(""); setConfirmPw(""); },
    onError: (e: any) => toast.error(e.response?.data?.error === "unauthorized" || e.response?.data?.error?.includes("Sesi") ? "Password lama salah" : "Gagal mengubah password"),
  });

  return (
    <CollapsibleCard title="🔒 Ganti Password">
      <div className="space-y-3">
        <Input type="password" placeholder="Password lama" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
        <Input type="password" placeholder="Password baru (min 8 karakter)" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        <div>
          <Input type="password" placeholder="Konfirmasi password baru" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          {mismatch && <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>}
        </div>
        <Button onClick={() => change.mutate()} disabled={change.isPending || !oldPw || newPw.length < 8 || newPw !== confirmPw}>
          {change.isPending ? "Memproses..." : "Ganti Password"}
        </Button>
      </div>
    </CollapsibleCard>
  );
}
