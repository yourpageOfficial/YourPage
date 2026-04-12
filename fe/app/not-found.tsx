"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-navy-900">
      <div className="text-center">
        <div className="h-20 w-20 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-6">
          <SearchX className="h-10 w-10 text-primary" />
        </div>
        <p className="text-6xl font-black text-primary/20 mb-2">404</p>
        <h1 className="text-xl font-display font-black tracking-tight mb-1">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
        <Link href="/"><Button className="rounded-2xl">Kembali ke Beranda</Button></Link>
      </div>
    </div>
  );
}
