"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { OverlayTier } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { Upload, Trash2, Plus, Monitor, Sparkles, Copy, Play } from "lucide-react";

export default function OverlaySettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [minCredits, setMinCredits] = useState("1");
  const [label, setLabel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const { data: tiers } = useQuery({
    queryKey: ["overlay-tiers"],
    queryFn: async () => { const { data } = await api.get(`/overlay-tiers/${user?.id}`); return (data.data || []) as OverlayTier[]; },
    enabled: !!user,
  });

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });

  const [textTemplate, setTextTemplate] = useState("{donor} donated {amount} Credit!");
  const [overlayStyle, setOverlayStyle] = useState("bounce");

  useEffect(() => {
    if (earnings?.overlay_style) setOverlayStyle(earnings.overlay_style);
    if (earnings?.overlay_text_template) setTextTemplate(earnings.overlay_text_template);
  }, [earnings]);

  const addTier = useMutation({
    mutationFn: async () => {
      let imageUrl = "";
      if (imageFile) {
        const fd = new FormData(); fd.append("file", imageFile);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        imageUrl = data.data.url;
      }
      await api.post("/overlay-tiers", { min_credits: parseInt(minCredits), image_url: imageUrl, label: label || null });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overlay-tiers"] }); setMinCredits("1"); setLabel(""); setImageFile(null); setImagePreview(""); toast.success("Tier ditambahkan!"); },
    onError: (e: any) => toast.error(e.response?.data?.error || "Gagal"),
  });

  const deleteTier = useMutation({
    mutationFn: (id: string) => api.delete(`/overlay-tiers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overlay-tiers"] }); toast.success("Tier dihapus"); },
  });

  const saveSettings = useMutation({
    mutationFn: () => api.put("/auth/me", { overlay_style: overlayStyle, overlay_text_template: textTemplate }),
    onSuccess: () => { toast.success("Pengaturan disimpan!"); qc.invalidateQueries({ queryKey: ["creator-earnings"] }); },
  });

  const overlayUrl = typeof window !== "undefined" ? `${window.location.origin}/overlay?id=${user?.id}&style=${overlayStyle}` : "";

  const animations = [
    { id: "bounce", label: "Bounce", icon: "⬆️" },
    { id: "slide", label: "Slide", icon: "➡️" },
    { id: "fade", label: "Fade", icon: "✨" },
    { id: "spin", label: "Spin", icon: "🔄" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-black tracking-tight mb-6">Overlay OBS</h1>

      {/* OBS URL — prominent at top */}
      <Card className="mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 border-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">URL Overlay</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">OBS → Browser Source → 800×300px</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={overlayUrl} className="text-xs font-mono bg-white dark:bg-navy-800" />
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => { navigator.clipboard.writeText(overlayUrl); toast.success("Disalin!"); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Animation & Text */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="font-bold text-sm flex items-center gap-2"><Play className="h-4 w-4 text-primary" /> Animasi</p>
              <div className="grid grid-cols-2 gap-2">
                {animations.map(a => (
                  <button key={a.id} onClick={() => setOverlayStyle(a.id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${overlayStyle === a.id ? "border-primary bg-primary/5" : "border-primary-100 dark:border-primary-900/30 hover:border-primary/30"}`}>
                    <span className="text-xl">{a.icon}</span>
                    <p className="text-xs font-bold mt-1">{a.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="font-bold text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Template Teks</p>
              <Input value={textTemplate} onChange={e => setTextTemplate(e.target.value)} placeholder="{donor} donated {amount} Credit!" />
              <div className="bg-primary-50/50 dark:bg-navy-800 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-500">Preview: <span className="font-medium text-gray-700 dark:text-gray-300">{textTemplate.replace("{donor}", "SuperFan").replace("{amount}", "50")}</span></p>
              </div>
              <Button size="sm" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>Simpan</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Tier GIFs */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="font-bold text-sm">🖼️ Gambar/GIF per Tier</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Upload gambar berbeda berdasarkan jumlah donasi.</p>

            {/* Existing tiers */}
            <div className="space-y-2">
              {tiers?.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-primary-50/50 dark:bg-navy-800">
                  {t.image_url ? (
                    <img loading="lazy" src={t.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-navy-800 flex items-center justify-center text-gray-400 text-xs">—</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">≥ {t.min_credits} Credit</p>
                    {t.label && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.label}</p>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteTier.mutate(t.id)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                </div>
              ))}
              {(!tiers || tiers.length === 0) && <p className="text-xs text-gray-400 text-center py-4">Belum ada tier</p>}
            </div>

            {/* Add new */}
            <div className="border-t border-primary-100 dark:border-primary-900/30 pt-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Plus className="h-3 w-3" /> Tambah Tier</p>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-medium mb-1 block">Min Credit</label><Input type="number" value={minCredits} onChange={e => setMinCredits(e.target.value)} /></div>
                <div><label className="text-[11px] font-medium mb-1 block">Label</label><Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Super Donatur" /></div>
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*,.gif" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                }} />
                {imagePreview ? (
                  <div className="flex items-center gap-3">
                    <img loading="lazy" src={imagePreview} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-xl">Ganti</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-xl"><Upload className="mr-1 h-4 w-4" /> Upload GIF</Button>
                )}
              </div>
              <Button size="sm" onClick={() => addTier.mutate()} disabled={!minCredits || addTier.isPending} className="w-full">
                {addTier.isPending ? "Uploading..." : "Tambah Tier"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
