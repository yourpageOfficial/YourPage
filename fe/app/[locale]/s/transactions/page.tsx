"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { statusColor } from "@/components/ui/standards";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";
import Link from "next/link";

const usecaseIcon: Record<string, string> = { post_purchase: "📝", product_purchase: "📦", donation: "💰", credit_topup: "💳" };

function txLink(t: any): string {
  if (!t.reference_id || t.reference_id === "00000000-0000-0000-0000-000000000000") return "#";
  switch (t.usecase) {
    case "post_purchase": return `/posts/${t.reference_id}`;
    case "product_purchase": return `/products/${t.reference_id}`;
    case "credit_topup": return "/s/wallet";
    default: return "#";
  }
}

export default function SupporterTransactions() {
  const t = useTranslations("SupporterTransactions");
  const { data: txs } = useQuery({
    queryKey: ["my-transactions"],
    queryFn: async () => { const { data } = await api.get("/my/transactions?limit=50"); return data.data as any[]; },
  });

  const totalSpent = txs?.filter((tx: any) => tx.status === "paid").reduce((sum: number, tx: any) => sum + tx.amount_idr, 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("transaction_history")}</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("total_spent")}</p>
          <p className="text-lg font-bold text-primary">{formatCredit(totalSpent)}</p>
        </div>
      </div>

      {txs?.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-gray-500 dark:text-gray-400">{t("no_transactions")}</p>
        </div>
      )}

      <div className="space-y-2">
        {txs?.map((tx: any) => (
          <Card key={tx.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg shrink-0">
                  {usecaseIcon[tx.usecase] || "💳"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link href={txLink(tx)} className="font-medium hover:text-primary">
                      {tx.usecase === "post_purchase" ? t("buy_post") : tx.usecase === "product_purchase" ? t("buy_product") : tx.usecase === "donation" ? t("donation") : t("topup_credit")}
                    </Link>
                    <p className="font-bold">{formatCredit(tx.amount_idr)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{tx.provider}</span>
                      <span>·</span>
                      <span>{formatDate(tx.created_at)}</span>
                      {tx.unique_code > 0 && <><span>·</span><span>{t("unique_code", { code: tx.unique_code })}</span></>}
                    </div>
                    <Badge className={statusColor[tx.status] || ""}>{tx.status}</Badge>
                  </div>
                  {tx.status === "paid" && (
                    <div className="flex gap-4 mt-1 text-xs text-gray-400 dark:text-gray-400">
                      <span>{t("fee_format", { fee: formatCredit(tx.fee_idr) })}</span>
                      <span>{t("net_format", { net: formatCredit(tx.net_amount_idr) })}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
