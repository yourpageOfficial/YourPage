"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Upload, Clock, ArrowLeft, QrCode, CreditCard, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { Wallet, ApiResponse, PaymentMethods, TopupRequest } from "@/lib/types";

const presets = [10000, 25000, 50000, 100000, 250000, 500000];

function TopupPageInner() {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const qc = useQueryClient();
  const params = useSearchParams();
  const returnStatus = params.get("status"); // success | cancelled (Stripe redirect back)
  const returnTopupId = params.get("topup_id");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<"qris" | "stripe">("qris");
  const [amount, setAmount] = useState("");
  const [topupData, setTopupData] = useState<any>(null);
  const [donorName, setDonorName] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Wallet>>("/wallet/balance"); return data.data; },
  });

  const { data: methods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<PaymentMethods>>("/platform/payment-methods"); return data.data; },
  });

  // After Stripe redirect: poll topup status (webhook may lag a moment)
  const { data: returnTopup } = useQuery({
    queryKey: ["topup-status", returnTopupId],
    queryFn: async () => { const { data } = await api.get<ApiResponse<TopupRequest>>(`/wallet/topup/${returnTopupId}`); return data.data; },
    enabled: !!returnTopupId && returnStatus === "success",
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 2500 : false),
  });

  useEffect(() => {
    if (returnTopup?.status === "paid") qc.invalidateQueries({ queryKey: ["wallet"] });
  }, [returnTopup?.status, qc]);

  // Default method: first enabled one
  useEffect(() => {
    if (methods) {
      if (!methods.qris_enabled && methods.stripe_enabled) setMethod("stripe");
      else setMethod("qris");
    }
  }, [methods]);

  const createTopup = useMutation({
    mutationFn: () => api.post("/wallet/topup", { amount_idr: String(Math.floor(parseInt(amount) || 0)), method }),
    onSuccess: (res) => {
      const data = res.data.data;
      setError("");
      if (data.method === "stripe" && data.checkout_url) {
        window.location.href = data.checkout_url; // hosted Stripe Checkout
        return;
      }
      setTopupData(data);
      setStep(2);
    },
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
  const noMethodAvailable = methods && !methods.qris_enabled && !methods.stripe_enabled;

  // ---- Stripe return screens ----
  if (returnStatus === "success") {
    const st = returnTopup?.status;
    return (
      <AuthGuard>
        <Navbar />
        <main className="mx-auto max-w-md px-3 sm:px-4 py-6 sm:py-8">
          <Card>
            <CardContent className="py-10 text-center">
              {st === "paid" ? (
                <>
                  <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                  <p className="mt-4 text-lg font-semibold">Top-up Berhasil! 🎉</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {returnTopup?.credits} Credit sudah masuk ke saldo kamu.
                  </p>
                </>
              ) : st === "failed" || st === "expired" ? (
                <>
                  <XCircle className="mx-auto h-16 w-16 text-red-500" />
                  <p className="mt-4 text-lg font-semibold">Pembayaran Gagal</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sesi pembayaran berakhir. Silakan coba lagi.</p>
                </>
              ) : (
                <>
                  <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-semibold">Memverifikasi pembayaran…</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sebentar ya, kami sedang konfirmasi ke Stripe.</p>
                </>
              )}
              <Button className="mt-6" onClick={() => router.replace("/wallet")}>Ke Wallet</Button>
            </CardContent>
          </Card>
        </main>
      </AuthGuard>
    );
  }

  if (returnStatus === "cancelled") {
    return (
      <AuthGuard>
        <Navbar />
        <main className="mx-auto max-w-md px-3 sm:px-4 py-6 sm:py-8">
          <Card>
            <CardContent className="py-10 text-center">
              <XCircle className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-4 text-lg font-semibold">Pembayaran Dibatalkan</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada dana yang terpotong.</p>
              <Button className="mt-6" onClick={() => router.replace("/wallet/topup")}>Coba Lagi</Button>
            </CardContent>
          </Card>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-md px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-black tracking-tight">Top-up Credit</h1>
          <p className="text-sm text-gray-500 mt-1">Saldo kamu: <span className="font-semibold text-primary">{wallet?.balance_credits ?? 0} Credit</span></p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">1 Credit = Rp 1.000</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 rounded-full transition-all ${step >= s ? "bg-primary w-8" : "bg-primary-100 dark:bg-navy-800 w-6"}`} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Pilih Nominal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              {noMethodAvailable && (
                <p className="text-sm text-amber-600 dark:text-amber-400">⚠ Belum ada metode pembayaran aktif. Hubungi admin.</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(String(p))}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${
                      amount === String(p)
                        ? "border-primary bg-primary-50 dark:bg-primary-900/20 text-primary"
                        : "border-primary-100 dark:border-navy-800 hover:border-primary-200"
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

              {/* Method picker */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Metode Pembayaran</p>
                <div className="grid gap-2">
                  {methods?.qris_enabled !== false && (
                    <button
                      onClick={() => setMethod("qris")}
                      aria-pressed={method === "qris"}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                        method === "qris" ? "border-primary bg-primary-50/60 dark:bg-primary-900/20" : "border-gray-200 dark:border-navy-800 hover:border-primary-200"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><QrCode className="h-5 w-5" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">QRIS</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">GoPay · OVO · Dana · ShopeePay · M-Banking — verifikasi 1×24 jam</p>
                      </div>
                    </button>
                  )}
                  {methods?.stripe_enabled && (
                    <button
                      onClick={() => setMethod("stripe")}
                      aria-pressed={method === "stripe"}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                        method === "stripe" ? "border-primary bg-primary-50/60 dark:bg-primary-900/20" : "border-gray-200 dark:border-navy-800 hover:border-primary-200"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-600 dark:text-secondary-400"><CreditCard className="h-5 w-5" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Kartu Kredit/Debit</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Via Stripe — credit masuk otomatis ⚡</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <Button className="w-full h-11" onClick={() => createTopup.mutate()} disabled={createTopup.isPending || !amount || parseInt(amount) < 10000 || !!noMethodAvailable}>
                {createTopup.isPending ? "Memproses..." : method === "stripe" ? "Bayar dengan Kartu →" : "Lanjut →"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — QRIS manual */}
        {step === 2 && topupData && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Transfer & Upload Bukti</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

              {/* Amount highlight */}
              <div className="text-center py-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-xs text-gray-500 dark:text-gray-400">Transfer tepat sebesar</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{formatIDR(topupData.amount_idr)}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-yellow-700 dark:text-yellow-400">Kode unik:</span>
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{topupData.unique_code}</span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 px-4">Nominal harus tepat termasuk kode unik agar transfer kamu bisa dikenali otomatis</p>
              </div>

              {/* QRIS */}
              {methods?.platform_qris_url ? (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Scan QRIS di bawah:</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">GoPay · OVO · Dana · ShopeePay · QRIS · M-Banking</p>
                  <img loading="lazy" src={methods.platform_qris_url} alt="QRIS" className="mx-auto max-h-48 sm:max-h-64 rounded-xl shadow" />
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
                  <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 10 * 1024 * 1024) { toast.error("Maksimal 10MB"); return; }
                    setProofFile(f || null);
                  }} />
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="mt-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    {proofFile ? (
                      <img loading="lazy" src={URL.createObjectURL(proofFile)} alt="preview" className="mx-auto max-h-32 rounded object-contain" />
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
              <button onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 cursor-pointer">
                <ArrowLeft className="h-3 w-3" /> Kembali
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — QRIS submitted */}
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

export default function TopupPage() {
  return (
    <Suspense>
      <TopupPageInner />
    </Suspense>
  );
}
