"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

const ROLE_OPTIONS = [
  {
    value: "supporter" as const,
    label: "Supporter",
    desc: "Beli konten, kirim donasi, chat dengan kreator",
  },
  {
    value: "creator" as const,
    label: "Kreator",
    desc: "Jual konten, terima donasi, buka page sendiri",
  },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"supporter" | "creator">("supporter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const router = useRouter();

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      await register(email, username, password, role);
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-gray-900 px-3 sm:px-4 pb-safe">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="text-2xl font-bold text-primary">YourPage</Link>
          <CardTitle>Daftar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Username (huruf kecil, tanpa spasi)" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} required />
            <Input type="password" placeholder="Password (min 8 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <Input type="password" placeholder="Ulangi password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <div>
              <p className="text-sm font-medium mb-2">Saya daftar sebagai:</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      role === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${role === opt.value ? "text-primary" : ""}`}>{opt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </Button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Sudah punya akun? <Link href="/login" className="text-primary hover:underline">Masuk</Link>
            </p>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Dengan mendaftar, kamu setuju dengan <a href="/terms" className="underline">Syarat & Ketentuan</a> dan <a href="/privacy" className="underline">Kebijakan Privasi</a>.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
