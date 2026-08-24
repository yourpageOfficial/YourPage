"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";
import { SectionHeading } from "@/components/landing/section-heading";
import { DecorativeBlobs } from "@/components/landing/decorative-blobs";
import { StatTile } from "@/components/landing/stat-tile";
import { EarningsPreviewCard } from "@/components/landing/earnings-preview-card";
import { FeeTierCard } from "@/components/landing/fee-tier-card";
import Link from "next/link";
import {
  FileText, Package, Heart, Shield, CreditCard, MessageCircle, Monitor, Check, ArrowRight,
  TrendingUp, Users, ShoppingBag, Palette, BookOpen, Gamepad2, Sparkles, Zap, Coins, Percent,
  Clock, UserPlus, PackagePlus, Wallet, Landmark, Flame, type LucideIcon,
} from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";

const stats: { icon: LucideIcon; value: string; label: string; tone: "primary" | "accent" | "secondary" }[] = [
  { icon: Coins, value: "1 Credit", label: "= Rp 1.000", tone: "primary" },
  { icon: Percent, value: "5%", label: "Fee terendah", tone: "accent" },
  { icon: Zap, value: "2 menit", label: "Setup halaman", tone: "secondary" },
  { icon: Clock, value: "24 jam", label: "Cairkan dana", tone: "primary" },
];

const steps = [
  { step: "1", title: "Daftar Gratis", desc: "Buat akun, pilih username, atur profil. Selesai dalam 2 menit.", icon: UserPlus },
  { step: "2", title: "Upload & Atur Harga", desc: "Buat post berbayar, upload produk, set harga dalam Credit.", icon: PackagePlus },
  { step: "3", title: "Terima Uang", desc: "Fans beli, donasi, chat. Credit masuk wallet, cairkan ke rekening.", icon: Wallet },
];

const features = [
  { icon: FileText, title: "Post Berbayar", desc: "Konten eksklusif yang hanya bisa diakses setelah bayar.", color: "bg-primary-500" },
  { icon: Package, title: "Produk Digital", desc: "Jual e-book, preset, template, course link, license key.", color: "bg-purple-500" },
  { icon: Heart, title: "Donasi + Goal", desc: "Fans kirim donasi dengan pesan. Set target goal.", color: "bg-pink-500" },
  { icon: MessageCircle, title: "Chat Berbayar", desc: "DM dari fans, gratis atau berbayar per pesan.", color: "bg-green-500" },
  { icon: Monitor, title: "OBS Overlay", desc: "Notifikasi donasi saat live streaming.", color: "bg-orange-500" },
  { icon: Shield, title: "Konten Aman", desc: "Media private, watermark, blur saat tab switch.", color: "bg-red-500" },
  { icon: TrendingUp, title: "Analytics", desc: "Dashboard lengkap — penjualan, donasi, chart.", color: "bg-indigo-500" },
  { icon: Users, title: "Custom Page", desc: "Warna aksen, banner, social links — branding kamu.", color: "bg-teal-500" },
];
// lg-only spans so the bento grid stays a clean single/double column below 1024px (no implicit grid tracks).
const wideFeatureIndexes = new Set([0, 4, 6, 7]);

