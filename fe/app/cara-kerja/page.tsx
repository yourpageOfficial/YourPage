"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";

export default function CaraKerjaPage() {
  return (
    <>
      <Navbar />
      {/* Hero */}
      <div className="bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="relative text-center py-14 sm:py-20 px-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Cara Kerja YourPage</h1>
          <p className="text-primary-200 mt-3 text-lg">Panduan lengkap untuk kreator dan supporter</p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-black mb-8">🎨 Untuk Kreator</h2>
        <div className="space-y-4 mb-16">
          {[
            { step: "1", title: "Daftar Gratis", desc: "Buat akun dengan email, pilih username. Username akan jadi link halaman kamu: urpage.online/c/username", color: "from-primary to-primary-700" },
            { step: "2", title: "Atur Profil", desc: "Upload avatar, banner, tulis bio, tambah social media links. Pro/Business bisa custom warna halaman.", color: "from-primary-500 to-primary-700" },
            { step: "3", title: "Buat Konten", desc: "Post gratis atau berbayar (set harga dalam Credit). Upload produk digital (file, link, atau license key).", color: "from-primary-600 to-primary-800" },
            { step: "4", title: "Set Donasi & Chat", desc: "Atur target donasi dengan progress bar. Set harga chat per pesan (atau gratis). Setup OBS overlay untuk live streaming.", color: "from-accent-400 to-accent-500" },
            { step: "5", title: "Terima Pembayaran", desc: "Fans beli konten, kirim donasi, chat berbayar. Semua masuk ke wallet Credit kamu.", color: "from-green-500 to-green-600" },
            { step: "6", title: "Cairkan Dana", desc: "Verifikasi KYC (upload KTP), lalu tarik Credit ke rekening bank. Min 100 Credit = Rp 100.000.", color: "from-green-600 to-green-700" },
          ].map(s => (
            <Card key={s.step} hover>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md`}>{s.step}</div>
                <div><h3 className="font-bold text-base">{s.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{s.desc}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">☕ Untuk Supporter</h2>
        <div className="space-y-4 mb-16">
          {[
            { step: "1", title: "Daftar & Top-up", desc: "Buat akun supporter. Top-up Credit via QRIS (1 Credit = Rp 1.000). Admin approve dalam 24 jam." },
            { step: "2", title: "Explore Kreator", desc: "Cari kreator favorit di halaman Explore. Follow untuk lihat konten mereka di Feed." },
            { step: "3", title: "Beli & Dukung", desc: "Beli post/produk berbayar, kirim donasi dengan pesan, atau chat langsung dengan kreator." },
            { step: "4", title: "Akses Selamanya", desc: "Konten yang sudah dibeli bisa diakses selamanya di Library, bahkan jika kreator hapus post." },
          ].map(s => (
            <Card key={s.step} hover>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">{s.step}</div>
                <div><h3 className="font-bold text-base">{s.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{s.desc}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">💰 Struktur Fee</h2>
        <Card className="mb-16 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-navy-800/50">
                <th className="text-left py-4 px-5 font-semibold">Tier</th><th className="text-center py-4 px-5 font-semibold">Harga</th><th className="text-center py-4 px-5 font-semibold">Fee</th><th className="text-center py-4 px-5 font-semibold">Kreator Dapat</th>
              </tr></thead>
              <tbody>
                <tr className="border-b border-blue-50 dark:border-primary-900/20"><td className="py-3.5 px-5 font-medium">Free</td><td className="text-center">Gratis</td><td className="text-center">20%</td><td className="text-center font-bold text-green-600">80%</td></tr>
                <tr className="border-b border-blue-50 dark:border-primary-900/20 bg-primary-50/30 dark:bg-navy-800/30"><td className="py-3.5 px-5 font-medium">Pro</td><td className="text-center">Rp 49.000/bln</td><td className="text-center">10%</td><td className="text-center font-bold text-green-600">90%</td></tr>
                <tr className="border-b border-blue-50 dark:border-primary-900/20"><td className="py-3.5 px-5 font-medium">Business</td><td className="text-center">Rp 149.000/bln</td><td className="text-center">5%</td><td className="text-center font-bold text-green-600">95%</td></tr>
              </tbody>
            </table>
          </div>
        </Card>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">❓ FAQ</h2>
        <div className="space-y-3 mb-16">
          {[
            { q: "Apakah benar-benar gratis?", a: "Ya! Daftar gratis, tanpa biaya bulanan. Fee hanya dipotong saat ada transaksi." },
            { q: "Berapa lama pencairan dana?", a: "Setelah admin approve, dana ditransfer dalam 1-3 hari kerja ke rekening bank kamu." },
            { q: "Apakah konten yang dibeli bisa hilang?", a: "Tidak. Konten yang sudah dibeli bisa diakses selamanya di Library." },
            { q: "Bagaimana sistem Credit?", a: "1 Credit = Rp 1.000. Top-up via QRIS, gunakan untuk beli konten/donasi/chat, cairkan ke bank kapan saja." },
          ].map(f => (
            <Card key={f.q} hover>
              <CardContent className="p-5">
                <h3 className="font-bold text-sm">{f.q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/register"><Button size="lg" variant="secondary" className="px-10">Mulai Sekarang — Gratis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </main>
    </>
  );
}
