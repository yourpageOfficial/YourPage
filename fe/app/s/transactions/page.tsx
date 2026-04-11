"use client";

import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@/lib/types";
import { statusColor, statusLabel } from "@/components/ui/standards";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";
import Link from "next/link";

const usecaseLabel: Record<string, string> = { post_purchase: "Beli Post", product_purchase: "Beli Produk", donation: "Donasi", credit_topup: "Top-up Credit" };
const usecaseEmoji: Record<string, string> = { post_purchase: "📝", product_purchase: "📦", donation: "💰", credit_topup: "💳" };
const usecaseColor: Record<string, string> = { post_purchase: "from-primary-500", product_purchase: "from-purple-500", donation: "from-pink-500", credit_topup: "from-green-500" };

function txLink(t: any): string {
  if (!t.reference_id || t.reference_id === "00000000-0000-0000-0000-000000000000") return "#";
  switch (t.usecase) { case "post_purchase": return `/posts/${t.reference_id}`; case "product_purchase": return `/products/${t.reference_id}`; default: return "#"; }
}

export default function SupporterTransactions() {
  const { data: txs, isLoading } = useQuery({
    queryKey: ["my-transactions"],
    queryFn: async () => { const { data } = await api.get("/my/transactions?limit=50"); return (data.data || []) as Transaction[]; },
  });

  const totalSpent = txs?.filter((t: any) => t.status === "paid").reduce((sum: number, t: any) => sum + t.amount_idr, 0) || 0;
  const txCount = txs?.length || 0;

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-5">Riwayat Transaksi</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-navy-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-primary">{formatCredit(totalSpent)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Total Pengeluaran</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black">{txCount}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Transaksi</p>
          </CardContent>
        </Card>
      </div>

      {txs?.length === 0 && (
        <Card><CardContent className="p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><Receipt className="h-7 w-7 text-primary" /></div>
          <p className="font-semibold">Belum ada transaksi</p>
        </CardContent></Card>
      )}

      {/* Table */}
      {txs && txs.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-100 dark:border-primary-900/30 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Jumlah</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t: any, i: number) => (
                  <tr key={t.id} className={`border-b border-blue-50 dark:border-primary-900/20 hover:bg-primary-50/30 dark:hover:bg-primary-900/5 transition-colors ${i % 2 === 0 ? "" : "bg-primary-50/20 dark:bg-navy-800/30"}`}>
                    <td className="px-4 py-3">
                      <Link href={txLink(t)} className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                        <span className="text-base">{usecaseEmoji[t.usecase] || "💳"}</span>
                        <span className="font-medium">{usecaseLabel[t.usecase] || t.usecase}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatCredit(t.amount_idr)}</td>
                    <td className="px-4 py-3"><Badge className={`${statusColor[t.status] || ""} text-[10px]`}>{statusLabel[t.status] || t.status}</Badge></td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
