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
import { useTranslation } from "@/lib/internationalization";

export default function AdminSettings() {
  const qc = useQueryClient();
  const { t } = useTranslation();
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success(t.adminOverview.settingsSaved); },
    onError: (err: any) => toast.error(err.response?.data?.error || t.adminOverview.settingsSaveFailed),
  });

  const savePayment = useMutation({
    mutationFn: () => api.put("/admin/settings", {
      qris_enabled: qrisEnabled,
      stripe_enabled: stripeEnabled,
      stripe_publishable_key: pubKey,
      stripe_secret_key: secretKey,
      stripe_webhook_secret: whSecret,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success(t.adminOverview.paymentMethodsSaved); },
    onError: (err: any) => toast.error(err.response?.data?.error || t.adminOverview.settingsSaveFailed),
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
      toast.success(t.adminOverview.qrisPlatform);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t.adminOverview.uploadFailed),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.adminOverview.settingsTitle}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t.adminOverview.configuration}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t.adminOverview.platformFeePercent}</label>
              <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t.adminOverview.minWithdrawalIdr}</label>
              <Input type="number" value={minWd} onChange={(e) => setMinWd(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t.adminOverview.creditRateIdr}</label>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? t.adminOverview.saving : t.adminOverview.save}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.adminOverview.qrisPlatform}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.adminOverview.qrisDescription}</p>
            {qrisPreview ? (
              <img loading="lazy" src={qrisPreview} alt="QRIS" className="max-h-64 rounded border mx-auto" />
            ) : (
              <div className="h-48 bg-primary-50 dark:bg-navy-800 rounded flex items-center justify-center text-gray-400 dark:text-gray-500">{t.adminOverview.noQris}</div>
            )}
            <input ref={qrisRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadQris.mutate(e.target.files[0]); }} />
            <Button variant="outline" className="w-full" onClick={() => qrisRef.current?.click()} disabled={uploadQris.isPending}>
              <Upload className="mr-1 h-4 w-4" /> {uploadQris.isPending ? t.adminOverview.uploading : t.adminOverview.uploadNewQris}
            </Button>
          </CardContent>
        </Card>

        {/* Payment methods — full admin control */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> {t.adminOverview.paymentMethods}
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
                      <p className="font-semibold">{t.adminOverview.qrisManual}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.adminOverview.qrisManualDesc}</p>
                    </div>
                  </div>
                  <Switch checked={qrisEnabled} onCheckedChange={setQrisEnabled} aria-label={t.adminOverview.enableQris} />
                </div>
                {qrisEnabled && !qrisPreview && (
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{t.adminOverview.qrisUploadWarning}</p>
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
                      <p className="font-semibold">{t.adminOverview.stripeCard}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.adminOverview.stripeDesc}</p>
                    </div>
                  </div>
                  <Switch checked={stripeEnabled} onCheckedChange={setStripeEnabled} aria-label={t.adminOverview.enableStripe} />
                </div>
              </div>
            </div>

            {/* Stripe keys */}
            {stripeEnabled && (
              <div className="space-y-3 rounded-2xl border border-gray-200 dark:border-navy-800 p-4">
                <p className="text-sm font-semibold">{t.adminOverview.stripeConfiguration}</p>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.adminOverview.publishableKey}</label>
                  <Input placeholder="pk_live_..." value={pubKey} onChange={(e) => setPubKey(e.target.value)} className="mt-1 font-mono text-xs" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.adminOverview.secretKey}</label>
                  <div className="relative mt-1">
                    <Input type={showSecret ? "text" : "password"} placeholder="sk_live_..." value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="pr-10 font-mono text-xs" />
                    <button type="button" aria-label={showSecret ? t.adminOverview.hideSecret : t.adminOverview.showSecret} onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.adminOverview.webhookSecret}</label>
                  <Input type="password" placeholder="whsec_..." value={whSecret} onChange={(e) => setWhSecret(e.target.value)} className="mt-1 font-mono text-xs" />
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {t.adminOverview.webhookEndpoint}: <code className="rounded bg-gray-100 dark:bg-navy-800 px-1">/api/v1/webhooks/stripe</code> — event: checkout.session.completed & checkout.session.expired
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.adminOverview.keySecurityNote}</p>
              </div>
            )}

            <Button onClick={() => savePayment.mutate()} disabled={savePayment.isPending}>
              {savePayment.isPending ? t.adminOverview.saving : t.adminOverview.savePaymentMethods}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
