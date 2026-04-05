"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { Upload, Clock, ArrowLeft } from "lucide-react";
import type { Wallet, ApiResponse } from "@/lib/types";

const presets = [10000, 25000, 50000, 100000, 250000, 500000];

export default function TopupPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState("");
  const [topupData, setTopupData] = useState<any>(null);
  const [donorName, setDonorName] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Wallet>>("/wallet/balance"); return data.data; },
  });

  const { data: qrisData } = useQuery({
    queryKey: ["platform-qris"],
    queryFn: async () => { const { data } = await api.get("/platform/qris"); return data.data; },
  });

  const createTopup = useMutation({
    mutationFn: () => api.post("/wallet/topup", { amount_idr: amount }),
    onSuccess: (res) => { setTopupData(res.data.data); setStep(2); setError(""); },
    onError: (err: any) => setError(err.response?.data?.error || "Gagal"),
  });

  const uploadProof = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("donor_name", donorName);
      fd.append("proof", proofFile!);
      return api.post(`/wallet/topup/${topupData.id}/proof`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { setStep(3); setError(""); },
    onError: (err: any) => setError(err.response?.data?.error || "Gagal upload"),
  });

  const credits = amount ? Math.floor(parseInt(amount) / 1000) : 0;

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-md px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Top-up Credit</h1>
          <p className="text-sm text-gray-500 mt-1">Saldo kamu: <span className="font-semibold text-primary">{wallet?.balance_credits ?? 0} Credit</span></p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">1 Credit = Rp 1.000</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 rounded-full transition-all ${step >= s ? "bg-primary w-8" : "bg-gray-200 dark:bg-gray-700 w-6"}`} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Pilih Nominal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(String(p))}
                    className={`py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      amount === String(p)
                        ? "border-primary bg-primary-50 text-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {formatIDR(p)}
                  </button>
                ))}
              </div>
              <div>
                <Input type="number" placeholder="Nominal lain (min 10.000)" value={amount} onChange={(e) => setAmount(e.target.value)} min={10000} step={1000} />
                {credits > 0 && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Kamu akan mendapat <span className="font-bold text-primary text-lg">{credits}</span> Credit
                  </p>
                )}
              </div>
              <Button className="w-full h-11" onClick={() => createTopup.mutate()} disabled={createTopup.isPending || !amount || parseInt(amount) < 10000}>
                {createTopup.isPending ? "Memproses..." : "Lanjut →"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && topupData && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Transfer & Upload Bukti</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Amount highlight */}
              <div className="text-center py-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-xs text-gray-500 dark:text-gray-400">Transfer tepat sebesar</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{formatIDR(topupData.amount_idr)}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-yellow-700 dark:text-yellow-400">Kode unik:</span>
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{topupData.unique_code}</span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 px-4">Nominal harus tepat termasuk kode unik agar transfer kamu bisa dikenali otomatis</p>
              </div>

              {/* QRIS */}
              {qrisData?.platform_qris_url ? (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Scan QRIS di bawah:</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">GoPay · OVO · Dana · ShopeePay · QRIS · M-Banking</p>
                  <img src={qrisData.platform_qris_url} alt="QRIS" className="mx-auto max-h-48 sm:max-h-64 rounded-lg shadow" />
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-4">QRIS belum diatur admin</p>
              )}

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nama Pengirim</label>
                  <Input placeholder="Nama di rekening / e-wallet" value={donorName} onChange={(e) => setDonorName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Bukti Transfer</label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    {proofFile ? (
                      <img src={URL.createObjectURL(proofFile)} alt="preview" className="mx-auto max-h-32 rounded object-contain" />
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-500 mt-1">Tap untuk upload bukti</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button className="w-full h-11" onClick={() => uploadProof.mutate()} disabled={uploadProof.isPending || !donorName || !proofFile}>
                {uploadProof.isPending ? "Mengirim..." : "Kirim Bukti Transfer"}
              </Button>
              <button onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Kembali
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card>
            <CardContent className="py-10 text-center">
              <Clock className="mx-auto h-16 w-16 text-yellow-500" />
              <p className="mt-4 text-lg font-semibold">Bukti Transfer Diterima</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Menunggu verifikasi admin (1×24 jam). Credit akan ditambahkan setelah disetujui.
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Kamu akan mendapat notifikasi setelah admin memverifikasi.
              </p>
              <Button className="mt-6" onClick={() => { setStep(1); setAmount(""); setDonorName(""); setProofFile(null); setTopupData(null); }}>
                Top-up Lagi
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </AuthGuard>
  );
}
