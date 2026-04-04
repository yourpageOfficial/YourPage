"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { formatIDR, formatDate } from "@/lib/utils";
import { TrendingUp, Banknote, Wallet } from "lucide-react";

export default function AdminProfit() {
  const t = useTranslations("AdminProfit");
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accName, setAccName] = useState("");
  const [note, setNote] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-profit"],
    queryFn: async () => { const { data } = await api.get("/admin/profit"); return data.data as any; },
  });

  const withdraw = useMutation({
    mutationFn: () => api.post("/admin/profit/withdraw", {
      amount_idr: parseInt(amount), bank_name: bankName,
      account_number: accNumber, account_name: accName, note,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-profit"] });
      setAmount(""); setBankName(""); setAccNumber(""); setAccName(""); setNote("");
      toast.success(t("recorded"));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t("failed")),
  });

  return (
    <div>
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">{t("title")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("total_revenue")}</p>
              <p className="text-xl font-bold text-green-600">{formatIDR(data?.total_revenue || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Banknote className="h-8 w-8 text-orange-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("withdrawn")}</p>
              <p className="text-xl font-bold text-orange-600">{formatIDR(data?.total_withdrawn || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("available")}</p>
              <p className="text-xl font-bold text-primary">{formatIDR(data?.available || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CollapsibleCard title={t("withdraw_title")}>
        <div className="space-y-3">
          <Input type="number" placeholder={t("amount_placeholder")} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder={t("bank_placeholder")} value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <Input placeholder={t("account_placeholder")} value={accNumber} onChange={(e) => setAccNumber(e.target.value)} />
          </div>
          <Input placeholder={t("name_placeholder")} value={accName} onChange={(e) => setAccName(e.target.value)} />
          <Input placeholder={t("note_placeholder")} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button onClick={() => withdraw.mutate()} disabled={withdraw.isPending || !amount || !bankName || !accNumber || !accName}>
            {withdraw.isPending ? t("processing") : t("withdraw_btn", { amount: amount ? formatIDR(parseInt(amount)) : "" })}
          </Button>
        </div>
      </CollapsibleCard>

      {data?.withdrawals?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">{t("withdrawal_history")}</h2>
          <div className="space-y-2">
            {data.withdrawals.map((w: any) => (
              <Card key={w.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{formatIDR(w.amount_idr)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{w.bank_name} — {w.account_number} ({w.account_name})</p>
                    {w.note && <p className="text-xs text-gray-400 dark:text-gray-400">{w.note}</p>}
                  </div>
                  <div className="text-right text-xs text-gray-400 dark:text-gray-400">
                    <p>{formatDate(w.created_at)}</p>
                    <p>{t("by_label")} {w.admin?.display_name || t("admin_label")}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
