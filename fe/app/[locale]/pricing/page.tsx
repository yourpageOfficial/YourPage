"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";

export default function PricingPage() {
  const t = useTranslations("Pricing");
  const f = useTranslations("PricingFeatures");
  const { user } = useAuth();
  const { data: tiers } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => { const { data } = await api.get("/tiers"); return data.data as any[]; },
  });

  const allFeatures = [
    { key: "post_paid", tiers: [true, true, true] },
    { key: "digital_product", tiers: ["max_3", "max_20", "unlimited"] },
    { key: "storage_label", tiers: ["gb_1", "gb_10", "gb_50"] },
    { key: "platform_fee", tiers: ["fee_20", "fee_10", "fee_5"] },
    { key: "analytics_label", tiers: ["basic", "advanced", "advanced_export"] },
    { key: "custom_page", tiers: [false, true, true] },
    { key: "scheduled_posts", tiers: [false, true, true] },
    { key: "priority_support", tiers: [false, false, true] },
    { key: "special_badge", tiers: [false, "pro", "business"] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("title")}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {(tiers || []).map((tier: any, i: number) => (
            <Card key={tier.id} className={`relative ${i === 1 ? "border-primary ring-2 ring-primary/20" : ""}`}>
              {i === 1 && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{t("popular")}</Badge>}
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                {tier.badge && <Badge variant="outline" className="mb-3">{tier.badge}</Badge>}
                <div className="my-4">
                  {tier.price_idr === 0 ? (
                    <p className="text-3xl font-bold">{t("free_header")}</p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold">{formatIDR(tier.price_idr)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("per_month")}</p>
                    </>
                  )}
                </div>
                <div className="text-left space-y-2 mb-6">
                  {JSON.parse(tier.features || "[]").map((featureText: string) => (
                    <div key={featureText} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{featureText}</span>
                    </div>
                  ))}
                </div>
                {user ? (
                  <Link href="/dashboard/subscription">
                    <Button className="w-full" variant={i === 1 ? "default" : "outline"}>
                      {tier.price_idr === 0 ? t("current_plan") : t("upgrade_btn")}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button className="w-full" variant={i === 1 ? "default" : "outline"}>{t("start_now")}</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-bold text-center mb-6">{t("feature_comparison")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium">{t("feature_header")}</th>
                <th className="text-center py-3 px-4 font-medium">{t("free_header")}</th>
                <th className="text-center py-3 px-4 font-medium text-primary">{t("pro_header")}</th>
                <th className="text-center py-3 px-4 font-medium">{t("business_header")}</th>
              </tr>
            </thead>
            <tbody>
              {allFeatures.map((feature) => (
                <tr key={feature.key} className="border-b dark:border-gray-800">
                  <td className="py-3 px-4">{f(feature.key)}</td>
                  {feature.tiers.map((v, i) => (
                    <td key={i} className="text-center py-3 px-4">
                      {v === true ? <Check className="h-4 w-4 text-green-500 mx-auto" /> :
                       v === false ? <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-auto" /> :
                       <span className="font-medium">{f(v as string)}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
