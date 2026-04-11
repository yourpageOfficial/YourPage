"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";
import Link from "next/link";
import { FileText, Package, Heart, Shield, CreditCard, MessageCircle, Monitor, Check, ArrowRight, TrendingUp, Users, ShoppingBag, Building, Palette, BookOpen, Gamepad2, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { staggerChildren, staggerItem, scaleIn } from "@/lib/motion-variants";

export default function Home() {
  return (
    <>
      <Navbar />
      <PageTransition>
        {/* Hero — gradient blue */}
        <section className="relative overflow-hidden bg-gradient-hero dark:bg-gradient-hero-dark">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative mx-auto max-w-5xl px-4 py-20 sm:py-32 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-5 py-2 rounded-full mb-8 border border-white/20">
                <Sparkles className="h-4 w-4 text-accent" />
                Platform #1 untuk Kreator Indonesia
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.1] text-white">
                Ubah Kontenmu<br />
                Jadi <span className="text-accent">Penghasilan</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
                Jual konten eksklusif, terima donasi, chat berbayar — tanpa ribet. Mulai dalam 2 menit, gratis selamanya.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/register"><Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">Mulai Gratis Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link href="/explore"><Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 border-white/30 text-white hover:bg-white/10 hover:border-white/50">Lihat Kreator</Button></Link>
            </motion.div>
            <p className="mt-5 text-sm text-primary-200/60">Tanpa kartu kredit · Tanpa biaya bulanan · Langsung jualan</p>
          </div>
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-300/10 rounded-full blur-3xl" />
        </section>

        {/* Social proof — glassmorphism cards */}
        <section className="relative -mt-8 z-10 px-4">
          <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { val: "1 Credit", sub: "= Rp 1.000", icon: "💰" },
              { val: "5%", sub: "Fee terendah", icon: "⚡" },
              { val: "2 menit", sub: "Setup halaman", icon: "🚀" },
              { val: "24 jam", sub: "Cairkan dana", icon: "🏦" },
            ].map(s => (
              <motion.div key={s.val} variants={staggerItem}>
                <Card className="text-center bg-white/90 dark:bg-navy-800/90 backdrop-blur-lg border-primary-100/50 dark:border-primary-900/20">
                  <CardContent className="p-4 sm:p-5">
                    <span className="text-2xl">{s.icon}</span>
                    <p className="text-2xl sm:text-3xl font-black text-primary mt-1">{s.val}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features — bento grid */}
        <section className="py-20 sm:py-28 bg-mesh-pattern">
          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">Berhenti Kasih Konten <span className="text-accent">Gratis</span></h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">Kamu sudah buat konten bagus. Saatnya dihargai.</p>
            </div>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureCard icon={FileText} title="Post Berbayar" desc="Konten eksklusif yang hanya bisa diakses setelah bayar." color="bg-primary-500" />
              <FeatureCard icon={Package} title="Produk Digital" desc="Jual e-book, preset, template, course link, license key." color="bg-purple-500" />
              <FeatureCard icon={Heart} title="Donasi + Goal" desc="Fans kirim donasi dengan pesan. Set target goal." color="bg-pink-500" />
              <FeatureCard icon={MessageCircle} title="Chat Berbayar" desc="DM dari fans, gratis atau berbayar per pesan." color="bg-green-500" />
            </motion.div>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <FeatureCard icon={Monitor} title="OBS Overlay" desc="Notifikasi donasi saat live streaming." color="bg-orange-500" />
              <FeatureCard icon={Shield} title="Konten Aman" desc="Media private, watermark, blur saat tab switch." color="bg-red-500" />
              <FeatureCard icon={TrendingUp} title="Analytics" desc="Dashboard lengkap — penjualan, donasi, chart." color="bg-indigo-500" />
              <FeatureCard icon={Users} title="Custom Page" desc="Warna aksen, banner, social links — branding kamu." color="bg-teal-500" />
            </motion.div>
          </div>
        </section>

        {/* How it works — timeline style */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-primary-50 to-white dark:from-navy-800/50 dark:to-navy-900">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl sm:text-5xl font-black text-center mb-16 tracking-tight">Mulai dalam <span className="text-accent">3 Langkah</span></h2>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-8 sm:gap-12">
              {[
                { step: "1", title: "Daftar Gratis", desc: "Buat akun, pilih username, atur profil. Selesai dalam 2 menit.", emoji: "✨" },
                { step: "2", title: "Upload & Atur Harga", desc: "Buat post berbayar, upload produk, set harga dalam Credit.", emoji: "📦" },
                { step: "3", title: "Terima Uang", desc: "Fans beli, donasi, chat. Credit masuk wallet, cairkan ke rekening.", emoji: "💸" },
              ].map((s) => (
                <motion.div key={s.step} variants={staggerItem} className="text-center relative">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20">{s.emoji}</div>
                  <div className="mt-1 text-xs font-bold text-accent">STEP {s.step}</div>
                  <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Credit System */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">Sistem Credit yang <span className="text-primary">Simpel</span></h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Satu mata uang untuk semua transaksi</p>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
              <CreditStep icon={<CreditCard className="h-6 w-6" />} label="Top-up" line1="Bayar Rp 50.000" line2="→ Dapat 50 Credit" color="text-blue-500" bg="bg-primary-50 dark:bg-primary-900/20" />
              <CreditStep icon={<ShoppingBag className="h-6 w-6" />} label="Beli Konten" line1="Post 5 Credit" line2="→ Potong dari wallet" color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" />
              <CreditStep icon={<Heart className="h-6 w-6" />} label="Donasi" line1="Kirim 10 Credit" line2="→ Creator dapat 8-9.5" color="text-pink-500" bg="bg-pink-50 dark:bg-pink-900/20" />
              <CreditStep icon={<Building className="h-6 w-6" />} label="Cairkan" line1="Tarik 100 Credit" line2="→ Rp 100.000 ke bank" color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" />
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-primary-50 to-white dark:from-navy-800/50 dark:to-navy-900">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl sm:text-5xl font-black text-center tracking-tight">Pilih Paket yang <span className="text-accent">Tepat</span></h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-lg">Mulai gratis, upgrade kapan saja</p>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5 mt-12">
              <PricingCard name="Free" price="Gratis" sub="selamanya" features={[
                { text: "Post berbayar", ok: true }, { text: "Produk max 3", ok: true }, { text: "Storage 1 GB", ok: true }, { text: "Fee 20%", ok: true },
                { text: "Chat 10 reply/hari", ok: true }, { text: "Analytics basic", ok: true }, { text: "Custom page", ok: false }, { text: "Scheduled posts", ok: false },
              ]} cta="Mulai Gratis" />
              <PricingCard name="Pro" price="Rp 49.000" sub="/bulan (49 Credit)" popular features={[
                { text: "Produk max 20", ok: true }, { text: "Storage 10 GB", ok: true }, { text: "Fee 10%", ok: true }, { text: "Chat unlimited", ok: true },
                { text: "Analytics advanced", ok: true }, { text: "Custom page & warna", ok: true }, { text: "Scheduled posts", ok: true }, { text: "Pro badge 💙", ok: true },
              ]} cta="Upgrade Pro" />
              <PricingCard name="Business" price="Rp 149.000" sub="/bulan (149 Credit)" features={[
                { text: "Produk unlimited", ok: true }, { text: "Storage 50 GB", ok: true }, { text: "Fee 5%", ok: true }, { text: "Export CSV", ok: true },
                { text: "Auto-reply chat", ok: true }, { text: "OBS overlay custom", ok: true }, { text: "Priority support", ok: true }, { text: "Business badge 💜", ok: true },
              ]} cta="Upgrade Business" />
            </motion.div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl sm:text-5xl font-black text-center tracking-tight mb-14">Cocok untuk <span className="text-primary">Semua Kreator</span></h2>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: <Palette className="h-7 w-7" />, title: "Desainer & Seniman", desc: "Jual preset, template, wallpaper. Upload file, fans download setelah bayar.", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
                { icon: <BookOpen className="h-7 w-7" />, title: "Edukator & Writer", desc: "Konten eksklusif, e-book, tips berbayar. Bangun komunitas.", color: "text-blue-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
                { icon: <Gamepad2 className="h-7 w-7" />, title: "Streamer & Gamer", desc: "Terima donasi saat live, overlay OBS custom, chat dengan fans.", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
              ].map(u => (
                <motion.div key={u.title} variants={staggerItem}>
                  <Card hover className="h-full">
                    <CardContent className="p-6">
                      <div className={`h-14 w-14 rounded-2xl ${u.bg} ${u.color} flex items-center justify-center mb-4`}>{u.icon}</div>
                      <h3 className="font-bold text-lg">{u.title}</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{u.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-gradient-hero dark:bg-gradient-hero-dark py-20 sm:py-28 text-center px-4">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Siap Menghasilkan dari Kontenmu?</h2>
            <p className="mt-4 text-primary-100 text-lg">Gratis selamanya. Upgrade kapan saja. Cairkan kapan saja.</p>
            <Link href="/register"><Button size="lg" variant="secondary" className="mt-8 text-base px-10">Daftar Sekarang — Gratis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-navy-900 dark:bg-navy-950 text-white py-16 px-4">
          <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <p className="text-xl font-black mb-4">
                <span className="text-primary-400">Your</span><span className="text-accent">.</span><span>Page</span>
              </p>
              <p className="text-sm text-gray-400">Platform monetisasi konten untuk kreator Indonesia.</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Produk</p>
              <nav className="space-y-2.5 text-sm text-gray-400">
                <Link href="/pricing" className="block hover:text-accent transition-colors">Harga</Link>
                <Link href="/cara-kerja" className="block hover:text-accent transition-colors">Cara Kerja</Link>
                <Link href="/explore" className="block hover:text-accent transition-colors">Explore Kreator</Link>
              </nav>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Legal</p>
              <nav className="space-y-2.5 text-sm text-gray-400">
                <Link href="/terms" className="block hover:text-accent transition-colors">Syarat & Ketentuan</Link>
                <Link href="/privacy" className="block hover:text-accent transition-colors">Kebijakan Privasi</Link>
                <Link href="/contact" className="block hover:text-accent transition-colors">Kontak</Link>
              </nav>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Ikuti Kami</p>
              <nav className="space-y-2.5 text-sm text-gray-400">
                <a href="#" className="block hover:text-accent transition-colors">Instagram</a>
                <a href="#" className="block hover:text-accent transition-colors">Twitter/X</a>
                <a href="#" className="block hover:text-accent transition-colors">TikTok</a>
              </nav>
            </div>
          </div>
          <div className="mx-auto max-w-4xl mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">© 2026 YourPage. Semua hak dilindungi.</p>
          </div>
        </footer>
      </PageTransition>
      <ScrollToTop />
    </>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <motion.div variants={staggerItem}>
      <Card hover className="h-full group">
        <CardContent className="p-5">
          <div className={`h-10 w-10 rounded-xl ${color} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PricingCard({ name, price, sub, features, cta, popular }: { name: string; price: string; sub: string; features: { text: string; ok: boolean }[]; cta: string; popular?: boolean }) {
  return (
    <motion.div variants={staggerItem}>
      <Card className={`h-full ${popular ? "border-accent ring-2 ring-accent/20 relative sm:scale-105 shadow-glow-accent" : ""}`}>
        {popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-navy-900 text-xs font-black px-5 py-1.5 rounded-full shadow-md">🔥 Paling Populer</div>}
        <CardContent className="p-6 sm:p-7">
          <h3 className="text-lg font-bold text-center">{name}</h3>
          <p className="text-4xl font-black text-center mt-3">{price}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">{sub}</p>
          <ul className="mt-6 space-y-2.5">
            {features.map(f => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                {f.ok ? <Check className="h-4 w-4 text-green-500 shrink-0" /> : <span className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 text-center">—</span>}
                <span className={f.ok ? "" : "text-gray-400"}>{f.text}</span>
              </li>
            ))}
          </ul>
          <Link href="/register"><Button className="w-full mt-6" variant={popular ? "secondary" : "outline"}>{cta}</Button></Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreditStep({ icon, label, line1, line2, color, bg }: { icon: React.ReactNode; label: string; line1: string; line2: string; color: string; bg: string }) {
  return (
    <motion.div variants={staggerItem}>
      <Card hover className="text-center h-full">
        <CardContent className="p-5">
          <div className={`mx-auto h-14 w-14 rounded-2xl ${bg} ${color} flex items-center justify-center mb-3`}>{icon}</div>
          <p className="font-bold">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{line1}</p>
          <p className="text-xs font-bold text-primary mt-0.5">{line2}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
