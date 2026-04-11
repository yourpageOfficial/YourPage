"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, ArrowRight } from "lucide-react";
import { formatIDR, formatDate } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";
import Link from "next/link";
import type { Wallet, CreditTransaction, ApiResponse, PaginatedResponse } from "@/lib/types";

export default function WalletPage() {
  const { user } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Wallet>>("/wallet/balance"); return data.data; },
  });

  const { data: txs } = useQuery({
    queryKey: ["wallet-txs"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<CreditTransaction>>("/wallet/transactions"); return data.data; },
  });

  const totalCredits = wallet?.balance_credits ?? 0;

  return (
    <AuthGuard>
      <Navbar />
      <PageTransition>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-xl sm:text-2xl font-display font-black tracking-tight">Wallet</h1>

        {/* Balance card */}
        <Card className="mb-6 bg-gradient-hero dark:bg-gradient-hero-dark border-0 text-white overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary-300/10 rounded-full blur-2xl" />
          <CardContent className="p-6 sm:p-8 relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-primary-200 text-sm font-medium">Saldo Credit</p>
              <Link href="/wallet/topup"><Button size="sm" variant="secondary">Top-up</Button></Link>
            </div>
            <p className="text-4xl sm:text-5xl font-black">{totalCredits}</p>
            <p className="text-primary-200 text-sm mt-1">= {formatIDR(totalCredits * 1000)}</p>
          </CardContent>
        </Card>

        {user?.role === "creator" && (
          <Link href="/dashboard/withdrawals" className="flex items-center gap-2 text-sm text-primary hover:underline font-medium mb-6">
            💰 Tarik saldo ke rekening bank <ArrowRight className="h-3 w-3" />
          </Link>
        )}

        <h2 className="mb-4 text-base font-bold">Riwayat Transaksi</h2>
        <div className="space-y-2.5">
          {txs?.map((tx) => (
            <Card key={tx.id} hover>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <Badge variant={["topup", "refund", "earning"].includes(tx.type) ? "success" : "destructive"}>
                    {["topup", "refund", "earning"].includes(tx.type) ? "+" : "-"}{tx.credits} Credit
                  </Badge>
                  {tx.type === "withdrawal" && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatIDR(tx.idr_amount)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {txs?.length === 0 && (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold">Belum ada transaksi</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Top-up Credit untuk mulai bertransaksi</p>
              <Link href="/wallet/topup"><Button variant="outline" size="sm" className="mt-4">Top-up Credit</Button></Link>
            </div>
          )}
        </div>
      </main>
      </PageTransition>
    </AuthGuard>
  );
}
