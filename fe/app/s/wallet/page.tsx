"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCredit, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Wallet, CreditTransaction, ApiResponse, PaginatedResponse } from "@/lib/types";

export default function SupporterWallet() {
  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Wallet>>("/wallet/balance"); return data.data; },
  });
  const { data: txs } = useQuery({
    queryKey: ["wallet-txs"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<CreditTransaction>>("/wallet/transactions"); return data.data; },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <Link href="/wallet/topup"><Button size="sm">Top-up</Button></Link>
      </div>
      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-2xl sm:text-3xl font-bold text-primary">{wallet?.balance_credits ?? 0} Credit</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">1 Credit = Rp 1.000</p>
        </CardContent>
      </Card>
      <h2 className="mb-4 text-lg font-semibold">Riwayat</h2>
      <div className="space-y-2">
        {txs?.map((tx) => (
          <Card key={tx.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.created_at)}</p>
              </div>
              <Badge className={tx.type === "topup" || tx.type === "refund" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}>
                {tx.type === "topup" || tx.type === "refund" ? "+" : "-"}{tx.credits} Credit
              </Badge>
            </CardContent>
          </Card>
        ))}
        {txs?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada transaksi.</p>}
      </div>
    </div>
  );
}
