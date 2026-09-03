"use client";

import { useState } from "react";
import type { MembershipTier } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";
import { Trash2, Plus, Users, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";
import { useTranslation } from "@/lib/internationalization";

export default function MembershipPage() {
  const { t, interpolate } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [perks, setPerks] = useState("");

  const { data: tiers } = useQuery({
    queryKey: ["my-membership-tiers"],
    queryFn: async () => { const { data } = await api.get(`/membership-tiers/${user?.id}`); return (data.data || []) as MembershipTier[]; },
    enabled: !!user,
  });

  const { data: members } = useQuery({
    queryKey: ["my-members"],
    queryFn: async () => { const { data } = await api.get("/memberships/creator"); return (data.data || []) as MembershipTier[]; },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: () => api.post("/membership-tiers", { name, price_credits: parseInt(price), description: desc || undefined, perks: perks || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-membership-tiers"] }); setName(""); setPrice(""); setDesc(""); setPerks(""); toast.success(t.monetization.tierCreated); },
    onError: (e: any) => toast.error(e.response?.data?.error || t.monetization.saveFailed),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/membership-tiers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-membership-tiers"] }); toast.success(t.monetization.tierDeleted); },
    onError: (e: any) => toast.error(e.response?.data?.error || t.monetization.deleteTierFailed),
  });

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-6">{t.monetization.membershipTitle}</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-navy-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-black">{members?.length || 0}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.monetization.activeMembers}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center"><Crown className="h-5 w-5 text-accent" /></div>
            <div><p className="text-2xl font-black">{tiers?.length || 0}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.monetization.tierCountLabel}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Existing tiers */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.monetization.membershipTiersLabel}</p>
          {tiers && tiers.length > 0 ? (
            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-2">
              {tiers.map((tier: any) => (
                <motion.div key={tier.id} variants={staggerItem}>
                  <Card hover>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-bold">{tier.name}</p>
                        <p className="text-sm text-primary font-bold">{tier.price_credits} {t.monetization.creditPerMonth}</p>
                        {tier.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tier.description}</p>}
                        {tier.perks && <p className="text-[11px] text-gray-400 mt-0.5">{tier.perks}</p>}
                      </div>
                      <ConfirmDialog title={t.monetization.deleteTierTitle} message={interpolate(t.monetization.deleteTierMessage, { name: tier.name })} confirmLabel={t.monetization.deleteConfirmLabel} variant="destructive" onConfirm={() => del.mutate(tier.id)}>
                        {(open) => <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={open}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>}
                      </ConfirmDialog>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card><CardContent className="p-8 text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><Crown className="h-6 w-6 text-primary/40" /></div>
              <p className="text-sm text-gray-400">{t.monetization.noTiersYet}</p>
            </CardContent></Card>
          )}
        </div>

        {/* Right: Create form */}
        <Card className="h-fit">
          <CardContent className="p-5 space-y-3">
            <p className="font-bold text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> {t.monetization.createNewTier}</p>
            <div><label className="text-sm font-medium mb-1.5 block">{t.monetization.tierNameLabel}</label><Input placeholder={t.monetization.tierNamePlaceholder} value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">{t.monetization.tierPriceLabel}</label><Input type="number" placeholder={t.monetization.tierPricePlaceholder} value={price} onChange={e => setPrice(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">{t.monetization.tierDescriptionLabel}</label><Input placeholder={t.monetization.tierDescriptionPlaceholder} value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <Textarea placeholder={t.monetization.tierPerksPlaceholder} value={perks} onChange={e => setPerks(e.target.value)} className="min-h-[60px]" />
            <Button onClick={() => create.mutate()} disabled={!name || !price || create.isPending} className="w-full">
              {create.isPending ? t.monetization.creating : t.monetization.createTierButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
