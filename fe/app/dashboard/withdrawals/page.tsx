"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { statusColor, statusLabel } from "@/components/ui/standards";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatCredit, formatDate } from "@/lib/utils";
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
    queryFn: async () => {
      const { data } = await api.get("/creator/earnings");
      return data.data as { total_earnings: number };
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get("/wallet/balance"); return data.data; },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["my-withdrawals"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Withdrawal>>("/withdrawals");
      return data.data;
    },
  });

  const validateWithdrawal = (): string | null => {
    if (!/^\d{10,16}$/.test(accNumber)) return "Nomor rekening harus 10-16 digit angka";
    if (!amount || parseInt(amount) < 100) return "Minimum penarikan 100 Credit";
    return null;
  };

  const create = useMutation({
    mutationFn: () => {
      const validationError = validateWithdrawal();
      if (validationError) return Promise.reject(new Error(validationError));
      return api.post("/withdrawals", {
        amount_idr: Math.floor(parseInt(amount) || 0) * 1000,
        bank_name: bankName,
        account_number: accNumber,
        account_name: accName,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["creator-earnings"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      setShowForm(false);
      setAmount("");
      setBankName("");
      setAccNumber("");
      setAccName("");
      setError("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Gagal";
      if (msg.includes("digit")) setError(msg);
      else if (msg.includes("minimum") || msg.includes("100 Credit")) setError("Minimum penarikan 100 Credit");
      else if (msg.includes("Credit") || msg.includes("insufficient")) setError("Saldo tidak cukup");
      else if (msg.includes("KYC")) setError("KYC harus diverifikasi terlebih dahulu untuk penarikan pertama");
      else setError(msg);
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Penarikan Dana</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>Tarik Dana</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Credit</p>
            <p className="text-2xl font-bold text-primary">{wallet?.balance_credits ?? 0} Credit</p>
            <p className="text-xs text-gray-400 dark:text-gray-400">= {formatIDR((wallet?.balance_credits ?? 0) * 1000)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</p>
            <p className="text-lg font-semibold text-green-600">{formatCredit(earnings?.total_earnings ?? 0)} Credit</p>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Form Penarikan Dana</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-sm font-medium">Nominal Credit (min 100 Credit = Rp 100.000)</label>
              <Input type="number" placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{amount ? `= Rp ${(parseInt(amount) * 1000).toLocaleString("id-ID")}` : ""}</p>
            </div>
            <Input placeholder="Nama Bank (BCA, BNI, Mandiri, dll)" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <Input placeholder="Nomor Rekening (10-16 digit)" value={accNumber} onChange={(e) => setAccNumber(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={16} />
            <div>
              <Input placeholder="Konfirmasi Nomor Rekening" value={accNumberConfirm} onChange={(e) => setAccNumberConfirm(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={16} />
              {accNumberConfirm && accNumber !== accNumberConfirm && <p className="text-xs text-red-500 mt-1">Nomor rekening tidak cocok</p>}
            </div>
            <Input placeholder="Nama Pemilik Rekening (sesuai KTP)" value={accName} onChange={(e) => setAccName(e.target.value)} />
            <Button onClick={() => create.mutate()} disabled={create.isPending || !amount || !bankName || !accNumber || accNumber !== accNumberConfirm || !accName}>
              {create.isPending ? "Memproses..." : "Kirim Request"}
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
                {w.admin_note && <p className="text-xs text-gray-500 mt-1">Catatan admin: {w.admin_note}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-400">{formatDate(w.created_at)}</p>
              </div>
              <Badge className={statusColor[w.status] || ""}>{statusLabel[w.status] || w.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {withdrawals?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada penarikan.</p>}
      </div>
    </div>
  );
}
