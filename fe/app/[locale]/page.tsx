import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { FileText, Package, Heart, Shield, Zap, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("Homepage");
  const tCommon = await getTranslations("Common");

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight" dangerouslySetInnerHTML={{ __html: t("hero_title") }} />
        <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          {t("hero_desc")}
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/register"><Button size="lg" className="w-full sm:w-auto">{t("start_free")}</Button></Link>
          <Link href="/explore"><Button variant="outline" size="lg" className="w-full sm:w-auto">{t("view_creators")}</Button></Link>
          <Link href="/pricing"><Button variant="ghost" size="lg" className="w-full sm:w-auto">{t("view_pricing")}</Button></Link>
        </div>
        <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-100">10+</span> {t("creators_count")}
          <span className="font-semibold text-gray-900 dark:text-gray-100">100+</span> Transaksi
          <span className="font-semibold text-gray-900 dark:text-gray-100">10%</span> {t("fee_only")}
        </div>
      </section>

      <section className="bg-surface dark:bg-gray-800/50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">{t("how_it_works")}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: t("step1_title"), desc: t("step1_desc") },
              { step: "2", title: t("step2_title"), desc: t("step2_desc") },
              { step: "3", title: t("step3_title"), desc: t("step3_desc") },
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

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">{t("features_title")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={FileText} title={t("feature1_title")} desc={t("feature1_desc")} />
            <FeatureCard icon={Package} title={t("feature2_title")} desc={t("feature2_desc")} />
            <FeatureCard icon={Heart} title={t("feature3_title")} desc={t("feature3_desc")} />
            <FeatureCard icon={CreditCard} title={t("feature4_title")} desc={t("feature4_desc")} />
            <FeatureCard icon={Shield} title={t("feature5_title")} desc={t("feature5_desc")} />
            <FeatureCard icon={Zap} title={t("feature6_title")} desc={t("feature6_desc")} />
          </div>
        </div>
      </section>

      <section className="bg-surface dark:bg-gray-800/50 py-12 sm:py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t("pricing_title")}</h2>
          <Card>
            <CardContent className="p-6 sm:p-8">
              <p className="text-3xl sm:text-4xl font-bold text-primary">10%</p>
              <p className="text-gray-600 mt-2">{t("platform_fee")}</p>
              <ul className="mt-4 text-sm text-left space-y-2 text-gray-600 dark:text-gray-400">
                <li>✅ {t("pricing_free1")}</li>
                <li>✅ {t("pricing_free2")}</li>
                <li>✅ {t("pricing_free3")}</li>
                <li>✅ {t("pricing_free4")}</li>
                <li>✅ {t("pricing_free5")}</li>
              </ul>
              <Link href="/register"><Button className="w-full mt-6" size="lg">{t("register_now")}</Button></Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 sm:py-16 text-center px-4">
        <h2 className="text-2xl sm:text-3xl font-bold">{t("cta_title")}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t("cta_desc")}</p>
        <Link href="/register"><Button size="lg" className="mt-6">{t("cta_btn")}</Button></Link>
      </section>

      <footer className="border-t py-8 text-center text-xs text-gray-400 space-y-2 px-4">
        <p>{t("copyright")}</p>
        <div className="flex justify-center gap-4">
          <a href="/terms" className="hover:text-gray-600 dark:text-gray-400">{t("terms_link")}</a>
          <a href="/privacy" className="hover:text-gray-600 dark:text-gray-400">{t("privacy_link")}</a>
          <a href="/contact" className="hover:text-gray-600 dark:text-gray-400">{t("contact_link")}</a>
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
