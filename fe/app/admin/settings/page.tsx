"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { useTranslation } from "@/lib/use-translation";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import type { PlatformSettings, ApiResponse } from "@/lib/types";

export default function AdminSettings() {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (settings) {
      setFee(String(settings.fee_percent));
      setMinWd(String(settings.min_withdrawal_idr));
      setRate(String(settings.credit_rate_idr));
      setQrisPreview(settings.platform_qris_url || null);
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () => api.put("/admin/settings", {
      fee_percent: parseInt(fee),
      min_withdrawal_idr: parseInt(minWd),
      credit_rate_idr: parseInt(rate),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success(t("admin_settings.saved")); },
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
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t("admin_settings.title")}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("admin_settings.configuration")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("admin_settings.platform_fee")}</label>
              <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("admin_settings.min_withdrawal")}</label>
              <Input type="number" value={minWd} onChange={(e) => setMinWd(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("admin_settings.credit_rate")}</label>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? t("admin_settings.saving") : t("admin_settings.save")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("admin_settings.qris_platform")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin_settings.qris_description")}</p>
            {qrisPreview ? (
              <img loading="lazy" src={qrisPreview} alt={t("admin_settings.qris")} className="max-h-64 rounded border mx-auto" />
            ) : (
              <div className="h-48 bg-primary-50 dark:bg-navy-800 rounded flex items-center justify-center text-gray-400 dark:text-gray-500">{t("admin_settings.no_qris")}</div>
            )}
            <input ref={qrisRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadQris.mutate(e.target.files[0]); }} />
            <Button variant="outline" className="w-full" onClick={() => qrisRef.current?.click()} disabled={uploadQris.isPending}>
              <Upload className="mr-1 h-4 w-4" /> {uploadQris.isPending ? t("admin_settings.uploading") : t("admin_settings.upload_new_qris")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
