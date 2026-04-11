"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { formatIDR, formatCredit, formatDate } from "@/lib/utils";
import { Banknote, Wallet, TrendingUp } from "lucide-react";
import type { Withdrawal, PaginatedResponse } from "@/lib/types";

export default function DashboardWithdrawals() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accNumberConfirm, setAccNumberConfirm] = useState("");
  const [accName, setAccName] = useState("");
  const [error, setError] = useState("");

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { const { data } = await api.get("/creator/earnings"); return data.data as { total_earnings: number }; },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get("/wallet/balance"); return data.data; },
  });

  const { data: settings } = useQuery({
    queryKey: ["platform-settings-public"],
    queryFn: async () => { try { const { data } = await api.get("/settings/public"); return data.data; } catch { return { min_withdrawal_idr: 100000, credit_rate_idr: 1000 }; } },
  });
  const rate = settings?.credit_rate_idr || 1000;
  const minCredits = Math.ceil((settings?.min_withdrawal_idr || 100000) / rate);

  const { data: withdrawals } = useQuery({
    queryKey: ["my-withdrawals"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Withdrawal>>("/withdrawals"); return data.data; },
  });

  const validateWithdrawal = (): string | null => {
    if (!/^\d{10,16}$/.test(accNumber)) return "Nomor rekening harus 10-16 digit angka";
    if (!amount || parseInt(amount) < minCredits) return `Minimum penarikan ${minCredits} Credit`;
    return null;
  };

  const create = useMutation({
    mutationFn: () => {
      const validationError = validateWithdrawal();
      if (validationError) return Promise.reject(new Error(validationError));
      return api.post("/withdrawals", { amount_idr: Math.floor(parseInt(amount) || 0) * rate, bank_name: bankName, account_number: accNumber, account_name: accName });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-withdrawals"] }); qc.invalidateQueries({ queryKey: ["creator-earnings"] }); qc.invalidateQueries({ queryKey: ["wallet"] });
      setShowForm(false); setAmount(""); setBankName(""); setAccNumber(""); setAccName(""); setError("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Gagal";
      if (msg.includes("digit")) setError(msg);
      else if (msg.includes("minimum") || msg.includes("100 Credit")) setError("Minimum penarikan 100 Credit");
      else if (msg.includes("Credit") || msg.includes("insufficient")) setError("Saldo tidak cukup");
      else if (msg.includes("KYC")) setError("KYC harus diverifikasi terlebih dahulu");
      else setError(msg);
    },
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Penarikan" }]} className="mb-4" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-display font-black tracking-tight">Penarikan Dana</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="rounded-2xl">💰 Tarik Dana</Button>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        <Card className="bg-gradient-hero dark:bg-gradient-hero-dark border-0 text-white overflow-hidden relative">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-accent/10 rounded-full blur-xl" />
          <CardContent className="p-5 relative">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center mb-2"><Wallet className="h-5 w-5" /></div>
            <p className="text-primary-200 text-xs">Saldo Credit</p>
            <p className="text-2xl font-black">{wallet?.balance_credits ?? 0}</p>
            <p className="text-[10px] text-primary-200/60 mt-0.5">= {formatIDR((wallet?.balance_credits ?? 0) * rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mb-2"><TrendingUp className="h-5 w-5 text-accent-600" /></div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Pendapatan</p>
            <p className="text-2xl font-black text-accent-600">{formatCredit(earnings?.total_earnings ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="mb-6 border-primary/20">
          <CardHeader><CardTitle>Form Penarikan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
            <div>
              <label className="text-sm font-medium">Nominal Credit (min {minCredits})</label>
              <Input type="number" placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
              {amount && <p className="text-xs text-gray-500 mt-1">= Rp {(parseInt(amount) * 1000).toLocaleString("id-ID")}</p>}
            </div>
            <Input placeholder="Nama Bank (BCA, BNI, Mandiri, dll)" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <Input placeholder="Nomor Rekening (10-16 digit)" value={accNumber} onChange={(e) => setAccNumber(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={16} />
            <div>
              <Input placeholder="Konfirmasi Nomor Rekening" value={accNumberConfirm} onChange={(e) => setAccNumberConfirm(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={16} />
              {accNumberConfirm && accNumber !== accNumberConfirm && <p className="text-xs text-red-500 mt-1">Nomor rekening tidak cocok</p>}
            </div>
            <Input placeholder="Nama Pemilik Rekening (sesuai KTP)" value={accName} onChange={(e) => setAccName(e.target.value)} />
            <Button onClick={() => create.mutate()} disabled={create.isPending || !amount || !bankName || !accNumber || accNumber !== accNumberConfirm || !accName} className="rounded-xl">
              {create.isPending ? "Memproses..." : "Kirim Request"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2.5">
        {withdrawals?.map((w) => (
          <Card key={w.id} hover>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                <Banknote className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{formatIDR(w.amount_idr)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{w.bank_name} — {w.account_number} ({w.account_name})</p>
                {w.admin_note && <p className="text-[10px] text-gray-400 mt-0.5">Admin: {w.admin_note}</p>}
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(w.created_at)}</p>
              </div>
              <Badge className={statusColor[w.status] || ""}>{statusLabel[w.status] || w.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {withdrawals?.length === 0 && (
          <Card><CardContent className="p-10 text-center">
            <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-3"><Banknote className="h-7 w-7 text-orange-500" /></div>
            <p className="font-semibold">Belum ada penarikan</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
