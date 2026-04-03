"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { Upload, Trash2, Plus } from "lucide-react";

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
    queryFn: async () => { const { data } = await api.get(`/overlay-tiers/${user?.id}`); return (data.data || []) as any[]; },
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

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Pengaturan Overlay</h1>

      {/* Animation + Text */}
      <Card className="mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-base">🎬 Animasi & Teks</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Animasi</label>
            <div className="flex gap-2 mt-1">
              {[{ id: "bounce", l: "⬆️ Bounce" }, { id: "slide", l: "➡️ Slide" }, { id: "fade", l: "✨ Fade" }, { id: "spin", l: "🔄 Spin" }].map(a => (
                <Button key={a.id} size="sm" variant={overlayStyle === a.id ? "default" : "outline"} onClick={() => setOverlayStyle(a.id)} className="text-xs">{a.l}</Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Template teks (gunakan {"{donor}"} dan {"{amount}"})</label>
            <Input value={textTemplate} onChange={e => setTextTemplate(e.target.value)} placeholder="{donor} donated {amount} Credit!" />
            <p className="text-xs text-gray-400 mt-1">Preview: {textTemplate.replace("{donor}", "SuperFan").replace("{amount}", "50")}</p>
          </div>
          <Button size="sm" onClick={() => saveSettings.mutate()}>Simpan</Button>
        </CardContent>
      </Card>

      {/* Tier GIFs */}
      <Card className="mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-base">🖼️ Gambar/GIF per Tier Donasi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Upload gambar/GIF berbeda berdasarkan jumlah donasi. Gambar yang cocok akan tampil di overlay.</p>

          {/* Existing tiers */}
          <div className="space-y-2">
            {tiers?.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                {t.image_url ? (
                  <img src={t.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs">No img</div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">≥ {t.min_credits} Credit</p>
                  {t.label && <p className="text-xs text-gray-500 dark:text-gray-400">{t.label}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteTier.mutate(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}
            {(!tiers || tiers.length === 0) && <p className="text-xs text-gray-400">Belum ada tier. Tambahkan di bawah.</p>}
          </div>

          {/* Add new */}
          <div className="border-t dark:border-gray-700 pt-3 space-y-3">
            <p className="text-sm font-medium flex items-center gap-1"><Plus className="h-4 w-4" /> Tambah Tier</p>
            <div className="flex gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Min Credit</label>
                <Input type="number" value={minCredits} onChange={e => setMinCredits(e.target.value)} className="w-24" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Label (opsional)</label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Contoh: Super Donatur" />
              </div>
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*,.gif" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
              }} />
              {imagePreview ? (
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="" className="h-16 w-16 rounded object-cover" />
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Ganti</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-4 w-4" /> Upload GIF/Gambar</Button>
              )}
            </div>
            <Button size="sm" onClick={() => addTier.mutate()} disabled={!minCredits || addTier.isPending}>
              {addTier.isPending ? "Uploading..." : "Tambah Tier"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overlay URL */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">📺 URL Overlay (OBS)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input readOnly value={typeof window !== "undefined" ? `${window.location.origin}/overlay?id=${user?.id}&style=${overlayStyle}` : ""} className="text-xs" />
            <Button size="sm" variant="outline" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/overlay?id=${user?.id}&style=${overlayStyle}`);
              toast.success("Disalin!");
            }}>Copy</Button>
          </div>
          <p className="text-xs text-gray-400">OBS → Browser Source → 800×300px</p>
        </CardContent>
      </Card>
    </div>
  );
}
