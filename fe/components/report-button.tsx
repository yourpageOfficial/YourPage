"use client";

import { useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, X, CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

const reasonKeys = ["nsfw", "plagiarism", "scam", "spam", "other"] as const;
type ReasonKey = (typeof reasonKeys)[number];

const reasonLabelKey: Record<ReasonKey, string> = {
  nsfw: "reasonNsfw",
  plagiarism: "reasonPlagiarism",
  scam: "reasonScam",
  spam: "reasonSpam",
  other: "reasonOther",
};

export function ReportButton({ targetType, targetId }: { targetType: "post" | "product" | "user"; targetId: string }) {
  const { t } = useTranslation();
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
    } catch (e: any) { toast.error(e.response?.data?.error || t.compSocial.failed) }
    setLoading(false);
  };

  if (done) return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <CheckCircle className="h-3 w-3" /> {t.compSocial.reported}
    </span>
  );

  if (!open) return (
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
      <Flag className="h-3 w-3" /> {t.compSocial.report}
    </button>
  );

  return (
    <div className="mt-2 p-3 border rounded-xl bg-primary-50 dark:bg-navy-800 dark:border-primary-900/40 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t.compSocial.reportContent}</p>
        <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-gray-400" /></button>
      </div>
      <div className="flex flex-wrap gap-1">
        {reasonKeys.map((r) => (
          <button key={r} onClick={() => setReason(r)}
            className={`px-2 py-1 rounded text-xs border transition-colors ${reason === r ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" : "border-primary-100 dark:border-primary-900/40 hover:border-primary-200"}`}>
            {t.compSocial[reasonLabelKey[r] as keyof typeof t.compSocial]}
          </button>
        ))}
      </div>
      <Input placeholder={t.compSocial.detailOptional} value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm" />
      <Button size="sm" variant="destructive" onClick={submit} disabled={!reason || loading} className="w-full">
        {loading ? t.compSocial.sending : t.compSocial.sendReport}
      </Button>
    </div>
  );
}
