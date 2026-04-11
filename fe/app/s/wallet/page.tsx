"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCredit, formatDate } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import type { Wallet as WalletType, CreditTransaction, ApiResponse, PaginatedResponse } from "@/lib/types";
import { motion } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";

export default function SupporterWallet() {
  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => { const { data } = await api.get<ApiResponse<WalletType>>("/wallet/balance"); return data.data; },
  });
  const { data: txs } = useQuery({
    queryKey: ["wallet-txs"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<CreditTransaction>>("/wallet/transactions"); return data.data; },
  });

  const income = txs?.filter(t => ["topup", "refund", "earning"].includes(t.type)).reduce((s, t) => s + t.credits, 0) || 0;
  const spent = txs?.filter(t => !["topup", "refund", "earning"].includes(t.type)).reduce((s, t) => s + t.credits, 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-display font-black tracking-tight">Wallet</h1>
        <Link href="/wallet/topup"><Button size="sm" variant="secondary" className="rounded-2xl">Top-up</Button></Link>
      </div>

      {/* Balance + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-primary-600 via-primary to-primary-800 dark:from-primary-900 dark:via-primary-800 dark:to-navy-900 border-0 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <CardContent className="p-6 relative">
            <p className="text-primary-200 text-xs font-medium">Saldo Credit</p>
            <p className="text-4xl sm:text-5xl font-black mt-1">{wallet?.balance_credits ?? 0}</p>
            <p className="text-primary-200/60 text-xs mt-1">1 Credit = Rp 1.000</p>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0"><ArrowDownLeft className="h-4 w-4 text-green-500" /></div>
              <div><p className="text-lg font-black text-green-500">+{income}</p><p className="text-[10px] text-gray-400">Masuk</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0"><ArrowUpRight className="h-4 w-4 text-red-500" /></div>
              <div><p className="text-lg font-black text-red-500">-{spent}</p><p className="text-[10px] text-gray-400">Keluar</p></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <h2 className="text-sm font-bold mb-3">Riwayat</h2>
      {txs && txs.length > 0 ? (
        <Card>
          <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="divide-y divide-primary-50 dark:divide-primary-900/20">
            {txs.map((tx) => {
              const isIncome = ["topup", "refund", "earning"].includes(tx.type);
              return (
                <motion.div key={tx.id} variants={staggerItem} className="flex items-center gap-3 px-4 py-3 hover:bg-primary-50/30 dark:hover:bg-primary-900/5 transition-colors">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                    {isIncome ? <ArrowDownLeft className="h-4 w-4 text-green-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(tx.created_at)}</p>
                  </div>
                  <p className={`font-bold text-sm shrink-0 ${isIncome ? "text-green-500" : "text-red-500"}`}>
                    {isIncome ? "+" : "-"}{tx.credits}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </Card>
      ) : (
        <Card><CardContent className="p-10 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><Wallet className="h-6 w-6 text-primary" /></div>
          <p className="text-sm text-gray-400">Belum ada transaksi</p>
        </CardContent></Card>
      )}
    </div>
  );
}
