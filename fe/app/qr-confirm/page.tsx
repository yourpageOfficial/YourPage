"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2, MonitorSmartphone } from "lucide-react";

function QRConfirmContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const token = params.get("token") || "";

  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const confirm = async () => {
    setState("sending");
    setError("");
    try {
      await api.post("/auth/qr-login/confirm", { qr_token: token });
      setState("done");
    } catch (err: any) {
      setError(err.response?.data?.error || "Kode QR tidak valid atau sudah kedaluwarsa.");
      setState("idle");
    }
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-semibold">Kode QR tidak lengkap</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Scan ulang kode dari halaman login di perangkat yang ingin kamu masuki.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Memuat…</CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-semibold">Masuk dulu di perangkat ini</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Kamu perlu login di HP ini sebelum bisa menyetujui login di perangkat lain.
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push(`/login?next=${encodeURIComponent(`/qr-confirm?token=${token}`)}`)}
          >
            Masuk
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state === "done") {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <p className="mt-4 text-lg font-semibold">Login disetujui</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Perangkat yang menampilkan kode QR sekarang masuk sebagai {user.display_name}.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => router.push("/")}>Selesai</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MonitorSmartphone className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">Setujui login di perangkat lain?</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Perangkat yang menampilkan kode ini akan masuk sebagai{" "}
            <span className="font-medium text-gray-700 dark:text-gray-200">{user.display_name}</span>.
            Lanjutkan hanya jika kamu sendiri yang membuka halaman login itu.
          </p>
          <p className="mt-3 font-mono text-xs tracking-widest text-gray-400 dark:text-gray-500">{token}</p>
        </div>

        {error && <Alert variant="error" className="mt-5">{error}</Alert>}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>Batal</Button>
          <Button className="flex-1" onClick={confirm} disabled={state === "sending"}>
            {state === "sending" ? "Menyetujui…" : "Setujui"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QRConfirmPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-10">
        <Suspense fallback={<div />}>
          <QRConfirmContent />
        </Suspense>
      </main>
    </>
  );
}
