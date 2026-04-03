"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ChangePasswordCard } from "@/components/change-password";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";

export default function EditProfile() {
  const { user, fetchMe } = useAuth();
  const qc = useQueryClient();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [pageColor, setPageColor] = useState("#2563EB");
  const [chatPrice, setChatPrice] = useState("");
  const [autoReply, setAutoReply] = useState("");

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });
  const isPro = earnings?.tier_name === "Pro" || earnings?.tier_name === "Business";
  const isBusiness = earnings?.tier_name === "Business";

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setBio(user.bio || "");
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  useEffect(() => {
    if (earnings?.page_color) setPageColor(earnings.page_color);
    if (earnings?.header_image) setBannerPreview(earnings.header_image);
    if (earnings?.chat_price_idr) setChatPrice(String(earnings.chat_price_idr / 1000));
    if (earnings?.auto_reply) setAutoReply(earnings.auto_reply);
  }, [earnings]);

  const save = useMutation({
    mutationFn: async () => {
      let avatarUrl = user?.avatar_url;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        avatarUrl = data.data.url;
      }
      let bannerUrl = bannerPreview;
      if (bannerFile) {
        const fd = new FormData();
        fd.append("file", bannerFile);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        bannerUrl = data.data.url;
      }
      await api.put("/auth/me", {
        display_name: displayName, bio, avatar_url: avatarUrl,
        header_image: bannerUrl || undefined,
        page_color: isPro ? pageColor : undefined,
        chat_price_idr: isPro && chatPrice ? parseInt(chatPrice) * 1000 : 0,
        auto_reply: isBusiness ? autoReply || undefined : undefined,
      });
    },
    onSuccess: () => { toast.success("Profil berhasil disimpan!"); fetchMe(); },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menyimpan"),
  });

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };
  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
  };

  return (
    <div>
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">Profil</h1>
      <div className="space-y-4">
        <CollapsibleCard title="👤 Informasi Profil" defaultOpen>
          <div className="space-y-4">
            {/* Banner */}
            <div>
              <label className="text-sm font-medium">Banner</label>
              <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
              <div className="mt-1 relative cursor-pointer group" onClick={() => bannerRef.current?.click()}>
                {bannerPreview ? (
                  <img src={bannerPreview} alt="" className="h-32 sm:h-40 w-full rounded-lg object-cover" />
                ) : (
                  <div className="h-32 sm:h-40 w-full rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <Upload className="mx-auto h-8 w-8 mb-1" />
                      <p className="text-xs">Klik untuk upload banner</p>
                      <p className="text-[10px]">Rekomendasi: 1500×400px</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Ganti Banner</span>
                </div>
              </div>
              {bannerPreview && (
                <button onClick={(e) => { e.stopPropagation(); setBannerFile(null); setBannerPreview(null); }} className="text-xs text-red-500 mt-1 hover:underline">Hapus banner</button>
              )}
            </div>

            {/* Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-20 w-20 rounded-full object-cover cursor-pointer border-2 shrink-0" onClick={() => avatarRef.current?.click()} />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary cursor-pointer shrink-0" onClick={() => avatarRef.current?.click()}>
                  {displayName?.[0] || "?"}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> Ganti Avatar
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Ceritakan tentang kamu..." />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input value={user?.username || ""} disabled className="bg-gray-50 dark:bg-gray-800" />
              <p className="text-xs text-gray-400 mt-1">Username tidak bisa diubah</p>
            </div>
            {isPro && (
              <div>
                <label className="text-sm font-medium">Warna Halaman</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={pageColor} onChange={(e) => setPageColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{pageColor}</span>
                  <Badge variant="outline" className="text-xs">Pro</Badge>
                </div>
              </div>
            )}
            {/* Chat Settings (Pro+) */}
            {isPro && (
              <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                <p className="text-sm font-medium">💬 Pengaturan Chat</p>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Harga per chat (Credit, 0 = gratis)</label>
                  <Input type="number" value={chatPrice} onChange={e => setChatPrice(e.target.value)} placeholder="0" className="w-40" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{chatPrice && parseInt(chatPrice) > 0 ? `Supporter bayar ${chatPrice} Credit per pesan. Fee sesuai tier kamu (${earnings?.fee_percent ?? 20}%).` : "Chat gratis untuk semua supporter"}</p>
                </div>
                {isBusiness && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Auto-reply <Badge variant="outline" className="text-[10px] ml-1">Business</Badge></label>
                    <Input value={autoReply} onChange={e => setAutoReply(e.target.value)} placeholder="Contoh: Terima kasih! Saya akan balas segera." />
                  </div>
                )}
              </div>
            )}
            <Button onClick={() => save.mutate()} disabled={save.isPending || !displayName}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </CollapsibleCard>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
