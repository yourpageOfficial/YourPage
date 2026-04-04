"use client";

import { useTranslations } from "next-intl";
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

export default function ChatSettingsPage() {
  const t = useTranslations("ChatSettings");
  const qc = useQueryClient();
  const [chatPrice, setChatPrice] = useState("");
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
      setAutoReply(earnings.auto_reply || "");
    }
  }, [earnings]);

  const save = useMutation({
    mutationFn: () => api.put("/auth/me", {
      chat_price_idr: chatPrice ? parseInt(chatPrice) * 1000 : 0,
      auto_reply: isBusiness ? autoReply || null : undefined,
    }),
    onSuccess: () => { toast.success(t("saved")); qc.invalidateQueries({ queryKey: ["creator-earnings"] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || t("save_failed")),
  });

  const priceNum = parseInt(chatPrice) || 0;
  const creatorGets = priceNum > 0 ? Math.floor(priceNum * (100 - feePct) / 100) : 0;
  const platformGets = priceNum > 0 ? priceNum - creatorGets : 0;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{t("title")}</h1>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> {t("chat_price")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t("price_per_message")}</label>
            <div className="flex items-center gap-2 mt-1">
              <Input type="number" value={chatPrice} onChange={e => setChatPrice(e.target.value)} placeholder={t("price_placeholder")} className="w-40" min={0} />
              <span className="text-sm text-gray-500 dark:text-gray-400">Credit</span>
            </div>
          </div>

          {priceNum > 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{t("per_message")}</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 rounded bg-white dark:bg-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("supporter_pays")}</p>
                  <p className="font-bold text-primary">{priceNum} Credit</p>
                </div>
                <div className="text-center p-2 rounded bg-white dark:bg-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("you_get")}</p>
                  <p className="font-bold text-green-600">{creatorGets} Credit</p>
                </div>
                <div className="text-center p-2 rounded bg-white dark:bg-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("fee_label")}{feePct}%)</p>
                  <p className="font-bold text-gray-500">{platformGets} Credit</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("free_chat")}</p>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setChatPrice("5")}>{t("preset_5")}</Button>
            <Button size="sm" variant="outline" onClick={() => setChatPrice("10")}>{t("preset_10")}</Button>
            <Button size="sm" variant="outline" onClick={() => setChatPrice("25")}>{t("preset_25")}</Button>
            <Button size="sm" variant="outline" onClick={() => setChatPrice("0")}>{t("preset_free")}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            🤖 {t("auto_reply")}
            {!isBusiness && <Badge variant="outline" className="text-xs">{t("business_badge")}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isBusiness ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("auto_reply_desc")}</p>
              <Input value={autoReply} onChange={e => setAutoReply(e.target.value)} placeholder={t("auto_reply_placeholder")} />
              {autoReply && <p className="text-xs text-green-600">{t("auto_reply_active")}</p>}
            </div>
          ) : (
            <div className="text-center py-4">
              <Lock className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("auto_reply_locked")}</p>
              <Link href="/dashboard/subscription"><Button size="sm" variant="outline" className="mt-2">{t("upgrade_now")}</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">📊 {t("chat_limit")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("replies_per_day")}</span>
              <span className="font-medium">{isPro ? t("unlimited") : "10 / hari"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("supporter_requirement")}</span>
              <span className="font-medium">{t("must_follow")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("your_fee_tier")}</span>
              <span className="font-medium">{feePct}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full sm:w-auto">
        {save.isPending ? t("saving") : t("save_settings")}
      </Button>
    </div>
  );
}
