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

export default function MembershipPage() {
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-membership-tiers"] }); setName(""); setPrice(""); setDesc(""); setPerks(""); toast.success("Tier dibuat!"); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/membership-tiers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-membership-tiers"] }); toast.success("Tier dihapus"); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal menghapus tier"),
  });

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-6">Fan Membership</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-navy-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-black">{members?.length || 0}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider">Member Aktif</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center"><Crown className="h-5 w-5 text-accent" /></div>
            <div><p className="text-2xl font-black">{tiers?.length || 0}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider">Tier</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Existing tiers */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tier Membership</p>
          {tiers && tiers.length > 0 ? (
            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-2">
              {tiers.map((t: any) => (
                <motion.div key={t.id} variants={staggerItem}>
                  <Card hover>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-bold">{t.name}</p>
                        <p className="text-sm text-primary font-bold">{t.price_credits} Credit/bulan</p>
                        {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.description}</p>}
                        {t.perks && <p className="text-[11px] text-gray-400 mt-0.5">{t.perks}</p>}
                      </div>
                      <ConfirmDialog title="Hapus Tier?" message={`Yakin ingin hapus tier "${t.name}"?`} confirmLabel="Hapus" variant="destructive" onConfirm={() => del.mutate(t.id)}>
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
              <p className="text-sm text-gray-400">Belum ada tier. Buat di samping →</p>
            </CardContent></Card>
          )}
        </div>

        {/* Right: Create form */}
        <Card className="h-fit">
          <CardContent className="p-5 space-y-3">
            <p className="font-bold text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Buat Tier Baru</p>
            <div><label className="text-sm font-medium mb-1.5 block">Nama Tier</label><Input placeholder="Bronze, Silver, Gold" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Harga (Credit/bulan)</label><Input type="number" placeholder="10" value={price} onChange={e => setPrice(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Deskripsi</label><Input placeholder="Deskripsi singkat" value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <Textarea placeholder="Perks (misal: Akses post eksklusif, Chat prioritas)" value={perks} onChange={e => setPerks(e.target.value)} className="min-h-[60px]" />
            <Button onClick={() => create.mutate()} disabled={!name || !price || create.isPending} className="w-full">
              {create.isPending ? "Membuat..." : "Buat Tier"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
