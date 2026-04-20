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
import { useTranslation } from "@/lib/use-translation";

export default function Home() {
  const { t } = useTranslation();

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
                {t("home.hero_badge")}
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.1] text-white">
                {t("home.hero_title_line1")}<br />
                {t("home.hero_title_line2")}
                 <span className="text-accent">{t("home.hero_title_line3")}</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
                {t("home.hero_subtitle")}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/register"><Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">{t("home.cta_register")} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link href="/explore"><Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 border-white/30 text-white hover:bg-white/10 hover:border-white/50">{t("home.cta_explore")}</Button></Link>
            </motion.div>
            <p className="mt-5 text-sm text-primary-200/60">{t("home.hero_footer")}</p>
          </div>
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-300/10 rounded-full blur-3xl" />
        </section>

        {/* Social proof — glassmorphism cards */}
        <section className="relative -mt-8 z-10 px-4">
          <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { val: t("home.social_proof_1_credit"), sub: t("home.social_proof_1_credit_sub"), icon: "💰" },
              { val: t("home.social_proof_5_percent"), sub: t("home.social_proof_5_percent_sub"), icon: "⚡" },
              { val: t("home.social_proof_2_minutes"), sub: t("home.social_proof_2_minutes_sub"), icon: "🚀" },
              { val: t("home.social_proof_24_hours"), sub: t("home.social_proof_24_hours_sub"), icon: "🏦" },
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
              <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">{t("home.features_title")} <span className="text-accent">{t("home.features_title_accent")}</span></h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">{t("home.features_subtitle")}</p>
            </div>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureCard icon={FileText} title={t("home.feature_post_berbayar")} desc={t("home.feature_post_berbayar_desc")} color="bg-primary-500" />
              <FeatureCard icon={Package} title={t("home.feature_produk_digital")} desc={t("home.feature_produk_digital_desc")} color="bg-purple-500" />
              <FeatureCard icon={Heart} title={t("home.feature_donasi_goal")} desc={t("home.feature_donasi_goal_desc")} color="bg-pink-500" />
              <FeatureCard icon={MessageCircle} title={t("home.feature_chat_berbayar")} desc={t("home.feature_chat_berbayar_desc")} color="bg-green-500" />
            </motion.div>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <FeatureCard icon={Monitor} title={t("home.feature_obs_overlay")} desc={t("home.feature_obs_overlay_desc")} color="bg-orange-500" />
              <FeatureCard icon={Shield} title={t("home.feature_konten_aman")} desc={t("home.feature_konten_aman_desc")} color="bg-red-500" />
              <FeatureCard icon={TrendingUp} title={t("home.feature_analytics")} desc={t("home.feature_analytics_desc")} color="bg-indigo-500" />
              <FeatureCard icon={Users} title={t("home.feature_custom_page")} desc={t("home.feature_custom_page_desc")} color="bg-teal-500" />
            </motion.div>
          </div>
        </section>

        {/* How it works — timeline style */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-primary-50 to-white dark:from-navy-800/50 dark:to-navy-900">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl sm:text-5xl font-black text-center mb-16 tracking-tight">{t("home.how_it_works_title")}</h2>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-8 sm:gap-12">
              {[
                { step: "1", title: t("home.how_it_works_step1"), desc: t("home.how_it_works_step1_desc"), emoji: "✨" },
                { step: "2", title: t("home.how_it_works_step2"), desc: t("home.how_it_works_step2_desc"), emoji: "📦" },
                { step: "3", title: t("home.how_it_works_step3"), desc: t("home.how_it_works_step3_desc"), emoji: "💸" },
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
            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight">{t("home.credit_title")}</h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">{t("home.credit_subtitle")}</p>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
              <CreditStep icon={<CreditCard className="h-6 w-6" />} label={t("home.credit_topup")} line1={t("home.credit_topup_line1")} line2={t("home.credit_topup_line2")} color="text-blue-500" bg="bg-primary-50 dark:bg-primary-900/20" />
              <CreditStep icon={<ShoppingBag className="h-6 w-6" />} label={t("home.credit_beli")} line1={t("home.credit_beli_line1")} line2={t("home.credit_beli_line2")} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" />
              <CreditStep icon={<Heart className="h-6 w-6" />} label={t("home.credit_donasi")} line1={t("home.credit_donasi_line1")} line2={t("home.credit_donasi_line2")} color="text-pink-500" bg="bg-pink-50 dark:bg-pink-900/20" />
              <CreditStep icon={<Building className="h-6 w-6" />} label={t("home.credit_cairkan")} line1={t("home.credit_cairkan_line1")} line2={t("home.credit_cairkan_line2")} color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" />
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-primary-50 to-white dark:from-navy-800/50 dark:to-navy-900">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl sm:text-5xl font-black text-center tracking-tight">{t("home.pricing_title")}</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-lg">{t("home.pricing_subtitle")}</p>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5 mt-12">
              <PricingCard name={t("home.pricing_free")} price={t("home.pricing_free_price")} sub={t("home.pricing_free_sub")} features={[
                { text: t("home.pricing_feature_post_berbayar"), ok: true }, { text: t("home.pricing_feature_produk_max"), ok: true }, { text: t("home.pricing_feature_storage"), ok: true }, { text: t("home.pricing_feature_fee"), ok: true },
                { text: t("home.pricing_feature_chat"), ok: true }, { text: t("home.pricing_feature_analytics"), ok: true }, { text: t("home.pricing_feature_custom"), ok: false }, { text: t("home.pricing_feature_scheduled"), ok: false },
              ]} cta={t("home.pricing_cta_start")} />
              <PricingCard name={t("home.pricing_pro")} price={t("home.pricing_pro_price")} sub={t("home.pricing_pro_sub")} popular features={[
                { text: t("home.pricing_feature_produk_max_20"), ok: true }, { text: t("home.pricing_feature_storage_10"), ok: true }, { text: t("home.pricing_feature_fee_10"), ok: true }, { text: t("home.pricing_feature_chat_unlimited"), ok: true },
                { text: t("home.pricing_feature_analytics_advanced"), ok: true }, { text: t("home.pricing_feature_custom_warna"), ok: true }, { text: t("home.pricing_feature_scheduled_posts"), ok: true }, { text: t("home.pricing_feature_pro_badge"), ok: true },
              ]} cta={t("home.pricing_cta_upgrade")} />
              <PricingCard name={t("home.pricing_business")} price={t("home.pricing_business_price")} sub={t("home.pricing_business_sub")} features={[
                { text: t("home.pricing_feature_produk_unlimited"), ok: true }, { text: t("home.pricing_feature_storage_50"), ok: true }, { text: t("home.pricing_feature_fee_5"), ok: true }, { text: t("home.pricing_feature_export_csv"), ok: true },
                { text: t("home.pricing_feature_auto_reply"), ok: true }, { text: t("home.pricing_feature_obs_custom"), ok: true }, { text: t("home.pricing_feature_priority"), ok: true }, { text: t("home.pricing_feature_business_badge"), ok: true },
              ]} cta={t("home.pricing_cta_upgrade")} />
            </motion.div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl sm:text-5xl font-black text-center tracking-tight mb-14">{t("home.usecases_title")}</h2>
            <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: <Palette className="h-7 w-7" />, title: t("home.usecase_desainer"), desc: t("home.usecase_desainer_desc"), color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
                { icon: <BookOpen className="h-7 w-7" />, title: t("home.usecase_edukator"), desc: t("home.usecase_edukator_desc"), color: "text-blue-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
                { icon: <Gamepad2 className="h-7 w-7" />, title: t("home.usecase_streamer"), desc: t("home.usecase_streamer_desc"), color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
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
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{t("home.cta_final_title")}</h2>
            <p className="mt-4 text-primary-100 text-lg">{t("home.cta_final_subtitle")}</p>
            <Link href="/register"><Button size="lg" variant="secondary" className="mt-8 text-base px-10">{t("home.cta_final_register")} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-navy-900 dark:bg-navy-950 text-white py-16 px-4">
          <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <p className="text-xl font-black mb-4">
                <span className="text-primary-400">Your</span><span className="text-accent">.</span><span>Page</span>
              </p>
              <p className="text-sm text-gray-400">{t("home.footer_tagline_sub")}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t("home.footer_product")}</p>
              <nav className="space-y-2.5 text-sm text-gray-400">
                <Link href="/pricing" className="block hover:text-accent transition-colors">{t("home.footer_pricing")}</Link>
                <Link href="/cara-kerja" className="block hover:text-accent transition-colors">{t("home.footer_how_it_works")}</Link>
                <Link href="/explore" className="block hover:text-accent transition-colors">{t("home.footer_explore")}</Link>
              </nav>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t("home.footer_legal")}</p>
              <nav className="space-y-2.5 text-sm text-gray-400">
                <Link href="/terms" className="block hover:text-accent transition-colors">{t("home.footer_terms")}</Link>
                <Link href="/privacy" className="block hover:text-accent transition-colors">{t("home.footer_privacy")}</Link>
                <Link href="/contact" className="block hover:text-accent transition-colors">{t("home.footer_contact")}</Link>
              </nav>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t("home.footer_follow")}</p>
              <nav className="space-y-2.5 text-sm text-gray-400">
                <a href="#" className="block hover:text-accent transition-colors">{t("home.footer_instagram")}</a>
                <a href="#" className="block hover:text-accent transition-colors">{t("home.footer_twitter")}</a>
                <a href="#" className="block hover:text-accent transition-colors">{t("home.footer_tiktok")}</a>
              </nav>
            </div>
          </div>
          <div className="mx-auto max-w-4xl mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">{t("home.footer_copyright")}</p>
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
        {popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-navy-900 text-xs font-black px-5 py-1.5 rounded-full shadow-md">🔥</div>}
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