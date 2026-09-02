"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

export default function CaraKerjaPage() {
  const { t } = useTranslation();

  const creatorSteps = [
    { step: "1", title: t.howItWorksPage.creatorStep1Title, desc: t.howItWorksPage.creatorStep1Desc, color: "from-primary to-primary-700" },
    { step: "2", title: t.howItWorksPage.creatorStep2Title, desc: t.howItWorksPage.creatorStep2Desc, color: "from-primary-500 to-primary-700" },
    { step: "3", title: t.howItWorksPage.creatorStep3Title, desc: t.howItWorksPage.creatorStep3Desc, color: "from-primary-600 to-primary-800" },
    { step: "4", title: t.howItWorksPage.creatorStep4Title, desc: t.howItWorksPage.creatorStep4Desc, color: "from-accent-400 to-accent-500" },
    { step: "5", title: t.howItWorksPage.creatorStep5Title, desc: t.howItWorksPage.creatorStep5Desc, color: "from-green-500 to-green-600" },
    { step: "6", title: t.howItWorksPage.creatorStep6Title, desc: t.howItWorksPage.creatorStep6Desc, color: "from-green-600 to-green-700" },
  ];

  const supporterSteps = [
    { step: "1", title: t.howItWorksPage.supporterStep1Title, desc: t.howItWorksPage.supporterStep1Desc },
    { step: "2", title: t.howItWorksPage.supporterStep2Title, desc: t.howItWorksPage.supporterStep2Desc },
    { step: "3", title: t.howItWorksPage.supporterStep3Title, desc: t.howItWorksPage.supporterStep3Desc },
    { step: "4", title: t.howItWorksPage.supporterStep4Title, desc: t.howItWorksPage.supporterStep4Desc },
  ];

  const faqs = [
    { q: t.howItWorksPage.faq1Q, a: t.howItWorksPage.faq1A },
    { q: t.howItWorksPage.faq2Q, a: t.howItWorksPage.faq2A },
    { q: t.howItWorksPage.faq3Q, a: t.howItWorksPage.faq3A },
    { q: t.howItWorksPage.faq4Q, a: t.howItWorksPage.faq4A },
  ];

  return (
    <>
      <Navbar />
      {/* Hero */}
      <div className="bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="relative text-center py-14 sm:py-20 px-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{t.howItWorksPage.heroTitle}</h1>
          <p className="text-primary-200 mt-3 text-lg">{t.howItWorksPage.heroSubtitle}</p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-black mb-8">{t.howItWorksPage.forCreatorsHeading}</h2>
        <div className="space-y-4 mb-16">
          {creatorSteps.map((s) => (
            <Card key={s.step} hover>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md`}>{s.step}</div>
                <div>
                  <h3 className="font-bold text-base">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">{t.howItWorksPage.forSupportersHeading}</h2>
        <div className="space-y-4 mb-16">
          {supporterSteps.map((s) => (
            <Card key={s.step} hover>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">{s.step}</div>
                <div>
                  <h3 className="font-bold text-base">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">{t.howItWorksPage.feeHeading}</h2>
        <Card className="mb-16 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-navy-800/50">
                  <th className="text-left py-4 px-5 font-semibold">{t.howItWorksPage.thTier}</th>
                  <th className="text-center py-4 px-5 font-semibold">{t.howItWorksPage.thPrice}</th>
                  <th className="text-center py-4 px-5 font-semibold">{t.howItWorksPage.thFee}</th>
                  <th className="text-center py-4 px-5 font-semibold">{t.howItWorksPage.thCreatorKeeps}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-blue-50 dark:border-primary-900/20">
                  <td className="py-3.5 px-5 font-medium">Free</td>
                  <td className="text-center">{t.howItWorksPage.freePrice}</td>
                  <td className="text-center">20%</td>
                  <td className="text-center font-bold text-green-600">80%</td>
                </tr>
                <tr className="border-b border-blue-50 dark:border-primary-900/20 bg-primary-50/30 dark:bg-navy-800/30">
                  <td className="py-3.5 px-5 font-medium">Pro</td>
                  <td className="text-center">{t.howItWorksPage.proPrice}</td>
                  <td className="text-center">10%</td>
                  <td className="text-center font-bold text-green-600">90%</td>
                </tr>
                <tr className="border-b border-blue-50 dark:border-primary-900/20">
                  <td className="py-3.5 px-5 font-medium">Business</td>
                  <td className="text-center">{t.howItWorksPage.businessPrice}</td>
                  <td className="text-center">5%</td>
                  <td className="text-center font-bold text-green-600">95%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">{t.howItWorksPage.faqHeading}</h2>
        <div className="space-y-3 mb-16">
          {faqs.map((f) => (
            <Card key={f.q} hover>
              <CardContent className="p-5">
                <h3 className="font-bold text-sm">{f.q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-10">
              {t.howItWorksPage.ctaButton} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </>
  );
}
