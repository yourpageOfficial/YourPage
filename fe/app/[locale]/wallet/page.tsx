"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR, formatDate, idrToCredit } from "@/lib/utils";
import Link from "next/link";
import type { Wallet, CreditTransaction, ApiResponse, PaginatedResponse } from "@/lib/types";

export default function WalletPage() {
  const t = useTranslations("Wallet");
  const { user } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Wallet>>("/wallet/balance"); return data.data; },
  });

  // Creator also has earnings balance
  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    enabled: user?.role === "creator",
    queryFn: async () => { const { data } = await api.get("/creator/earnings"); return data.data as any; },
  });

  const { data: txs } = useQuery({
    queryKey: ["wallet-txs"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<CreditTransaction>>("/wallet/transactions"); return data.data; },
  });

  const walletCredits = wallet?.balance_credits ?? 0;
  const earningsCredits = earnings ? idrToCredit(earnings.balance_idr || 0) : 0;
  const totalCredits = walletCredits + earningsCredits;

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 sm:px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-xl sm:text-2xl font-bold">{t("title")}</h1>

        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("total_credit")}</CardTitle>
              <Link href="/wallet/topup"><Button size="sm">{t("topup")}</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{totalCredits} {t("credit")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">= {formatIDR(totalCredits * 1000)}</p>
          </CardContent>
        </Card>

        {user?.role === "creator" && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("from_topup")}</p>
                <p className="text-lg font-bold">{walletCredits} {t("credit")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("from_sales")}</p>
                <p className="text-lg font-bold text-green-600">{earningsCredits} {t("credit")}</p>
                <Link href="/dashboard/withdrawals" className="text-xs text-primary hover:underline">{t("withdraw_funds")}</Link>
              </CardContent>
            </Card>
          </div>
        )}

        <h2 className="mb-4 text-base sm:text-lg font-semibold">{t("transaction_history")}</h2>
        <div className="space-y-2 sm:space-y-3">
          {txs?.map((tx) => (
            <Card key={tx.id}>
              <CardContent className="flex items-center justify-between p-3 sm:p-4">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <Badge className={tx.type === "topup" || tx.type === "refund" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}>
                    {tx.type === "topup" || tx.type === "refund" ? "+" : "-"}{tx.credits} {t("credit")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {txs?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_transactions")}</p>}
        </div>
      </main>
    </AuthGuard>
  );
}