const feeTiers = [
  { tier: "Free", takeHomePercent: 80, feePercent: 20 },
  { tier: "Pro", takeHomePercent: 90, feePercent: 10, highlight: true },
  { tier: "Business", takeHomePercent: 95, feePercent: 5 },
];

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      <PageTransition>
        {/* Hero — asymmetric two-column: value prop + concrete earnings mockup */}
        <section className="relative overflow-hidden bg-gradient-hero dark:bg-gradient-hero-dark">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <DecorativeBlobs />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
              {/* Text column */}
              <div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-5 py-2 rounded-full mb-8 border border-white/20">
                    <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                    Platform #1 untuk Kreator Indonesia
                  </div>
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.05] text-white text-balance">
                    Ubah Kontenmu Jadi <span className="text-accent">Penghasilan</span>
                  </h1>
                  <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-xl leading-relaxed">
                    Jual konten eksklusif, terima donasi, chat berbayar — tanpa ribet. Mulai dalam 2 menit, gratis selamanya.
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="mt-10 flex flex-col sm:flex-row gap-3">
                  <Link href="/register">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">
                      Mulai Gratis Sekarang <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button size="lg" variant="ghost" className="w-full sm:w-auto text-base px-8 border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 hover:text-white">
                      Lihat Kreator
                    </Button>
                  </Link>
                </motion.div>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-100/80">
                  {["Tanpa kartu kredit", "Tanpa biaya bulanan", "Langsung jualan"].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Earnings mockup column — shows concrete earning potential up front */}
              <div className="lg:pl-4">
                <EarningsPreviewCard />
              </div>
            </div>
          </div>
        </section>

        {/* Stat strip — overlaps hero */}
        <section className="relative -mt-8 z-10 px-4 sm:px-6">
          <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <motion.div key={s.value} variants={staggerItem}>
                <StatTile icon={s.icon} value={s.value} label={s.label} tone={s.tone} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How it works */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHeading eyebrowIcon={Zap} eyebrow="Gampang Banget" title={<>Mulai dalam <span className="text-accent">3 Langkah</span></>} />
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-8 sm:gap-6">
              {steps.map((s, i) => (
                <motion.div key={s.step} variants={staggerItem} className={`text-center relative ${i === 1 ? "sm:-translate-y-5" : ""}`}>
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary/20">
                    <s.icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-xs font-black text-accent tracking-widest">LANGKAH {s.step}</div>
                  <h3 className="mt-1.5 text-xl font-display font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features — asymmetric bento grid */}
        <section className="py-20 sm:py-28 bg-mesh-pattern">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHeading
              eyebrowIcon={Sparkles}
              eyebrow="Semua Ada di Sini"
              title={<>Berhenti Kasih Konten <span className="text-accent">Gratis</span></>}
              subtitle="Kamu sudah buat konten bagus. Saatnya dihargai."
            />
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <FeatureCard key={f.title} {...f} wide={wideFeatureIndexes.has(i)} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Earnings & fee transparency — dedicated bold block, never hides what creators earn */}
        <section className="relative overflow-hidden bg-gradient-hero dark:bg-gradient-hero-dark py-20 sm:py-28">
          <DecorativeBlobs variant="violet" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHeading
              tone="inverted"
              eyebrowIcon={Percent}
              eyebrow="Transparan 100%"
              title={<>Fee Rendah. <span className="text-accent">Sisanya Buat Kamu.</span></>}
              subtitle="Nggak ada biaya tersembunyi. Kamu selalu tahu persis berapa yang kamu bawa pulang dari tiap transaksi."
            />
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5">
              {feeTiers.map((t) => (
                <motion.div key={t.tier} variants={staggerItem}>
                  <FeeTierCard {...t} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Credit System */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-primary-50 to-white dark:from-navy-800/50 dark:to-navy-900">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <SectionHeading eyebrowIcon={Coins} eyebrow="Satu Mata Uang" title={<>Sistem Credit yang <span className="text-primary">Simpel</span></>} subtitle="Satu mata uang untuk semua transaksi di YourPage." />
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <CreditStep icon={<CreditCard className="h-6 w-6" aria-hidden="true" />} label="Top-up" line1="Bayar Rp 50.000" line2="→ Dapat 50 Credit" color="text-primary" bg="bg-primary-50 dark:bg-primary-900/20" />
              <CreditStep icon={<ShoppingBag className="h-6 w-6" aria-hidden="true" />} label="Beli Konten" line1="Post 5 Credit" line2="→ Potong dari wallet" color="text-secondary" bg="bg-secondary-50 dark:bg-secondary-500/15" />
              <CreditStep icon={<Heart className="h-6 w-6" aria-hidden="true" />} label="Donasi" line1="Kirim 10 Credit" line2="→ Creator dapat 8-9.5" color="text-primary" bg="bg-primary-50 dark:bg-primary-900/20" />
              <CreditStep icon={<Landmark className="h-6 w-6" aria-hidden="true" />} label="Cairkan" line1="Tarik 100 Credit" line2="→ Rp 100.000 ke bank" color="text-accent-600 dark:text-accent-400" bg="bg-accent-50 dark:bg-accent-500/15" />
            </motion.div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading eyebrowIcon={Wallet} eyebrow="Harga" title={<>Pilih Paket yang <span className="text-accent">Tepat</span></>} subtitle="Mulai gratis, upgrade kapan saja." />
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5">
              <PricingCard
                name="Free"
                price="Gratis"
                sub="selamanya"
                features={[
                  { text: "Post berbayar", ok: true }, { text: "Produk max 3", ok: true }, { text: "Storage 1 GB", ok: true }, { text: "Fee 20%", ok: true },
                  { text: "Chat 10 reply/hari", ok: true }, { text: "Analytics basic", ok: true }, { text: "Custom page", ok: false }, { text: "Scheduled posts", ok: false },
                ]}
                cta="Mulai Gratis"
              />
              <PricingCard
                name="Pro"
                price="Rp 49.000"
                sub="/bulan (49 Credit)"
                popular
                features={[
                  { text: "Produk max 20", ok: true }, { text: "Storage 10 GB", ok: true }, { text: "Fee 10%", ok: true }, { text: "Chat unlimited", ok: true },
                  { text: "Analytics advanced", ok: true }, { text: "Custom page & warna", ok: true }, { text: "Scheduled posts", ok: true }, { text: "Badge Pro eksklusif", ok: true },
                ]}
                cta="Upgrade Pro"
              />
              <PricingCard
                name="Business"
                price="Rp 149.000"
                sub="/bulan (149 Credit)"
                features={[
                  { text: "Produk unlimited", ok: true }, { text: "Storage 50 GB", ok: true }, { text: "Fee 5%", ok: true }, { text: "Export CSV", ok: true },
                  { text: "Auto-reply chat", ok: true }, { text: "OBS overlay custom", ok: true }, { text: "Priority support", ok: true }, { text: "Badge Business eksklusif", ok: true },
                ]}
                cta="Upgrade Business"
              />
            </motion.div>
            <p className="text-center mt-8">
              <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
                Lihat perbandingan lengkap semua fitur <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-20 sm:py-28 bg-primary-50/40 dark:bg-navy-800/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading eyebrowIcon={Users} eyebrow="Buat Siapa Aja" title={<>Cocok untuk <span className="text-primary">Semua Kreator</span></>} />
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: <Palette className="h-7 w-7" aria-hidden="true" />, title: "Desainer & Seniman", desc: "Jual preset, template, wallpaper. Upload file, fans download setelah bayar.", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20" },
                { icon: <BookOpen className="h-7 w-7" aria-hidden="true" />, title: "Edukator & Writer", desc: "Konten eksklusif, e-book, tips berbayar. Bangun komunitas.", color: "text-blue-600 dark:text-blue-400", bg: "bg-primary-50 dark:bg-primary-900/20" },
                { icon: <Gamepad2 className="h-7 w-7" aria-hidden="true" />, title: "Streamer & Gamer", desc: "Terima donasi saat live, overlay OBS custom, chat dengan fans.", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
              ].map((u) => (
                <motion.div key={u.title} variants={staggerItem}>
                  <Card hover className="h-full">
                    <CardContent className="p-6">
                      <div className={`h-14 w-14 rounded-2xl ${u.bg} ${u.color} flex items-center justify-center mb-4`}>{u.icon}</div>
                      <h3 className="font-display font-bold text-lg">{u.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{u.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-gradient-hero dark:bg-gradient-hero-dark py-20 sm:py-28 text-center px-4">
          <DecorativeBlobs />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">Siap Menghasilkan dari Kontenmu?</h2>
            <p className="mt-4 text-primary-100 text-lg">Gratis selamanya. Upgrade kapan saja. Cairkan kapan saja.</p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="mt-8 text-base px-10">
                Daftar Sekarang — Gratis <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-navy-900 dark:bg-navy-950 text-white py-16 px-4">
          <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <p className="text-xl font-display font-black mb-4">
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
    </MotionConfig>
  );
}

function FeatureCard({ icon: Icon, title, desc, color, wide }: { icon: LucideIcon; title: string; desc: string; color: string; wide?: boolean }) {
  return (
    <motion.div variants={staggerItem} className={wide ? "lg:col-span-2" : undefined}>
      <Card hover className="h-full group">
        <CardContent className={wide ? "p-6 sm:p-7" : "p-5"}>
          <div className={`${wide ? "h-12 w-12" : "h-10 w-10"} rounded-xl ${color} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
            <Icon className={wide ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
          </div>
          <h3 className={`font-bold ${wide ? "text-lg" : ""}`}>{title}</h3>
          <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PricingCard({ name, price, sub, features, cta, popular }: { name: string; price: string; sub: string; features: { text: string; ok: boolean }[]; cta: string; popular?: boolean }) {
  return (
    <motion.div variants={staggerItem}>
      <Card className={`h-full ${popular ? "border-accent ring-2 ring-accent/20 relative sm:scale-105 shadow-glow-accent" : ""}`}>
        {popular && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-navy-900 text-xs font-black px-4 py-1.5 rounded-full shadow-md inline-flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5" aria-hidden="true" /> Paling Populer
          </div>
        )}
        <CardContent className="p-6 sm:p-7">
          <h3 className="text-lg font-display font-bold text-center">{name}</h3>
          <p className="text-4xl font-display font-black text-center mt-3">{price}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">{sub}</p>
          <ul className="mt-6 space-y-2.5">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                {f.ok ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" /> : <span className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 text-center" aria-hidden="true">—</span>}
                <span className={f.ok ? "" : "text-gray-400 dark:text-gray-500"}>{f.text}</span>
              </li>
            ))}
          </ul>
          <Link href="/register">
            <Button className="w-full mt-6" variant={popular ? "secondary" : "outline"}>{cta}</Button>
          </Link>
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
          <p className="font-display font-bold">{label}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">{line1}</p>
          <p className="text-xs font-bold text-primary mt-0.5">{line2}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
