"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { statusColor } from "@/components/ui/standards";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatCredit, formatDate } from "@/lib/utils";
import type { Withdrawal, PaginatedResponse } from "@/lib/types";

export default function DashboardWithdrawals() {
  const t = useTranslations("Withdrawal");
  const tCommon = useTranslations("Common");
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accName, setAccName] = useState("");
  const [error, setError] = useState("");

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => {
      const { data } = await api.get("/creator/earnings");
      return data.data as { balance_idr: number; total_earnings: number };
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["my-withdrawals"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Withdrawal>>("/withdrawals");
      return data.data;
    },
  });

  const create = useMutation({
    mutationFn: () => api.post("/withdrawals", {
      amount_idr: parseInt(amount),
      bank_name: bankName,
      account_number: accNumber,
      account_name: accName,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["creator-earnings"] });
      setShowForm(false);
      setAmount("");
      setBankName("");
      setAccNumber("");
      setAccName("");
      setError("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || tCommon("error");
      if (msg.includes("minimum")) setError(t("min_error"));
      else if (msg.includes("Credit") || msg.includes("insufficient")) setError(t("insufficient_balance"));
      else if (msg.includes("KYC")) setError(t("kyc_required"));
      else setError(msg);
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>{t("request")}</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("credit_balance")}</p>
            <p className="text-2xl font-bold text-primary">{formatCredit(earnings?.balance_idr ?? 0)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-400">= {formatIDR(earnings?.balance_idr ?? 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("total_income")}</p>
            <p className="text-lg font-semibold text-green-600">{formatCredit(earnings?.total_earnings ?? 0)}</p>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{t("request")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-sm font-medium">{t("amount_label")}</label>
              <Input type="number" placeholder={t("amount_placeholder")} value={amount} onChange={(e) => setAmount(e.target.value)} />
              {earnings && parseInt(amount) > earnings.balance_idr && (
                <p className="text-xs text-red-500 mt-1">{t("exceeds_balance")}</p>
              )}
            </div>
            <Input placeholder={t("bank_name")} value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <Input placeholder={t("account_number")} value={accNumber} onChange={(e) => setAccNumber(e.target.value)} />
            <Input placeholder={t("account_name")} value={accName} onChange={(e) => setAccName(e.target.value)} />
            <Button onClick={() => create.mutate()} disabled={create.isPending || !amount || !bankName || !accNumber || !accName}>
              {create.isPending ? t("processing") : t("submit_request")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {withdrawals?.map((w) => (
          <Card key={w.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{formatIDR(w.amount_idr)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{w.bank_name} — {w.account_number} ({w.account_name})</p>
                {w.admin_note && <p className="text-xs text-gray-500 mt-1">{t("note")} {w.admin_note}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-400">{formatDate(w.created_at)}</p>
              </div>
              <Badge className={statusColor[w.status] || ""}>{w.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {withdrawals?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_withdrawals")}</p>}
      </div>
    </div>
  );
}
