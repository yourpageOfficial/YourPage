"use client";

import { useTranslations } from "next-intl";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, Clock, XCircle } from "lucide-react";

export default function DashboardKYC() {
  const t = useTranslations("KYC");
  const tCommon = useTranslations("Common");
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const { data: kyc, isLoading } = useQuery({
    queryKey: ["my-kyc"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/kyc");
        return data.data as { full_name: string; status: string; admin_note?: string };
      } catch {
        return null;
      }
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("file", ktpFile!);
      const { data: uploadRes } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const ktpUrl = uploadRes.data.url;

      await api.post("/kyc", { ktp_image_url: ktpUrl, full_name: fullName, id_number: idNumber });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-kyc"] });
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || t("submit_failed"));
    },
  });

  if (isLoading) return <ListSkeleton count={3} />;

  if (kyc) {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", icon: Clock, label: t("pending_review") },
      approved: { color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", icon: CheckCircle, label: t("approved") },
      rejected: { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", icon: XCircle, label: t("rejected") },
    };
    const cfg = statusConfig[kyc.status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <Icon className="mx-auto h-12 w-12 mb-3" />
            <Badge className={cfg.color}>{cfg.label}</Badge>
            <p className="mt-3 font-medium">{kyc.full_name}</p>
            {kyc.admin_note && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t("note")} {kyc.admin_note}</p>}
            {kyc.status === "pending" && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("pending_review")}</p>}
            {kyc.status === "approved" && <p className="mt-2 text-sm text-green-600">{t("approved")}</p>}
            {kyc.status === "rejected" && <p className="mt-2 text-sm text-red-600">{t("rejected")}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("upload_ktp")}</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("upload_ktp_desc")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="text-sm font-medium">{t("full_name")}</label>
            <Input placeholder={t("full_name_placeholder")} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">{t("ktp_number")}</label>
            <Input placeholder={t("ktp_placeholder")} value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))} maxLength={16} />
            {idNumber && idNumber.length < 16 && <p className="text-xs text-gray-400 mt-1">{idNumber.length}/{t("digits")}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">{t("ktp_photo")}</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setKtpFile(e.target.files?.[0] || null)} />
            <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> {ktpFile ? ktpFile.name : t("select_ktp")}
            </Button>
            {ktpFile && <img src={URL.createObjectURL(ktpFile)} alt="preview" className="mt-2 h-40 rounded border object-contain" />}
          </div>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending || !fullName || idNumber.length < 16 || !ktpFile}>
            {submit.isPending ? t("submitting") : t("submit_kyc")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
