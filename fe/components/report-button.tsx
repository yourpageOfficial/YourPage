"use client";

import { useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, X, CheckCircle } from "lucide-react";

const reasons = [
  { value: "nsfw", label: "NSFW / Tidak Pantas" },
  { value: "plagiarism", label: "Plagiasi" },
  { value: "scam", label: "Penipuan" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Lainnya" },
];

export function ReportButton({ targetType, targetId }: { targetType: "post" | "product" | "user"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post("/reports", { target_type: targetType, target_id: targetId, reason, description: desc || undefined });
      setDone(true);
    } catch (e: any) { toast.error(e.response?.data?.error || "Gagal") }
    setLoading(false);
  };

  if (done) return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <CheckCircle className="h-3 w-3" /> Dilaporkan
    </span>
  );

  if (!open) return (
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
      <Flag className="h-3 w-3" /> Laporkan
    </button>
  );

  return (
    <div className="mt-2 p-3 border rounded-xl bg-primary-50 dark:bg-navy-800 dark:border-primary-900/40 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Laporkan Konten</p>
        <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-gray-400" /></button>
      </div>
      <div className="flex flex-wrap gap-1">
        {reasons.map((r) => (
          <button key={r.value} onClick={() => setReason(r.value)}
            className={`px-2 py-1 rounded text-xs border transition-colors ${reason === r.value ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" : "border-primary-100 dark:border-primary-900/40 hover:border-primary-200"}`}>
            {r.label}
          </button>
        ))}
      </div>
      <Input placeholder="Detail (opsional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm" />
      <Button size="sm" variant="destructive" onClick={submit} disabled={!reason || loading} className="w-full">
        {loading ? "Mengirim..." : "Kirim Laporan"}
      </Button>
    </div>
  );
}
