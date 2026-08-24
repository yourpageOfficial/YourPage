"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Copy, Users, Coins, Gift, ExternalLink } from "lucide-react";
import type { ReferralStats, ReferralUse, PaginatedResponse, ApiResponse } from "@/lib/types";

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReferralDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReferralStats>>("/auth/referral/stats");
      return data.data;
    },
  });

  const { data: referrals } = useQuery({
    queryKey: ["referral-list"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ReferralUse>>("/auth/referral/list?limit=20");
      return data.data ?? [];
    },
  });

  const referralLink = stats ? `${window.location.origin}/register?ref=${stats.code}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link referral disalin!");
  };

  const copyCode = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.code);
    toast.success("Kode referral disalin!");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black">Program Referral 🎁</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Ajak teman daftar dan dapatkan bonus kredit untuk kamu berdua.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Referral" value={stats?.total_referred ?? 0} />
        <StatCard icon={<Coins className="h-5 w-5" />} label="Total Kredit Diperoleh" value={`${stats?.total_credits_earned ?? 0} CR`} />
        <StatCard icon={<Gift className="h-5 w-5" />} label="Bonus per Referral" value={`${stats?.reward_per_referral ?? 10} CR`} />
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link & Kode Referral Kamu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Code */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2.5 font-mono font-bold text-lg tracking-widest text-center border border-gray-200 dark:border-gray-700">
              {stats?.code ?? "—"}
            </div>
            <Button variant="outline" size="sm" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Full link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-500 truncate border border-gray-200 dark:border-gray-700 font-mono">
              {referralLink || "Memuat..."}
            </div>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
            {referralLink && (
              <Button variant="outline" size="sm" asChild>
                <a href={referralLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Setiap orang yang daftar melalui link/kode kamu akan mendapat{" "}
            <strong>{stats?.reward_per_referral ?? 10} kredit</strong> bonus, dan kamu juga mendapatkan hal yang sama.
          </p>
        </CardContent>
      </Card>

      {/* Who registered */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yang Mendaftar via Referral Kamu</CardTitle>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Belum ada yang daftar. Bagikan linkmu!</p>
          ) : (
            <div className="space-y-3">
              {referrals.map((use) => (
                <div key={use.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={use.referred_user.display_name}
                      src={use.referred_user.avatar_url}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium">{use.referred_user.display_name}</p>
                      <p className="text-xs text-gray-400">@{use.referred_user.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-500">+{use.reward_credits} CR</p>
                    <p className="text-xs text-gray-400">
                      {new Date(use.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
