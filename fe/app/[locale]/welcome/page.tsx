"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Package, Heart, Search, Wallet } from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
  const t = useTranslations("Welcome");
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-3 sm:px-4 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title", { name: user?.display_name || "" })}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">{t("subtitle")}</p>

        {user?.role === "creator" ? (
          <div className="mt-8 space-y-3 text-left">
            <StepCard icon={FileText} title={t("first_post_title")} desc={t("first_post_desc")} href="/dashboard/posts" />
            <StepCard icon={Package} title={t("upload_product_title")} desc={t("upload_product_desc")} href="/dashboard/products" />
            <StepCard icon={Heart} title={t("receive_donation_title")} desc={t("receive_donation_desc")} href={`/c/${user?.creator_profile?.page_slug || user?.username}`} />
            <Link href="/dashboard"><Button className="w-full mt-4" size="lg">{t("open_dashboard")}</Button></Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3 text-left">
            <StepCard icon={Search} title={t("find_creators_title")} desc={t("find_creators_desc")} href="/explore" />
            <StepCard icon={Wallet} title={t("topup_credit_title")} desc={t("topup_credit_desc")} href="/wallet/topup" />
            <StepCard icon={FileText} title={t("buy_content_title")} desc={t("buy_content_desc")} href="/explore" />
            <Link href="/s"><Button className="w-full mt-4" size="lg">{t("open_dashboard")}</Button></Link>
          </div>
        )}
      </main>
    </>
  );
}

function StepCard({ icon: Icon, title, desc, href }: { icon: any; title: string; desc: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
