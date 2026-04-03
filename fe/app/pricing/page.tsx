"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";

const allFeatures = [
  { key: "Post berbayar", tiers: [true, true, true] },
  { key: "Produk digital", tiers: ["Max 3", "Max 20", "Unlimited"] },
  { key: "Storage", tiers: ["1 GB", "10 GB", "50 GB"] },
  { key: "Platform fee", tiers: ["20%", "10%", "5%"] },
  { key: "Analytics", tiers: ["Basic", "Advanced", "Advanced + Export"] },
  { key: "Custom page", tiers: [false, true, true] },
  { key: "Scheduled posts", tiers: [false, true, true] },
  { key: "Priority support", tiers: [false, false, true] },
  { key: "Badge khusus", tiers: [false, "Pro", "Business"] },
];

export default function PricingPage() {
  const { user } = useAuth();
  const { data: tiers } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => { const { data } = await api.get("/tiers"); return data.data as any[]; },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Pilih Paket yang Tepat</h1>
          <p className="text-gray-500 dark:text-gray-400">Mulai gratis, upgrade kapan saja dengan Credit</p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {(tiers || []).map((t: any, i: number) => (
            <Card key={t.id} className={`relative ${i === 1 ? "border-primary ring-2 ring-primary/20" : ""}`}>
              {i === 1 && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Populer</Badge>}
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold mb-1">{t.name}</h3>
                {t.badge && <Badge variant="outline" className="mb-3">{t.badge}</Badge>}
                <div className="my-4">
                  {t.price_idr === 0 ? (
                    <p className="text-3xl font-bold">Gratis</p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold">{formatIDR(t.price_idr)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">per bulan</p>
                    </>
                  )}
                </div>
                <div className="text-left space-y-2 mb-6">
                  {JSON.parse(t.features || "[]").map((f: string) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                {user ? (
                  <Link href="/dashboard/subscription">
                    <Button className="w-full" variant={i === 1 ? "default" : "outline"}>
                      {t.price_idr === 0 ? "Paket Saat Ini" : "Upgrade"}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button className="w-full" variant={i === 1 ? "default" : "outline"}>Mulai Sekarang</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison table */}
        <h2 className="text-xl font-bold text-center mb-6">Perbandingan Fitur</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium">Fitur</th>
                <th className="text-center py-3 px-4 font-medium">Free</th>
                <th className="text-center py-3 px-4 font-medium text-primary">Pro</th>
                <th className="text-center py-3 px-4 font-medium">Business</th>
              </tr>
            </thead>
            <tbody>
              {allFeatures.map((f) => (
                <tr key={f.key} className="border-b dark:border-gray-800">
                  <td className="py-3 px-4">{f.key}</td>
                  {f.tiers.map((v, i) => (
                    <td key={i} className="text-center py-3 px-4">
                      {v === true ? <Check className="h-4 w-4 text-green-500 mx-auto" /> :
                       v === false ? <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-auto" /> :
                       <span className="font-medium">{v}</span>}
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
