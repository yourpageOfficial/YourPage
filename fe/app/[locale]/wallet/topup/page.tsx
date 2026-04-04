"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { Upload, CheckCircle, ArrowLeft } from "lucide-react";
import type { Wallet, ApiResponse } from "@/lib/types";

const presets = [10000, 25000, 50000, 100000, 250000, 500000];

export default function TopupPage() {
  const t = useTranslations("Topup");
  const qc = useQueryClient();
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
    onError: (err: any) => setError(err.response?.data?.error || t("failed")),
  });

  const uploadProof = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("donor_name", donorName);
      fd.append("proof", proofFile!);
      return api.post(`/wallet/topup/${topupData.id}/proof`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { setStep(3); setError(""); qc.invalidateQueries({ queryKey: ["wallet"] }); },
    onError: (err: any) => setError(err.response?.data?.error || t("upload_failed")),
  });

  const credits = amount ? Math.floor(parseInt(amount) / 1000) : 0;

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-md px-3 sm:px-4 py-6 sm:py-8">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("balance")} <span className="font-semibold text-primary">{wallet?.balance_credits ?? 0} Credit</span></p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 rounded-full transition-all ${step >= s ? "bg-primary w-8" : "bg-gray-200 dark:bg-gray-700 w-6"}`} />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{t("select_amount")}</CardTitle></CardHeader>
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
                <Input type="number" placeholder={t("other_amount")} value={amount} onChange={(e) => setAmount(e.target.value)} min={10000} step={1000} />
                {credits > 0 && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {t("you_will_get")} <span className="font-bold text-primary text-lg">{credits}</span> Credit
                  </p>
                )}
              </div>
              <Button className="w-full h-11" onClick={() => createTopup.mutate()} disabled={createTopup.isPending || !amount || parseInt(amount) < 10000}>
                {createTopup.isPending ? t("submitting") : t("proceed")}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && topupData && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{t("transfer_upload")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="text-center py-4 bg-primary-50 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("transfer_exact")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{formatIDR(topupData.amount_idr)}</p>
                <p className="text-xs text-gray-500 mt-1">{t("unique_code")} <span className="font-bold">{topupData.unique_code}</span></p>
              </div>

              {qrisData?.platform_qris_url ? (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">{t("scan_qris")}</p>
                  <img src={qrisData.platform_qris_url} alt="QRIS" className="mx-auto max-h-48 sm:max-h-64 rounded-lg" />
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-4">{t("no_qris")}</p>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("sender_name")}</label>
                  <Input placeholder={t("sender_placeholder")} value={donorName} onChange={(e) => setDonorName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("transfer_proof")}</label>
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
                        <p className="text-sm text-gray-500 mt-1">{t("tap_upload")}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button className="w-full h-11" onClick={() => uploadProof.mutate()} disabled={uploadProof.isPending || !donorName || !proofFile}>
                {uploadProof.isPending ? t("submitting") : t("submit_proof")}
              </Button>
              <button onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                <ArrowLeft className="h-3 w-3" /> {t("back")}
              </button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="py-10 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <p className="mt-4 text-lg font-semibold">{t("success_title")}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("success_desc")}</p>
              <Button className="mt-6" onClick={() => { setStep(1); setAmount(""); setDonorName(""); setProofFile(null); setTopupData(null); }}>
                {t("topup_again")}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </AuthGuard>
  );
}
