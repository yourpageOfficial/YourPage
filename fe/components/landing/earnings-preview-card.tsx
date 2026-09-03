"use client";

import { motion } from "framer-motion";
import { TrendingUp, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

// Static illustrative bar heights (%) — purely decorative sparkline, not real data.
const bars = [38, 52, 44, 68, 58, 82, 100];

/**
 * Hero "dashboard mockup" — makes creator earnings concrete and visible above the fold,
 * per the design system's explicit anti-pattern: never hide creator earnings.
 * Clearly labeled as an illustration so it never reads as a real user's data.
 */
export function EarningsPreviewCard() {
  const { t } = useTranslation();
  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative rounded-3xl bg-white dark:bg-navy-800 border-4 border-navy-900 dark:border-white/10 shadow-elevated p-5 sm:p-6 -rotate-2"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.compLanding.dashboardTitle}</span>
          </div>
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.compLanding.monthlyEarnings}</p>
        <p className="text-3xl sm:text-4xl font-display font-black tracking-tight mt-1">Rp12.450.000</p>
        <div className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2.5 py-1">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
          {t.compLanding.growthLabel}
        </div>

        <div className="flex items-end gap-1.5 h-16 mt-5" role="img" aria-label={t.compLanding.chartAriaLabel}>
          {bars.map((h, i) => (
            <div key={i} className={`flex-1 rounded-t-md ${i === bars.length - 1 ? "bg-accent" : "bg-primary-200 dark:bg-primary-800"}`} style={{ height: `${h}%` }} />
          ))}
        </div>

        <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500 text-center italic">{t.compLanding.illustrationNote}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="absolute -left-2 sm:-left-6 lg:-left-8 top-6 rotate-[-6deg] bg-white dark:bg-navy-800 border-2 border-primary-100 dark:border-primary-900/40 rounded-2xl shadow-card px-3 py-2 flex items-center gap-2 motion-safe:animate-float"
      >
        <div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary flex items-center justify-center shrink-0">
          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold">{t.compLanding.newDonation}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">+Rp50.000</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
        className="absolute -right-2 sm:-right-4 lg:-right-6 bottom-8 rotate-[5deg] bg-white dark:bg-navy-800 border-2 border-accent-100 dark:border-accent-500/30 rounded-2xl shadow-card px-3 py-2 flex items-center gap-2 motion-safe:animate-float [animation-delay:1s]"
      >
        <div className="h-7 w-7 rounded-full bg-accent-100 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold">{t.compLanding.productSold}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">{t.compLanding.ebookDesign}</p>
        </div>
      </motion.div>
    </div>
  );
}
