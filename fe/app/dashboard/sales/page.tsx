"use client";

import { useQuery } from "@tanstack/react-query";
import type { Sale } from "@/lib/types";
import { statusColor, statusLabel } from "@/components/ui/standards";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import { Coins, FileText, Heart, Package, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

const usecaseEmoji: Record<string, string> = { post_purchase: "📝", product_purchase: "📦", donation: "💰" };

export default function DashboardSales() {
  const { t } = useTranslation();

  const usecaseLabel: Record<string, string> = { post_purchase: t.monetization.postLabel, product_purchase: t.monetization.productLabel, donation: t.monetization.donationLabel };

  const { data: sales } = useQuery({
    queryKey: ["creator-sales"],
    queryFn: async () => { const { data } = await api.get("/creator/sales?limit=50"); return (data.data || []) as Sale[]; },
  });

  const totalNet = sales?.reduce((s: number, x: any) => s + (x.net_amount_idr || 0), 0) || 0;
  const totalFee = sales?.reduce((s: number, x: any) => s + (x.fee_idr || 0), 0) || 0;
  const postSales = sales?.filter((s: any) => s.usecase === "post_purchase").length || 0;
  const productSales = sales?.filter((s: any) => s.usecase === "product_purchase").length || 0;
  const donationSales = sales?.filter((s: any) => s.usecase === "donation").length || 0;

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-5">{t.monetization.salesTitle}</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-navy-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-green-500">{formatCredit(totalNet)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{t.monetization.netRevenue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center"><FileText className="h-4 w-4 text-primary" aria-hidden="true" /></div>
            <div><p className="text-lg font-black">{postSales}</p><p className="text-[10px] text-gray-400">{t.monetization.postLabel}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center"><Package className="h-4 w-4 text-purple-500" aria-hidden="true" /></div>
            <div><p className="text-lg font-black">{productSales}</p><p className="text-[10px] text-gray-400">{t.monetization.productLabel}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center"><Coins className="h-4 w-4 text-pink-500" aria-hidden="true" /></div>
            <div><p className="text-lg font-black">{donationSales}</p><p className="text-[10px] text-gray-400">{t.monetization.donationLabel}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Table-style list */}
      {sales && sales.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-100 dark:border-primary-900/30 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.monetization.colType}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.monetization.colBuyer}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">{t.monetization.colGross}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">{t.monetization.colNet}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">{t.monetization.colDate}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s: any, i: number) => (
                  <tr key={s.id} className={`border-b border-blue-50 dark:border-primary-900/20 hover:bg-primary-50/30 dark:hover:bg-primary-900/5 transition-colors ${i % 2 === 0 ? "" : "bg-primary-50/20 dark:bg-navy-800/30"}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{usecaseEmoji[s.usecase] || "💳"}</span>
                        <span className="font-medium">{usecaseLabel[s.usecase] || s.usecase}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.payer?.display_name || s.payer?.username || "-"}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCredit(s.amount_idr)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-500">{formatCredit(s.net_amount_idr)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card><CardContent className="p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3"><TrendingUp className="h-7 w-7 text-green-500" /></div>
          <p className="font-semibold">{t.monetization.noSalesTitle}</p>
          <p className="text-sm text-gray-400 mt-1">{t.monetization.noSalesDesc}</p>
        </CardContent></Card>
      )}
    </div>
  );
}
