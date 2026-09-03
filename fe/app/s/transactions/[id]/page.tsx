"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR, formatDate } from "@/lib/utils";
import { Printer } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

export default function InvoicePage() {
  const { t, interpolate } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { data: txs } = useQuery({
    queryKey: ["wallet-txs"],
    queryFn: async () => { const { data } = await api.get("/wallet/transactions"); return data.data as any[]; },
  });

  const tx = txs?.find((t: any) => t.id === id);

  if (!tx) return <div className="p-8 text-center text-gray-500">{t.common.loading}</div>;

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">{t.supporterHub.invoice}</h1>
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> {t.supporterHub.print}</Button>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-center border-b dark:border-primary-900/30 pb-4">
            <h2 className="text-lg font-bold text-primary">YourPage</h2>
            <p className="text-xs text-gray-400">urpage.online</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">{t.supporterHub.txId}</span><p className="font-mono text-xs mt-1">{tx.id}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400">{t.supporterHub.date}</span><p className="mt-1">{formatDate(tx.created_at)}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400">{t.supporterHub.type}</span><p className="mt-1 capitalize">{tx.type}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400">{t.supporterHub.amount}</span><p className="mt-1 font-bold text-lg">{interpolate(t.supporterHub.creditAmount, { credits: tx.credits })}</p></div>
          </div>
          {tx.description && <p className="text-sm text-gray-600 dark:text-gray-400 border-t dark:border-primary-900/30 pt-3">{tx.description}</p>}
          <div className="text-center border-t dark:border-primary-900/30 pt-4">
            <p className="text-xs text-gray-400">{t.supporterHub.digitalReceipt}</p>
            <p className="text-xs text-gray-400">{t.wallet.creditRateNote}</p>
            <p className="text-sm font-bold mt-1">{t.supporterHub.total} {formatIDR(tx.credits * 1000)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
