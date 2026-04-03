import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { FileText, Package, Heart, Shield, Zap, CreditCard } from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Halaman kamu, <span className="text-primary">penghasilanmu.</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Platform monetisasi konten untuk kreator Indonesia. Jual konten, produk digital, dan terima donasi — semua dalam satu halaman.
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/register"><Button size="lg" className="w-full sm:w-auto">Mulai Gratis</Button></Link>
          <Link href="/explore"><Button variant="outline" size="lg" className="w-full sm:w-auto">Lihat Kreator</Button></Link>
          <Link href="/pricing"><Button variant="ghost" size="lg" className="w-full sm:w-auto">Lihat Harga</Button></Link>
        </div>
        <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-100">10+</span> Kreator
          <span className="font-semibold text-gray-900 dark:text-gray-100">100+</span> Transaksi
          <span className="font-semibold text-gray-900 dark:text-gray-100">10%</span> Fee saja
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface dark:bg-gray-800/50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Cara Kerja</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Daftar & Buat Halaman", desc: "Buat akun gratis, atur profil dan halaman kreator kamu." },
              { step: "2", title: "Upload Konten", desc: "Publikasikan post, upload produk digital, atur harga." },
              { step: "3", title: "Terima Pembayaran", desc: "Fans beli konten & kirim donasi. Cairkan kapan saja." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">{s.step}</div>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Fitur Lengkap</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={FileText} title="Konten Berbayar" desc="Post gratis atau berbayar. Beli sekali, akses selamanya." />
            <FeatureCard icon={Package} title="Produk Digital" desc="Jual e-book, preset, template dengan download aman." />
            <FeatureCard icon={Heart} title="Donasi & Tip" desc="Terima donasi nominal bebas. Bisa anonim." />
            <FeatureCard icon={CreditCard} title="Pembayaran QRIS" desc="Top-up credit via QRIS. Mudah dan cepat." />
            <FeatureCard icon={Shield} title="Konten Aman" desc="Media private, pre-signed URL, watermark." />
            <FeatureCard icon={Zap} title="Dashboard Lengkap" desc="Analytics, kelola konten, tarik dana — satu tempat." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-surface dark:bg-gray-800/50 py-12 sm:py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Gratis untuk Mulai</h2>
          <Card>
            <CardContent className="p-6 sm:p-8">
              <p className="text-3xl sm:text-4xl font-bold text-primary">10%</p>
              <p className="text-gray-600 mt-2">Platform fee per transaksi</p>
              <ul className="mt-4 text-sm text-left space-y-2 text-gray-600 dark:text-gray-400">
                <li>✅ Daftar gratis, tanpa biaya bulanan</li>
                <li>✅ Upload konten & produk tanpa batas</li>
                <li>✅ Storage 5GB gratis</li>
                <li>✅ Dashboard analytics</li>
                <li>✅ Cairkan dana kapan saja (min Rp 100.000)</li>
              </ul>
              <Link href="/register"><Button className="w-full mt-6" size="lg">Daftar Sekarang</Button></Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 text-center px-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Siap Monetisasi Kontenmu?</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Bergabung dengan kreator Indonesia lainnya di YourPage.</p>
        <Link href="/register"><Button size="lg" className="mt-6">Mulai Sekarang — Gratis</Button></Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-gray-400 space-y-2 px-4">
        <p>© 2026 YourPage. Halaman kamu, penghasilanmu.</p>
        <div className="flex justify-center gap-4">
          <a href="/terms" className="hover:text-gray-600 dark:text-gray-400">Syarat & Ketentuan</a>
          <a href="/privacy" className="hover:text-gray-600 dark:text-gray-400">Kebijakan Privasi</a>
          <a href="/contact" className="hover:text-gray-600 dark:text-gray-400">Kontak</a>
        </div>
      </footer>
    </>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <Icon className="h-8 w-8 text-primary" />
        <h3 className="mt-2 font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
      </CardContent>
    </Card>
  );
}
