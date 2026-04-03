"use client";

import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Package, Heart, Search, Wallet } from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-3 sm:px-4 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Selamat datang, {user?.display_name}! 🎉</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Akun kamu berhasil dibuat. Ini yang bisa kamu lakukan:</p>

        {user?.role === "creator" ? (
          <div className="mt-8 space-y-3 text-left">
            <StepCard icon={FileText} title="Buat Post Pertama" desc="Tulis konten gratis atau berbayar untuk fans kamu." href="/dashboard/posts" />
            <StepCard icon={Package} title="Upload Produk Digital" desc="Jual e-book, preset, template, dan lainnya." href="/dashboard/products" />
            <StepCard icon={Heart} title="Terima Donasi" desc="Fans bisa kirim donasi langsung ke halaman kamu." href={`/c/${user?.creator_profile?.page_slug || user?.username}`} />
            <Link href="/dashboard"><Button className="w-full mt-4" size="lg">Buka Dashboard →</Button></Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3 text-left">
            <StepCard icon={Search} title="Temukan Kreator" desc="Cari dan follow kreator favoritmu." href="/explore" />
            <StepCard icon={Wallet} title="Top-up Credit" desc="Isi saldo untuk beli konten dan kirim donasi." href="/wallet/topup" />
            <StepCard icon={FileText} title="Beli Konten" desc="Akses konten eksklusif dari kreator." href="/explore" />
            <Link href="/s"><Button className="w-full mt-4" size="lg">Buka Dashboard →</Button></Link>
          </div>
        )}
      </main>
    </>
  );
}

function StepCard({ icon: Icon, title, desc, href }: { icon: any; title: string; desc: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
