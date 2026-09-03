"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/internationalization";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DecorativeBlobs } from "@/components/landing/decorative-blobs";
import { Check, X, Sparkles, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";
import { formatIDR } from "@/lib/utils";

const allFeatureKeys = [
  "postBerbayar",
  "produkDigital",
  "storage",
  "platformFee",
  "kamuTerima",
  "analytics",
  "customPage",
  "scheduledPosts",
  "prioritySupport",
  "badgeKhusus",
] as const;

const allFeatureTiers: Array<[true | false | string, true | false | string, true | false | string]> = [
  [true, true, true],
  ["Max 3", "Max 20", "Unlimited"],
  ["1 GB", "10 GB", "50 GB"],
  ["20%", "10%", "5%"],
  ["80%", "90%", "95%"],
  ["Basic", "Advanced", "Advanced + Export"],
  [false, true, true],
  [false, true, true],
  [false, false, true],
  [false, "Pro", "Business"],
];

// Static mapping consistent with the fee/take-home figures shown across the app (landing page, cara-kerja).
const takeHomeByTier: Record<string, number> = { Free: 80, Pro: 90, Business: 95 };

export default function PricingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: tiers } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => { const { data } = await api.get("/tiers"); return (data.data || []) as any[]; },
  });

  const allFeatures = allFeatureKeys.map((key, i) => ({
    key: t.pricingPage[key as keyof typeof t.pricingPage] as string,
    tiers: allFeatureTiers[i],
  }));

  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      {/* Hero */}
      <div className="bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
        <DecorativeBlobs />
        <div className="relative text-center py-14 sm:py-20 px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" /> {t.pricingPage.transparentPricing}
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-white tracking-tight text-balance">{t.pricing.title}</h1>
          <p className="text-primary-100 mt-3 text-lg max-w-xl mx-auto">{t.pricingPage.subtitle}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        {/* Cards */}
        <motion.div variants={staggerChildren} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-16">
          {(tiers || []).map((tier: any, i: number) => (
            <motion.div key={tier.id} variants={staggerItem}>
              <Card className={`relative h-full ${i === 1 ? "border-accent ring-2 ring-accent/20 shadow-glow-accent sm:scale-105" : ""}`}>
                {i === 1 && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-navy-900 text-xs font-black px-4 py-1.5 rounded-full shadow-md inline-flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" /> {t.pricingPage.popular}
                  </div>
                )}
                <CardContent className="p-6 sm:p-7 text-center">
                  <h3 className="text-lg font-display font-bold mb-1">{tier.name}</h3>
                  {tier.badge && (
                    <span className="inline-block mb-3 text-xs font-semibold px-2.5 py-0.5 rounded-full border-2 border-primary-200 dark:border-primary-800 text-gray-700 dark:text-gray-300">
                      {tier.badge}
                    </span>
                  )}
                  <div className="my-5">
                    {tier.price_idr === 0 ? (
                      <p className="text-4xl font-display font-black">{t.pricingPage.freePrice}</p>
                    ) : (
                      <>
                        <p className="text-4xl font-display font-black">{formatIDR(tier.price_idr)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t.pricingPage.perMonth}</p>
                      </>
                    )}
                  </div>
                  {takeHomeByTier[tier.name] !== undefined && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 mb-5">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      {t.pricingPage.takeHome.replace("{percent}", String(takeHomeByTier[tier.name]))}
                    </div>
                  )}
                  <div className="text-left space-y-2.5 mb-6">
                    {JSON.parse(tier.features || "[]").map((f: string) => (
                      <div key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {user ? (
                    <Link href="/dashboard/subscription">
                      <Button className="w-full" variant={i === 1 ? "secondary" : "outline"}>
                        {tier.price_idr === 0 ? t.pricingPage.currentPlan : t.pricingPage.upgrade}
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/register">
                      <Button className="w-full" variant={i === 1 ? "secondary" : "outline"}>{t.pricingPage.startNow}</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Comparison table */}
        <h2 className="text-2xl sm:text-3xl font-display font-black text-center mb-8 tracking-tight">{t.pricingPage.featureComparison}</h2>
        <Card className="mb-16 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-navy-800/50">
                  <th scope="col" className="text-left py-4 px-5 font-semibold">{t.pricingPage.feature}</th>
                  <th scope="col" className="text-center py-4 px-5 font-semibold">{t.pricingPage.free}</th>
                  <th scope="col" className="text-center py-4 px-5 font-semibold text-primary">{t.pricingPage.pro}</th>
                  <th scope="col" className="text-center py-4 px-5 font-semibold">{t.pricingPage.business}</th>
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((f, i) => (
                  <tr key={f.key} className={`border-b border-primary-50 dark:border-primary-900/20 ${i % 2 === 0 ? "" : "bg-primary-50/30 dark:bg-navy-800/30"}`}>
                    <td className="py-3.5 px-5 font-medium">{f.key}</td>
                    {f.tiers.map((v, j) => (
                      <td key={j} className="text-center py-3.5 px-5">
                        {v === true ? <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto" aria-label={t.pricingPage.yes} /> :
                         v === false ? <X className="h-5 w-5 text-gray-300 dark:text-gray-600 mx-auto" aria-label={t.pricingPage.no} /> :
                         <span className="font-semibold">{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MotionConfig>
  );
}
