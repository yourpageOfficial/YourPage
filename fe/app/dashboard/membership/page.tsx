"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { Trash2, Plus, Users } from "lucide-react";

export default function MembershipPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [perks, setPerks] = useState("");

  const { data: tiers } = useQuery({
    queryKey: ["my-membership-tiers"],
    queryFn: async () => { const { data } = await api.get(`/membership-tiers/${user?.id}`); return data.data as any[]; },
    enabled: !!user,
  });

  const { data: members } = useQuery({
    queryKey: ["my-members"],
    queryFn: async () => { const { data } = await api.get("/memberships/creator"); return data.data as any[]; },
  });

  const create = useMutation({
    mutationFn: () => api.post("/membership-tiers", { name, price_credits: parseInt(price), description: desc || undefined, perks: perks || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-membership-tiers"] }); setName(""); setPrice(""); setDesc(""); setPerks(""); toast.success("Tier dibuat!"); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/membership-tiers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-membership-tiers"] }); toast.success("Tier dihapus"); },
  });

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Fan Membership</h1>

      <Card className="mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-base"><Users className="inline h-5 w-5 mr-1" /> Member Aktif: {members?.length || 0}</CardTitle></CardHeader>
      </Card>

      {/* Existing tiers */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Tier Membership</h2>
      <div className="space-y-2 mb-6">
        {tiers?.map((t: any) => (
          <Card key={t.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{t.name} — {t.price_credits} Credit/bulan</p>
                {t.description && <p className="text-sm text-gray-500 dark:text-gray-400">{t.description}</p>}
                {t.perks && <p className="text-xs text-gray-400 mt-1">{t.perks}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </CardContent>
          </Card>
        ))}
        {(!tiers || tiers.length === 0) && <p className="text-sm text-gray-400">Belum ada tier. Buat di bawah.</p>}
      </div>

      {/* Create new */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base"><Plus className="inline h-4 w-4 mr-1" /> Buat Tier Baru</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nama tier (misal: Bronze, Silver, Gold)" value={name} onChange={e => setName(e.target.value)} />
          <Input type="number" placeholder="Harga (Credit/bulan)" value={price} onChange={e => setPrice(e.target.value)} />
          <Input placeholder="Deskripsi singkat" value={desc} onChange={e => setDesc(e.target.value)} />
          <Textarea placeholder="Perks (misal: Akses post eksklusif, Chat prioritas, Shoutout)" value={perks} onChange={e => setPerks(e.target.value)} className="min-h-[60px]" />
          <Button onClick={() => create.mutate()} disabled={!name || !price || create.isPending}>
            {create.isPending ? "Membuat..." : "Buat Tier"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
