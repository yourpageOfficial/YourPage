"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/internationalization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordCard } from "@/components/change-password";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Upload, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function EditProfile() {
  const { user, fetchMe } = useAuth();
  const { t, interpolate } = useTranslation();
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
  const [socialIG, setSocialIG] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialYT, setSocialYT] = useState("");
  const [confirmDeleteBanner, setConfirmDeleteBanner] = useState(false);
  const [category, setCategory] = useState("");

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: async () => { try { const { data } = await api.get("/creator/earnings"); return data.data; } catch { return {}; } },
  });
  const isPro = earnings?.tier_name === "Pro" || earnings?.tier_name === "Business";
  const categories = ["Gaming", "Musik", "Edukasi", "Podcast", "Seni", "Teknologi", "Lifestyle", "Lainnya"] as const;

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setBio(user.bio || "");
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  useEffect(() => {
    if (earnings) {
      if (earnings.page_color) setPageColor(earnings.page_color);
      if (earnings.header_image) setBannerPreview(earnings.header_image);
      if (earnings.category) setCategory(earnings.category);
      if (earnings.social_links) {
        setSocialIG(earnings.social_links.instagram || "");
        setSocialX(earnings.social_links.x || "");
        setSocialTiktok(earnings.social_links.tiktok || "");
        setSocialYT(earnings.social_links.youtube || "");
      }
    }
  }, [earnings]);

  const save = useMutation({
    mutationFn: async () => {
      let avatarUrl = user?.avatar_url;
      if (avatarFile) {
        const fd = new FormData(); fd.append("file", avatarFile);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        avatarUrl = data.data.url;
      }
      let bannerUrl = bannerPreview;
      if (bannerFile) {
        const fd = new FormData(); fd.append("file", bannerFile);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        bannerUrl = data.data.url;
      }
      await api.put("/auth/me", {
        display_name: displayName, bio, avatar_url: avatarUrl,
        header_image: bannerUrl || "",
        page_color: isPro ? pageColor : undefined,
        social_links: { instagram: socialIG, x: socialX, tiktok: socialTiktok, youtube: socialYT },
        category: category || undefined,
      });
    },
    onSuccess: () => { toast.success(t.dashboardCore.profileSaved); fetchMe(); qc.invalidateQueries({ queryKey: ["creator-earnings"] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || t.dashboardCore.saveFailed),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-black tracking-tight">{t.nav.profile}</h1>
        <Link href={`/c/${user?.username}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" /> {t.dashboardCore.viewPublicPage}</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {/* Banner + Avatar */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t.dashboardCore.bannerAvatarTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); } }} />
              <div className="relative cursor-pointer group rounded-xl overflow-hidden" onClick={() => bannerRef.current?.click()}>
                {bannerPreview ? (
                  <img loading="lazy" src={bannerPreview} alt="" className="h-32 sm:h-40 w-full object-cover" />
                ) : (
                  <div className="h-32 sm:h-40 w-full bg-primary-50 dark:bg-navy-800 flex items-center justify-center">
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <Upload className="mx-auto h-8 w-8 mb-1" />
                      <p className="text-xs">{t.dashboardCore.uploadBanner}</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{t.dashboardCore.changeBanner}</span>
                </div>
              </div>
              {bannerPreview && (
                <>
                  <button onClick={() => setConfirmDeleteBanner(true)} className="text-xs text-red-500 mt-1 hover:underline">{t.dashboardCore.deleteBanner}</button>
                  <ConfirmDialog open={confirmDeleteBanner} onClose={() => setConfirmDeleteBanner(false)}
                    onConfirm={() => { setBannerFile(null); setBannerPreview(null); setConfirmDeleteBanner(false); }}
                    title={t.dashboardCore.deleteBannerTitle} description={t.dashboardCore.deleteBannerDesc} confirmText={t.common.delete} variant="destructive" />
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
              {avatarPreview ? (
                <img loading="lazy" src={avatarPreview} alt="" className="h-20 w-20 rounded-full object-cover cursor-pointer border-2 shrink-0" onClick={() => avatarRef.current?.click()} />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary cursor-pointer shrink-0" onClick={() => avatarRef.current?.click()}>
                  {displayName?.[0] || "?"}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> {t.dashboardCore.changeAvatar}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t.dashboardCore.infoTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t.dashboardCore.bioLabel}</label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)}
                placeholder={t.dashboardCore.bioPlaceholder} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{interpolate(t.dashboardCore.charCount, { count: bio.length })}</p>
            </div>
            <div>
              <label className="text-sm font-medium">{t.dashboardCore.categoryLabel}</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {categories.map(c => (
                  <button key={c} type="button" onClick={() => setCategory(category === c ? "" : c)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${category === c ? "bg-primary text-white" : "bg-primary-50 dark:bg-navy-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-navy-700"}`}>{t.explore.categories[c as keyof typeof t.explore.categories]}</button>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{t.dashboardCore.categoryHint}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input value={user?.username || ""} disabled className="bg-primary-50/50 dark:bg-navy-800" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{interpolate(t.dashboardCore.usernameHint, { username: user?.username || "" })}</p>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🔗 Social Media</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Instagram</label>
                <Input value={socialIG} onChange={e => setSocialIG(e.target.value)} placeholder="@username" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">X (Twitter)</label>
                <Input value={socialX} onChange={e => setSocialX(e.target.value)} placeholder="@username" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">TikTok</label>
                <Input value={socialTiktok} onChange={e => setSocialTiktok(e.target.value)} placeholder="@username" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">YouTube</label>
                <Input value={socialYT} onChange={e => setSocialYT(e.target.value)} placeholder="Channel URL" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Color (Pro+) */}
        {isPro && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t.dashboardCore.customizeTitle} <Badge variant="outline" className="text-xs ml-2">Pro</Badge></CardTitle></CardHeader>
          <CardContent>
              <label className="text-sm font-medium mb-1.5 block">{t.dashboardCore.pageAccentColor}</label>
              <div className="flex items-center gap-3 mt-1">
                <input type="color" value={pageColor} onChange={e => setPageColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border-0" />
                <div className="flex gap-1">
                  {["#2563EB","#EC4899","#10B981","#F59E0B","#8B5CF6","#EF4444"].map(c => (
                    <button key={c} onClick={() => setPageColor(c)} className={`h-6 w-6 rounded-full border-2 ${pageColor === c ? "border-gray-900 dark:border-white" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{pageColor}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={() => save.mutate()} disabled={save.isPending || !displayName} className="w-full sm:w-auto">
          {save.isPending ? t.dashboardCore.saving : t.dashboardCore.saveProfile}
        </Button>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
