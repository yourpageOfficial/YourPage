"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/use-translation";

export default function CaraKerjaPage() {
  const { t } = useTranslation();

  const creatorSteps = [
    { step: "1", title: t("cara_kerja.creator_step_1_title"), desc: t("cara_kerja.creator_step_1_desc"), color: "from-primary to-primary-700" },
    { step: "2", title: t("cara_kerja.creator_step_2_title"), desc: t("cara_kerja.creator_step_2_desc"), color: "from-primary-500 to-primary-700" },
    { step: "3", title: t("cara_kerja.creator_step_3_title"), desc: t("cara_kerja.creator_step_3_desc"), color: "from-primary-600 to-primary-800" },
    { step: "4", title: t("cara_kerja.creator_step_4_title"), desc: t("cara_kerja.creator_step_4_desc"), color: "from-accent-400 to-accent-500" },
    { step: "5", title: t("cara_kerja.creator_step_5_title"), desc: t("cara_kerja.creator_step_5_desc"), color: "from-green-500 to-green-600" },
    { step: "6", title: t("cara_kerja.creator_step_6_title"), desc: t("cara_kerja.creator_step_6_desc"), color: "from-green-600 to-green-700" },
  ];

  const supporterSteps = [
    { step: "1", title: t("cara_kerja.supporter_step_1_title"), desc: t("cara_kerja.supporter_step_1_desc") },
    { step: "2", title: t("cara_kerja.supporter_step_2_title"), desc: t("cara_kerja.supporter_step_2_desc") },
    { step: "3", title: t("cara_kerja.supporter_step_3_title"), desc: t("cara_kerja.supporter_step_3_desc") },
    { step: "4", title: t("cara_kerja.supporter_step_4_title"), desc: t("cara_kerja.supporter_step_4_desc") },
  ];

  const feeTiers = [
    { tier: t("cara_kerja.fee_free"), price: t("cara_kerja.fee_free_price"), fee: t("cara_kerja.fee_free_fee"), creator: t("cara_kerja.fee_free_creator") },
    { tier: t("cara_kerja.fee_pro"), price: t("cara_kerja.fee_pro_price"), fee: t("cara_kerja.fee_pro_fee"), creator: t("cara_kerja.fee_pro_creator") },
    { tier: t("cara_kerja.fee_business"), price: t("cara_kerja.fee_business_price"), fee: t("cara_kerja.fee_business_fee"), creator: t("cara_kerja.fee_business_creator") },
  ];

  const faqs = [
    { q: t("cara_kerja.faq_q1"), a: t("cara_kerja.faq_a1") },
    { q: t("cara_kerja.faq_q2"), a: t("cara_kerja.faq_a2") },
    { q: t("cara_kerja.faq_q3"), a: t("cara_kerja.faq_a3") },
    { q: t("cara_kerja.faq_q4"), a: t("cara_kerja.faq_a4") },
  ];

  return (
    <>
      <Navbar />
      {/* Hero */}
      <div className="bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="relative text-center py-14 sm:py-20 px-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{t("cara_kerja.title")}</h1>
          <p className="text-primary-200 mt-3 text-lg">{t("cara_kerja.subtitle")}</p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-black mb-8">{t("cara_kerja.for_creator")}</h2>
        <div className="space-y-4 mb-16">
          {creatorSteps.map(s => (
            <Card key={s.step} hover>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md`}>{s.step}</div>
                <div><h3 className="font-bold text-base">{s.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{s.desc}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">{t("cara_kerja.for_supporter")}</h2>
        <div className="space-y-4 mb-16">
          {supporterSteps.map(s => (
            <Card key={s.step} hover>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">{s.step}</div>
                <div><h3 className="font-bold text-base">{s.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{s.desc}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">{t("cara_kerja.fee_structure")}</h2>
        <Card className="mb-16 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-navy-800/50">
                <th className="text-left py-4 px-5 font-semibold">{t("cara_kerja.fee_tier")}</th><th className="text-center py-4 px-5 font-semibold">{t("cara_kerja.fee_price")}</th><th className="text-center py-4 px-5 font-semibold">{t("cara_kerja.fee_fee")}</th><th className="text-center py-4 px-5 font-semibold">{t("cara_kerja.fee_creator_gets")}</th>
              </tr></thead>
              <tbody>
                {feeTiers.map((ft, i) => (
                  <tr key={ft.tier} className="border-b border-blue-50 dark:border-primary-900/20 bg-primary-50/30 dark:bg-navy-800/30">
                    <td className="py-3.5 px-5 font-medium">{ft.tier}</td><td className="text-center">{ft.price}</td><td className="text-center">{ft.fee}</td><td className="text-center font-bold text-green-600">{ft.creator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <h2 className="text-2xl sm:text-3xl font-black mb-8">{t("cara_kerja.faq")}</h2>
        <div className="space-y-3 mb-16">
          {faqs.map(faq => (
            <Card key={faq.q} hover>
              <CardContent className="p-5">
                <h3 className="font-bold text-sm">{faq.q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/register"><Button size="lg" variant="secondary" className="px-10">{t("cara_kerja.get_started")} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </main>
    </>
  );
}