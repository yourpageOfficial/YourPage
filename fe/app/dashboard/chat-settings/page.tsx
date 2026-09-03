"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { MessageCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/internationalization";

export default function ChatSettingsPage() {
  const { t, interpolate } = useTranslation();
  const qc = useQueryClient();
  const [chatPrice, setChatPrice] = useState("");
  const [chatAllowFrom, setChatAllowFrom] = useState("all");
  const [autoReply, setAutoReply] = useState("");

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });

  const isPro = earnings?.tier_name === "Pro" || earnings?.tier_name === "Business";
  const isBusiness = earnings?.tier_name === "Business";
  const feePct = earnings?.fee_percent ?? 20;

  useEffect(() => {
    if (earnings) {
      setChatPrice(earnings.chat_price_idr ? String(earnings.chat_price_idr / 1000) : "");
      setChatAllowFrom(earnings.chat_allow_from || "all");
      setAutoReply(earnings.auto_reply || "");
    }
  }, [earnings]);

  const save = useMutation({
    mutationFn: () => api.put("/auth/me", {
      chat_price_idr: chatPrice ? parseInt(chatPrice) * 1000 : 0,
      chat_allow_from: chatAllowFrom,
      auto_reply: isBusiness ? autoReply || null : undefined,
    }),
    onSuccess: () => { toast.success(t.monetization.chatSettingsSaved); qc.invalidateQueries({ queryKey: ["creator-earnings"] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || t.monetization.chatSaveFailed),
  });

  const priceNum = parseInt(chatPrice) || 0;
  const creatorGets = priceNum > 0 ? Math.floor(priceNum * (100 - feePct) / 100) : 0;
  const platformGets = priceNum > 0 ? priceNum - creatorGets : 0;

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-6">{t.monetization.chatSettingsTitle}</h1>

      {/* Chat Price */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> {t.monetization.chatPriceTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t.monetization.chatPriceLabel}</label>
            <div className="flex items-center gap-2 mt-1">
              <Input type="number" value={chatPrice} onChange={e => setChatPrice(e.target.value)} placeholder={t.monetization.chatPricePlaceholder} className="w-40" min={0} />
              <span className="text-sm text-gray-500 dark:text-gray-400">{t.monetization.creditUnit}</span>
            </div>
          </div>

          {priceNum > 0 ? (
            <div className="bg-primary-50/50 dark:bg-navy-800 rounded-xl p-3 space-y-1">
              <p className="text-sm font-medium">{t.monetization.simulationTitle}</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 rounded bg-white dark:bg-navy-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.monetization.simulationSenderPays}</p>
                  <p className="font-bold text-primary">{priceNum} {t.monetization.creditUnit}</p>
                </div>
                <div className="text-center p-2 rounded bg-white dark:bg-navy-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.monetization.simulationYouGet}</p>
                  <p className="font-bold text-yellow-600 dark:text-yellow-400">{creatorGets} {t.monetization.creditUnit}</p>
                </div>
                <div className="text-center p-2 rounded bg-white dark:bg-navy-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{interpolate(t.monetization.simulationFee, { percent: feePct })}</p>
                  <p className="font-bold text-gray-500">{platformGets} {t.monetization.creditUnit}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.monetization.freeChatNote}</p>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setChatPrice("5")}>{t.monetization.preset5Credit}</Button>
            <Button size="sm" variant="outline" onClick={() => setChatPrice("10")}>{t.monetization.preset10Credit}</Button>
            <Button size="sm" variant="outline" onClick={() => setChatPrice("25")}>{t.monetization.preset25Credit}</Button>
            <Button size="sm" variant="outline" onClick={() => setChatPrice("0")}>{t.monetization.presetFree}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Who can chat */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5" /> {t.monetization.whoCanChatTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.monetization.whoCanChatDesc}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "all",            label: t.monetization.chatOptionAllLabel,           desc: t.monetization.chatOptionAllDesc },
              { id: "supporter_only", label: t.monetization.chatOptionSupporterLabel,    desc: t.monetization.chatOptionSupporterDesc },
              { id: "creator_only",   label: t.monetization.chatOptionCreatorLabel,      desc: t.monetization.chatOptionCreatorDesc },
              { id: "none",           label: t.monetization.chatOptionNoneLabel,         desc: t.monetization.chatOptionNoneDesc },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setChatAllowFrom(opt.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${chatAllowFrom === opt.id ? "border-primary bg-primary/5" : "border-primary-100 dark:border-primary-900/30 hover:border-primary-200"}`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
          {chatAllowFrom === "none" && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{t.monetization.chatDisabledWarning}</p>
          )}
        </CardContent>
      </Card>

      {/* Auto Reply */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {t.monetization.autoReplyTitle}
            {!isBusiness && <Badge variant="outline" className="text-xs">{t.monetization.businessBadgeLabel}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isBusiness ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.monetization.autoReplyDesc}</p>
              <Input value={autoReply} onChange={e => setAutoReply(e.target.value)} placeholder={t.monetization.autoReplyPlaceholder} />
              {autoReply && <p className="text-xs text-green-600">{t.monetization.autoReplyActive}</p>}
            </div>
          ) : (
            <div className="text-center py-4">
              <Lock className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.monetization.upgradeToBusiness}</p>
              <Link href="/dashboard/subscription"><Button size="sm" variant="outline" className="mt-2">{t.monetization.upgradeButton}</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Limits Info */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.monetization.chatLimitsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t.monetization.dailyReplies}</span>
              <span className="font-medium">{isPro ? t.monetization.dailyRepliesUnlimited : t.monetization.dailyRepliesLimited}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t.monetization.senderRequirement}</span>
              <span className="font-medium">{t.monetization.mustFollow}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t.monetization.yourFeeTier}</span>
              <span className="font-medium">{feePct}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full sm:w-auto">
        {save.isPending ? t.monetization.saving : t.monetization.saveSettings}
      </Button>
    </div>
  );
}
