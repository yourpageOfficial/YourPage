"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";

const usecaseLabel: Record<string, string> = { post_purchase: "Post", product_purchase: "Produk", donation: "Donasi" };

export default function DashboardSales() {
  const t = useTranslations("Sales");
  const { data: sales } = useQuery({
    queryKey: ["creator-sales"],
    queryFn: async () => { const { data } = await api.get("/creator/sales?limit=50"); return data.data as any[]; },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <div className="space-y-2">
        {sales?.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge>{usecaseLabel[s.usecase] || s.usecase}</Badge>
                  <span className="font-medium">{formatCredit(s.amount_idr)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t("buyer")} {s.payer?.display_name || s.payer?.username || "-"} · {t("net")}: {formatCredit(s.net_amount_idr)} · {t("fee")}: {formatCredit(s.fee_idr)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-400">{formatDate(s.created_at)}</p>
              </div>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{s.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {sales?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_sales")}</p>}
      </div>
    </div>
  );
}
