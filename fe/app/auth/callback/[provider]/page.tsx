"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function OAuthCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const provider = params?.provider as string;

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      setError("Parameter otorisasi OAuth tidak lengkap.");
      return;
    }

    const processOAuth = async () => {
      try {
        const res = await api.post(`/auth/oauth/${provider}/callback`, { code, state });
        if (res.data?.success) {
          // Token is saved in HttpOnly cookie; redirect to dashboard or home
          window.location.href = "/dashboard";
        } else {
          setError(res.data?.error || "Gagal memproses otorisasi sosial.");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
            "Otorisasi sosial gagal atau telah kedaluwarsa. Silakan coba lagi."
        );
      }
    };

    processOAuth();
  }, [provider, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-navy-950">
      <div className="max-w-md w-full text-center p-8 bg-white dark:bg-navy-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        {error ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Gagal Masuk
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="inline-block mt-4 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Memproses Autentikasi...
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mohon tunggu, sedang menghubungkan ke akun Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
