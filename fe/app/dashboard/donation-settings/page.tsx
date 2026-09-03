"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { formatCredit } from "@/lib/utils";
import { Target, MessageSquare } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

export default function DonationSettingsPage() {
  const { t, interpolate } = useTranslation();
  const qc = useQueryClient();
  const [goalTitle, setGoalTitle] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });

  useEffect(() => {
    if (earnings) {
      setGoalTitle(earnings.donation_goal_title || "");
      setGoalAmount(earnings.donation_goal_amount ? String(earnings.donation_goal_amount / 1000) : "");
      setWelcomeMsg(earnings.welcome_message || "");
    }
  }, [earnings]);

  const save = useMutation({
    mutationFn: () => api.put("/auth/me", {
      donation_goal_title: goalTitle || null,
      donation_goal_amount: goalAmount ? parseInt(goalAmount) * 1000 : 0,
      welcome_message: welcomeMsg || null,
    }),
    onSuccess: () => { toast.success(t.monetization.settingsSaved); qc.invalidateQueries({ queryKey: ["creator-earnings"] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || t.monetization.saveFailed),
  });

  const goalCurrent = earnings?.donation_goal_current || 0;
  const goalTarget = goalAmount ? parseInt(goalAmount) * 1000 : 0;
  const goalPct = goalTarget > 0 ? Math.min((goalCurrent / goalTarget) * 100, 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-6">{t.monetization.donationSettingsTitle}</h1>

      {/* Donation Goal */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5" /> {t.monetization.donationGoalTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.monetization.donationGoalDesc}</p>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t.monetization.goalTitleLabel}</label>
            <Input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder={t.monetization.goalTitlePlaceholder} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t.monetization.goalAmountLabel}</label>
            <div className="flex items-center gap-2">
              <Input type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder={t.monetization.goalAmountPlaceholder} className="w-40" />
              <span className="text-sm text-gray-500">{t.monetization.creditUnit}</span>
            </div>
          </div>
          {goalTarget > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{interpolate(t.monetization.goalCollected, { amount: formatCredit(goalCurrent) })}</span>
                <span>{formatCredit(goalTarget)} {t.monetization.goalTargetLabel}</span>
              </div>
              <div className="h-3 bg-primary-100 dark:bg-navy-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goalPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{interpolate(t.monetization.goalPercentReached, { percent: goalPct.toFixed(0) })}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setGoalAmount("500")}>{t.monetization.preset500Credit}</Button>
            <Button size="sm" variant="outline" onClick={() => setGoalAmount("1000")}>{t.monetization.preset1kCredit}</Button>
            <Button size="sm" variant="outline" onClick={() => setGoalAmount("5000")}>{t.monetization.preset5kCredit}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5" /> {t.monetization.welcomeMessageTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.monetization.welcomeMessageDesc}</p>
          <Textarea value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)}
            placeholder={t.monetization.welcomeMessagePlaceholder} />
          <p className="text-xs text-gray-400">{welcomeMsg.length}/500</p>
        </CardContent>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full sm:w-auto">
        {save.isPending ? t.monetization.saving : t.monetization.saveSettings}
      </Button>
    </div>
  );
}
