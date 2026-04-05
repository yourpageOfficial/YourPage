import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Check } from "lucide-react";

export default function CaraKerjaPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4">Cara Kerja YourPage</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12">Panduan lengkap untuk kreator dan supporter</p>

        <h2 className="text-2xl font-bold mb-6">🎨 Untuk Kreator</h2>
        <div className="space-y-4 mb-12">
          {[
            { step: "1", title: "Daftar Gratis", desc: "Buat akun dengan email, pilih username. Username akan jadi link halaman kamu: urpage.online/c/username" },
            { step: "2", title: "Atur Profil", desc: "Upload avatar, banner, tulis bio, tambah social media links. Pro/Business bisa custom warna halaman." },
            { step: "3", title: "Buat Konten", desc: "Post gratis atau berbayar (set harga dalam Credit). Upload produk digital (file, link, atau license key)." },
            { step: "4", title: "Set Donasi & Chat", desc: "Atur target donasi dengan progress bar. Set harga chat per pesan (atau gratis). Setup OBS overlay untuk live streaming." },
            { step: "5", title: "Terima Pembayaran", desc: "Fans beli konten, kirim donasi, chat berbayar. Semua masuk ke wallet Credit kamu." },
            { step: "6", title: "Cairkan Dana", desc: "Verifikasi KYC (upload KTP), lalu tarik Credit ke rekening bank. Min 100 Credit = Rp 100.000." },
          ].map(s => (
            <Card key={s.step}><CardContent className="p-4 flex gap-4">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">{s.step}</div>
              <div><h3 className="font-bold">{s.title}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{s.desc}</p></div>
            </CardContent></Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-6">☕ Untuk Supporter</h2>
        <div className="space-y-4 mb-12">
          {[
            { step: "1", title: "Daftar & Top-up", desc: "Buat akun supporter. Top-up Credit via QRIS (1 Credit = Rp 1.000). Admin approve dalam 24 jam." },
            { step: "2", title: "Explore Kreator", desc: "Cari kreator favorit di halaman Explore. Follow untuk lihat konten mereka di Feed." },
            { step: "3", title: "Beli & Dukung", desc: "Beli post/produk berbayar, kirim donasi dengan pesan, atau chat langsung dengan kreator." },
            { step: "4", title: "Akses Selamanya", desc: "Konten yang sudah dibeli bisa diakses selamanya di Library, bahkan jika kreator hapus post." },
          ].map(s => (
            <Card key={s.step}><CardContent className="p-4 flex gap-4">
              <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shrink-0">{s.step}</div>
              <div><h3 className="font-bold">{s.title}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{s.desc}</p></div>
            </CardContent></Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-6">💰 Struktur Fee</h2>
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm">
            <thead><tr className="border-b dark:border-gray-700">
              <th className="text-left py-3 px-4">Tier</th><th className="text-center py-3 px-4">Harga</th><th className="text-center py-3 px-4">Fee</th><th className="text-center py-3 px-4">Kreator Dapat</th>
            </tr></thead>
            <tbody>
              <tr className="border-b dark:border-gray-800"><td className="py-3 px-4">Free</td><td className="text-center">Gratis</td><td className="text-center">20%</td><td className="text-center font-bold text-green-600">80%</td></tr>
              <tr className="border-b dark:border-gray-800"><td className="py-3 px-4">Pro</td><td className="text-center">Rp 49.000/bln</td><td className="text-center">10%</td><td className="text-center font-bold text-green-600">90%</td></tr>
              <tr className="border-b dark:border-gray-800"><td className="py-3 px-4">Business</td><td className="text-center">Rp 149.000/bln</td><td className="text-center">5%</td><td className="text-center font-bold text-green-600">95%</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold mb-6">❓ FAQ</h2>
        <div className="space-y-3 mb-12">
          {[
            { q: "Apakah benar-benar gratis?", a: "Ya! Daftar gratis, tanpa biaya bulanan. Fee hanya dipotong saat ada transaksi." },
            { q: "Berapa lama pencairan dana?", a: "Setelah admin approve, dana ditransfer dalam 1-3 hari kerja ke rekening bank kamu." },
            { q: "Apakah konten yang dibeli bisa hilang?", a: "Tidak. Konten yang sudah dibeli bisa diakses selamanya di Library, bahkan jika kreator menghapus post." },
            { q: "Bagaimana sistem Credit?", a: "1 Credit = Rp 1.000. Top-up via QRIS, gunakan untuk beli konten/donasi/chat, cairkan ke bank kapan saja." },
          ].map(f => (
            <Card key={f.q}><CardContent className="p-4">
              <h3 className="font-bold text-sm">{f.q}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{f.a}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/register"><Button size="lg">Mulai Sekarang — Gratis</Button></Link>
        </div>
      </main>
    </>
  );
}
