import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { FileText, Package, Heart, Shield, Zap, CreditCard, MessageCircle, Monitor, Check, X } from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Halaman kamu, <span className="text-primary">penghasilanmu.</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Platform monetisasi konten untuk kreator Indonesia. Jual konten, produk digital, terima donasi, dan chat dengan fans — semua dalam satu halaman.
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/register"><Button size="lg" className="w-full sm:w-auto">Mulai Gratis</Button></Link>
          <Link href="/explore"><Button variant="outline" size="lg" className="w-full sm:w-auto">Lihat Kreator</Button></Link>
          <Link href="/pricing"><Button variant="ghost" size="lg" className="w-full sm:w-auto">Lihat Harga</Button></Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Cara Kerja</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Daftar & Buat Halaman", desc: "Buat akun gratis, atur profil, banner, dan social links." },
              { step: "2", title: "Upload & Jual Konten", desc: "Post berbayar, produk digital, atur harga dalam Credit." },
              { step: "3", title: "Terima Pembayaran", desc: "Fans beli konten, kirim donasi, chat berbayar. Cairkan kapan saja." },
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={FileText} title="Konten Berbayar" desc="Post gratis atau berbayar. Beli sekali, akses selamanya." />
            <FeatureCard icon={Package} title="Produk Digital" desc="Jual e-book, preset, template, link, atau license key." />
            <FeatureCard icon={Heart} title="Donasi & Goal" desc="Terima donasi dengan target goal dan progress bar." />
            <FeatureCard icon={MessageCircle} title="Chat Berbayar" desc="DM dari fans, gratis atau berbayar per pesan." />
            <FeatureCard icon={Monitor} title="OBS Overlay" desc="Notifikasi donasi saat live streaming dengan GIF custom." />
            <FeatureCard icon={CreditCard} title="Sistem Credit" desc="1 Credit = Rp 1.000. Top-up via QRIS, cairkan ke bank." />
            <FeatureCard icon={Shield} title="Konten Aman" desc="Media private, pre-signed URL, watermark otomatis." />
            <FeatureCard icon={Zap} title="3 Tier Creator" desc="Free, Pro, Business — fee mulai 5%, fitur makin lengkap." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Harga Transparan</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Mulai gratis, upgrade kapan saja</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <PricingCard name="Free" price="Gratis" features={["Post berbayar","Produk max 3","Storage 1 GB","Fee 20%","Analytics basic"]} cta="Mulai Gratis" />
            <PricingCard name="Pro" price="Rp 49.000" popular features={["Produk max 20","Storage 10 GB","Fee 10%","Analytics advanced","Custom page","Scheduled posts","Chat unlimited","Pro badge"]} cta="Upgrade Pro" />
            <PricingCard name="Business" price="Rp 149.000" features={["Produk unlimited","Storage 50 GB","Fee 5%","Export CSV","Auto-reply chat","OBS overlay custom","Priority support","Business badge"]} cta="Upgrade Business" />
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">1 Credit = Rp 1.000 · Bayar tier dengan Credit</p>
        </div>
      </section>

      {/* Credit System */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Sistem Credit</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CreditStep emoji="💳" label="Top-up" desc="Bayar Rp 50.000" result="Dapat 50 Credit" />
            <CreditStep emoji="🛒" label="Beli" desc="Post 5 Credit" result="Potong 5 Credit" />
            <CreditStep emoji="☕" label="Donasi" desc="Kirim 10 Credit" result="Creator dapat 8" />
            <CreditStep emoji="🏦" label="Tarik" desc="100 Credit" result="Dapat Rp 100.000" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 text-center px-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Siap Monetisasi Kontenmu?</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Bergabung dengan kreator Indonesia lainnya.</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/register"><Button size="lg">Daftar Sebagai Kreator</Button></Link>
          <Link href="/register"><Button size="lg" variant="outline">Daftar Sebagai Supporter</Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t dark:border-gray-800 py-8 text-center text-xs text-gray-400 space-y-2 px-4">
        <p>© 2026 YourPage. Halaman kamu, penghasilanmu.</p>
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="hover:text-gray-600">Syarat & Ketentuan</Link>
          <Link href="/privacy" className="hover:text-gray-600">Kebijakan Privasi</Link>
          <Link href="/contact" className="hover:text-gray-600">Kontak</Link>
        </div>
      </footer>
    </>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <Icon className="h-8 w-8 text-primary mb-2" />
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
      </CardContent>
    </Card>
  );
}

function PricingCard({ name, price, features, cta, popular }: { name: string; price: string; features: string[]; cta: string; popular?: boolean }) {
  return (
    <Card className={popular ? "border-primary ring-2 ring-primary/20 relative" : ""}>
      {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full">Populer</div>}
      <CardContent className="p-5 sm:p-6 text-center">
        <h3 className="text-lg font-bold">{name}</h3>
        <p className="text-2xl font-black mt-2">{price}</p>
        {price !== "Gratis" && <p className="text-xs text-gray-500 dark:text-gray-400">per bulan</p>}
        <ul className="mt-4 text-sm text-left space-y-1.5">
          {features.map(f => <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{f}</li>)}
        </ul>
        <Link href="/register"><Button className="w-full mt-5" variant={popular ? "default" : "outline"}>{cta}</Button></Link>
      </CardContent>
    </Card>
  );
}

function CreditStep({ emoji, label, desc, result }: { emoji: string; label: string; desc: string; result: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="text-2xl mb-1">{emoji}</div>
      <p className="font-semibold text-sm">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      <p className="text-xs font-medium text-primary mt-1">{result}</p>
    </div>
  );
}
