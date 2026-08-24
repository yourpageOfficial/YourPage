"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, QrCode, CreditCard, ShieldCheck, Eye, EyeOff } from "lucide-react";
import type { PlatformSettings, ApiResponse } from "@/lib/types";

export default function AdminSettings() {
  const qc = useQueryClient();
  const qrisRef = useRef<HTMLInputElement>(null);
  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<PlatformSettings>>("/admin/settings"); return data.data; },
  });

  const [fee, setFee] = useState("");
  const [minWd, setMinWd] = useState("");
  const [rate, setRate] = useState("");
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);

  // Payment methods state
  const [qrisEnabled, setQrisEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [pubKey, setPubKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [whSecret, setWhSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (settings) {
      setFee(String(settings.fee_percent));
      setMinWd(String(settings.min_withdrawal_idr));
      setRate(String(settings.credit_rate_idr));
      setQrisPreview(settings.platform_qris_url || null);
      setQrisEnabled(settings.qris_enabled);
      setStripeEnabled(settings.stripe_enabled);
      setPubKey(settings.stripe_publishable_key || "");
      setSecretKey(settings.stripe_secret_key || "");
      setWhSecret(settings.stripe_webhook_secret || "");
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () => api.put("/admin/settings", {
      fee_percent: parseInt(fee),
      min_withdrawal_idr: parseInt(minWd),
      credit_rate_idr: parseInt(rate),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Settings tersimpan!"); },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menyimpan"),
  });

  const savePayment = useMutation({
    mutationFn: () => api.put("/admin/settings", {
      qris_enabled: qrisEnabled,
      stripe_enabled: stripeEnabled,
      stripe_publishable_key: pubKey,
      stripe_secret_key: secretKey,
      stripe_webhook_secret: whSecret,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Metode pembayaran tersimpan!"); },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menyimpan"),
  });

  const uploadQris = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data: uploadRes } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = uploadRes.data.url;
      await api.put("/admin/settings", { platform_qris_url: url });
      return url;
    },
    onSuccess: (url) => {
      setQrisPreview(url);
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("QRIS terupload!");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal upload"),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Platform Settings</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Konfigurasi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Platform Fee (%)</label>
              <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Min Withdrawal (IDR)</label>
              <Input type="number" value={minWd} onChange={(e) => setMinWd(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Credit Rate (IDR per credit)</label>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>QRIS Platform</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Gambar QRIS yang ditampilkan ke user saat top-up manual.</p>
            {qrisPreview ? (
              <img loading="lazy" src={qrisPreview} alt="QRIS" className="max-h-64 rounded border mx-auto" />
            ) : (
              <div className="h-48 bg-primary-50 dark:bg-navy-800 rounded flex items-center justify-center text-gray-400 dark:text-gray-500">Belum ada QRIS</div>
            )}
            <input ref={qrisRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadQris.mutate(e.target.files[0]); }} />
            <Button variant="outline" className="w-full" onClick={() => qrisRef.current?.click()} disabled={uploadQris.isPending}>
              <Upload className="mr-1 h-4 w-4" /> {uploadQris.isPending ? "Uploading..." : "Upload QRIS Baru"}
            </Button>
          </CardContent>
        </Card>

        {/* Payment methods — full admin control */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Metode Pembayaran Top-up
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* QRIS manual */}
              <div className={`rounded-2xl border-2 p-4 transition-colors ${qrisEnabled ? "border-primary/40 bg-primary-50/50 dark:bg-primary-900/10" : "border-gray-200 dark:border-navy-800"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">QRIS Manual</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">User transfer via QRIS, upload bukti, admin verifikasi manual.</p>
                    </div>
                  </div>
                  <Switch checked={qrisEnabled} onCheckedChange={setQrisEnabled} aria-label="Aktifkan QRIS" />
                </div>
                {qrisEnabled && !qrisPreview && (
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">⚠ Upload gambar QRIS dulu agar user bisa scan.</p>
                )}
              </div>

              {/* Stripe */}
              <div className={`rounded-2xl border-2 p-4 transition-colors ${stripeEnabled ? "border-secondary-400/50 bg-secondary-50/50 dark:bg-secondary-900/10" : "border-gray-200 dark:border-navy-800"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-600 dark:text-secondary-400">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Stripe (Kartu)</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pembayaran kartu otomatis via Stripe Checkout. Credit masuk instan.</p>
                    </div>
                  </div>
                  <Switch checked={stripeEnabled} onCheckedChange={setStripeEnabled} aria-label="Aktifkan Stripe" />
                </div>
              </div>
            </div>

            {/* Stripe keys */}
            {stripeEnabled && (
              <div className="space-y-3 rounded-2xl border border-gray-200 dark:border-navy-800 p-4">
                <p className="text-sm font-semibold">Konfigurasi Stripe</p>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Publishable Key</label>
                  <Input placeholder="pk_live_..." value={pubKey} onChange={(e) => setPubKey(e.target.value)} className="mt-1 font-mono text-xs" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Secret Key</label>
                  <div className="relative mt-1">
                    <Input type={showSecret ? "text" : "password"} placeholder="sk_live_..." value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="pr-10 font-mono text-xs" />
                    <button type="button" aria-label={showSecret ? "Sembunyikan" : "Tampilkan"} onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Webhook Signing Secret</label>
                  <Input type="password" placeholder="whsec_..." value={whSecret} onChange={(e) => setWhSecret(e.target.value)} className="mt-1 font-mono text-xs" />
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    Endpoint webhook: <code className="rounded bg-gray-100 dark:bg-navy-800 px-1">/api/v1/webhooks/stripe</code> — event: checkout.session.completed & checkout.session.expired
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Key tersimpan aman — API hanya menampilkan 4 karakter terakhir. Isi ulang hanya jika ingin mengganti.</p>
              </div>
            )}

            <Button onClick={() => savePayment.mutate()} disabled={savePayment.isPending}>
              {savePayment.isPending ? "Menyimpan..." : "Simpan Metode Pembayaran"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
