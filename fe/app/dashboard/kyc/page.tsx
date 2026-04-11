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

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", icon: Clock, label: "Menunggu Review" },
  approved: { color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", icon: CheckCircle, label: "Disetujui" },
  rejected: { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", icon: XCircle, label: "Ditolak" },
};

export default function DashboardKYC() {
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
      // 1. Upload KTP image
      const fd = new FormData();
      fd.append("file", ktpFile!);
      const { data: uploadRes } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const ktpUrl = uploadRes.data.url;

      // 2. Submit KYC
      await api.post("/kyc", { ktp_image_url: ktpUrl, full_name: fullName, id_number: idNumber });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-kyc"] });
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Gagal submit KYC");
    },
  });

  if (isLoading) return <ListSkeleton count={3} />;

  if (kyc) {
    const cfg = statusConfig[kyc.status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <div>
        <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Verifikasi KYC</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <Icon className="mx-auto h-12 w-12 mb-3" />
            <Badge className={cfg.color}>{cfg.label}</Badge>
            <p className="mt-3 font-medium">{kyc.full_name}</p>
            {kyc.admin_note && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Catatan: {kyc.admin_note}</p>}
            {kyc.status === "pending" && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Admin sedang mereview dokumen kamu.</p>}
            {kyc.status === "approved" && <p className="mt-2 text-sm text-green-600">KYC diverifikasi. Kamu bisa melakukan penarikan.</p>}
            {kyc.status === "rejected" && <p className="mt-2 text-sm text-red-600">Hubungi admin untuk submit ulang.</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Verifikasi KYC</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload KTP</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Diperlukan untuk penarikan pertama. Data aman dan tidak ditampilkan publik.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="text-sm font-medium">Nama Lengkap (sesuai KTP)</label>
            <Input placeholder="Nama lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Nomor KTP (16 digit)</label>
            <Input placeholder="3201234567890001" value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))} maxLength={16} />
            {idNumber && idNumber.length < 16 && <p className="text-xs text-gray-400 mt-1">{idNumber.length}/16 digit</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Foto KTP</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setKtpFile(e.target.files?.[0] || null)} />
            <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> {ktpFile ? ktpFile.name : "Pilih foto KTP"}
            </Button>
            {ktpFile && <img loading="lazy" src={URL.createObjectURL(ktpFile)} alt="preview" className="mt-2 h-40 rounded border object-contain" />}
          </div>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending || !fullName || idNumber.length < 16 || !ktpFile}>
            {submit.isPending ? "Mengirim..." : "Submit KYC"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
