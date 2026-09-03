"use client";

import { ListSkeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

const statusIcons: Record<string, { color: string; icon: any }> = {
  pending: { color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", icon: Clock },
  approved: { color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", icon: CheckCircle },
  rejected: { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", icon: XCircle },
};

const statusLabels: Record<string, string> = {
  pending: "kycStatusPending",
  approved: "kycStatusApproved",
  rejected: "kycStatusRejected",
};

export default function DashboardKYC() {
  const qc = useQueryClient();
  const { t, interpolate } = useTranslation();
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
      // 1. Upload KTP image
      const fd = new FormData();
      fd.append("file", ktpFile!);
      // Private bucket: a KTP is an identity document and must never land in
      // the anonymously readable public bucket.
      const { data: uploadRes } = await api.post("/upload/private", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const ktpUrl = uploadRes.data.url;

      // 2. Submit KYC
      await api.post("/kyc", { ktp_image_url: ktpUrl, full_name: fullName, id_number: idNumber });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-kyc"] });
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || t.accountMgr.kycFailed);
    },
  });

  if (isLoading) return <ListSkeleton count={3} />;

  if (kyc) {
    const cfg = statusIcons[kyc.status] || statusIcons.pending;
    const label = t.accountMgr[statusLabels[kyc.status] as keyof typeof t.accountMgr] || t.accountMgr.kycStatusPending;
    const Icon = cfg.icon;
    return (
      <div>
        <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.accountMgr.kycTitle}</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <Icon className="mx-auto h-12 w-12 mb-3" />
            <Badge className={cfg.color}>{label}</Badge>
            <p className="mt-3 font-medium">{kyc.full_name}</p>
            {kyc.admin_note && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{interpolate(t.accountMgr.kycNote, { note: kyc.admin_note })}</p>}
            {kyc.status === "pending" && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t.accountMgr.kycReviewing}</p>}
            {kyc.status === "approved" && <p className="mt-2 text-sm text-green-600">{t.accountMgr.kycApproved}</p>}
            {kyc.status === "rejected" && <p className="mt-2 text-sm text-red-600">{t.accountMgr.kycRejected}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.accountMgr.kycTitle}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.accountMgr.kycUploadTitle}</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.accountMgr.kycUploadDesc}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="text-sm font-medium">{t.accountMgr.kycFullNameLabel}</label>
            <Input placeholder={t.accountMgr.kycFullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">{t.accountMgr.kycIdNumberLabel}</label>
            <Input placeholder={t.accountMgr.kycIdNumberPlaceholder} value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))} maxLength={16} />
            {idNumber && idNumber.length < 16 && <p className="text-xs text-gray-400 mt-1">{interpolate(t.accountMgr.kycDigitCount, { count: idNumber.length })}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">{t.accountMgr.kycPhotoLabel}</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setKtpFile(e.target.files?.[0] || null)} />
            <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> {ktpFile ? ktpFile.name : t.accountMgr.kycPhotoSelect}
            </Button>
            {ktpFile && <img loading="lazy" src={URL.createObjectURL(ktpFile)} alt="preview" className="mt-2 h-40 rounded border object-contain" />}
          </div>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending || !fullName || idNumber.length < 16 || !ktpFile}>
            {submit.isPending ? t.accountMgr.kycSubmitting : t.accountMgr.kycSubmitButton}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
