import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { FileText, Package, Heart, Shield, Zap, CreditCard, MessageCircle, Monitor, Check, ArrowRight, Star, TrendingUp, Users } from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero — emotional, benefit-focused */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
        <div className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🇮🇩 Platform #1 untuk Kreator Indonesia
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          Ubah Kontenmu Jadi<br /><span className="text-primary">Penghasilan Nyata</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Jual konten eksklusif, terima donasi, chat berbayar dengan fans — tanpa ribet. Mulai dalam 2 menit, gratis selamanya.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/register"><Button size="lg" className="w-full sm:w-auto text-base px-8 py-6">Mulai Gratis Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          <Link href="/explore"><Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6">Lihat Kreator</Button></Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">Tanpa kartu kredit · Tanpa biaya bulanan · Langsung jualan</p>
      </section>

      {/* Social proof */}
      <section className="border-y dark:border-gray-800 py-8">
        <div className="mx-auto max-w-4xl px-4 flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
          <div><p className="text-3xl font-black text-primary">1 Credit</p><p className="text-sm text-gray-500">= Rp 1.000</p></div>
          <div><p className="text-3xl font-black">5%</p><p className="text-sm text-gray-500">Fee terendah</p></div>
          <div><p className="text-3xl font-black">2 menit</p><p className="text-sm text-gray-500">Setup halaman</p></div>
          <div><p className="text-3xl font-black">24 jam</p><p className="text-sm text-gray-500">Cairkan dana</p></div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-4">Berhenti Kasih Konten Gratis</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">Kamu sudah buat konten bagus. Saatnya dihargai. YourPage kasih kamu semua tools untuk monetisasi.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={FileText} title="Post Berbayar" desc="Konten eksklusif yang hanya bisa diakses setelah bayar. Sekali beli, akses selamanya." />
            <FeatureCard icon={Package} title="Produk Digital" desc="Jual e-book, preset, template, course link, license key — file atau link." />
            <FeatureCard icon={Heart} title="Donasi + Goal" desc="Fans kirim donasi dengan pesan. Set target goal dengan progress bar." />
            <FeatureCard icon={MessageCircle} title="Chat Berbayar" desc="DM dari fans, gratis atau berbayar per pesan. Auto-reply untuk Business." />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <FeatureCard icon={Monitor} title="OBS Overlay" desc="Notifikasi donasi saat live streaming. Custom GIF per tier donasi." />
            <FeatureCard icon={Shield} title="Konten Aman" desc="Media private, watermark otomatis, blur saat tab switch." />
            <FeatureCard icon={TrendingUp} title="Analytics" desc="Dashboard lengkap — penjualan, donasi, followers, chart." />
            <FeatureCard icon={Users} title="Custom Page" desc="Warna aksen, banner, social links — branding kamu sendiri." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-12">Mulai dalam 3 Langkah</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Daftar Gratis", desc: "Buat akun, pilih username, atur profil. Selesai dalam 2 menit.", color: "bg-blue-500" },
              { step: "2", title: "Upload & Atur Harga", desc: "Buat post berbayar, upload produk, set harga dalam Credit.", color: "bg-purple-500" },
              { step: "3", title: "Terima Uang", desc: "Fans beli, donasi, chat. Credit masuk wallet, cairkan ke rekening.", color: "bg-green-500" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className={`mx-auto h-14 w-14 rounded-2xl ${s.color} text-white flex items-center justify-center text-2xl font-black`}>{s.step}</div>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit System — visual */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3">Sistem Credit yang Simpel</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Satu mata uang untuk semua transaksi</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CreditStep emoji="💳" label="Top-up" line1="Bayar Rp 50.000" line2="→ Dapat 50 Credit" />
            <CreditStep emoji="🛒" label="Beli Konten" line1="Post 5 Credit" line2="→ Potong dari wallet" />
            <CreditStep emoji="☕" label="Donasi" line1="Kirim 10 Credit" line2="→ Creator dapat 8-9.5" />
            <CreditStep emoji="🏦" label="Cairkan" line1="Tarik 100 Credit" line2="→ Rp 100.000 ke bank" />
          </div>
        </div>
      </section>

      {/* Pricing — comparison */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-3">Pilih Paket yang Tepat</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Mulai gratis, upgrade kapan saja dengan Credit</p>
          <div className="grid sm:grid-cols-3 gap-5">
            <PricingCard name="Free" price="Gratis" sub="selamanya" features={[
              { text: "Post berbayar", ok: true },
              { text: "Produk max 3", ok: true },
              { text: "Storage 1 GB", ok: true },
              { text: "Fee 20%", ok: true },
              { text: "Chat 10 reply/hari", ok: true },
              { text: "Analytics basic", ok: true },
              { text: "Custom page", ok: false },
              { text: "Scheduled posts", ok: false },
            ]} cta="Mulai Gratis" />
            <PricingCard name="Pro" price="Rp 49.000" sub="/bulan (49 Credit)" popular features={[
              { text: "Produk max 20", ok: true },
              { text: "Storage 10 GB", ok: true },
              { text: "Fee 10%", ok: true },
              { text: "Chat unlimited", ok: true },
              { text: "Analytics advanced", ok: true },
              { text: "Custom page & warna", ok: true },
              { text: "Scheduled posts", ok: true },
              { text: "Pro badge 💙", ok: true },
            ]} cta="Upgrade Pro" />
            <PricingCard name="Business" price="Rp 149.000" sub="/bulan (149 Credit)" features={[
              { text: "Produk unlimited", ok: true },
              { text: "Storage 50 GB", ok: true },
              { text: "Fee 5%", ok: true },
              { text: "Export CSV", ok: true },
              { text: "Auto-reply chat", ok: true },
              { text: "OBS overlay custom", ok: true },
              { text: "Priority support", ok: true },
              { text: "Business badge 💜", ok: true },
            ]} cta="Upgrade Business" />
          </div>
        </div>
      </section>

      {/* Testimonial / Use cases */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-10">Cocok untuk Semua Kreator</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: "🎨", title: "Desainer & Seniman", desc: "Jual preset, template, wallpaper. Upload file, fans download setelah bayar." },
              { emoji: "📚", title: "Edukator & Writer", desc: "Konten eksklusif, e-book, tips berbayar. Bangun komunitas yang menghargai ilmu kamu." },
              { emoji: "🎮", title: "Streamer & Gamer", desc: "Terima donasi saat live, overlay OBS custom, chat dengan fans." },
            ].map(u => (
              <Card key={u.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="text-3xl mb-3">{u.emoji}</div>
                  <h3 className="font-bold">{u.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{u.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-16 sm:py-20 text-center px-4">
        <h2 className="text-2xl sm:text-4xl font-bold text-white">Siap Menghasilkan dari Kontenmu?</h2>
        <p className="mt-3 text-primary-100 text-lg">Gratis selamanya. Upgrade kapan saja. Cairkan kapan saja.</p>
        <Link href="/register"><Button size="lg" variant="secondary" className="mt-8 text-base px-8 py-6">Daftar Sekarang — Gratis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </section>

      {/* Footer */}
      <footer className="border-t dark:border-gray-800 py-8 px-4">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm font-bold text-primary">YourPage</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-gray-600">Syarat & Ketentuan</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privasi</Link>
            <Link href="/contact" className="hover:text-gray-600">Kontak</Link>
            <Link href="/pricing" className="hover:text-gray-600">Harga</Link>
          </div>
          <p className="text-xs text-gray-400">© 2026 YourPage</p>
        </div>
      </footer>
    </>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="hover:shadow-md hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <Icon className="h-7 w-7 text-primary mb-2" />
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function PricingCard({ name, price, sub, features, cta, popular }: { name: string; price: string; sub: string; features: { text: string; ok: boolean }[]; cta: string; popular?: boolean }) {
  return (
    <Card className={`${popular ? "border-primary ring-2 ring-primary/20 relative scale-105" : ""}`}>
      {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">Paling Populer</div>}
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-lg font-bold text-center">{name}</h3>
        <p className="text-3xl font-black text-center mt-2">{price}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{sub}</p>
        <ul className="mt-5 space-y-2">
          {features.map(f => (
            <li key={f.text} className="flex items-center gap-2 text-sm">
              {f.ok ? <Check className="h-4 w-4 text-green-500 shrink-0" /> : <span className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0">—</span>}
              <span className={f.ok ? "" : "text-gray-400"}>{f.text}</span>
            </li>
          ))}
        </ul>
        <Link href="/register"><Button className="w-full mt-5" variant={popular ? "default" : "outline"}>{cta}</Button></Link>
      </CardContent>
    </Card>
  );
}

function CreditStep({ emoji, label, line1, line2 }: { emoji: string; label: string; line1: string; line2: string }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700 text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <p className="font-bold text-sm">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{line1}</p>
      <p className="text-xs font-medium text-primary">{line2}</p>
    </div>
  );
}
