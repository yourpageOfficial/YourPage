"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { OverlayTier } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { Upload, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/internationalization";

const ANIMATIONS = [
  { id: "bounce" },
  { id: "slide" },
  { id: "fade" },
  { id: "spin" },
  { id: "drop" },
  { id: "pop" },
];

const POSITIONS = ["top-left", "top", "top-right", "center", "bottom-left", "bottom", "bottom-right"];

const FONTS = ["Outfit", "Rubik", "Inter", "Poppins", "Montserrat", "Bebas Neue", "Fredoka"];

/** Section heading — plain type, no decorative icon. */
function Section({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

export default function OverlaySettingsPage() {
  const { user } = useAuth();
  const { t, interpolate } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const soundRef = useRef<HTMLInputElement>(null);

  const animLabel: Record<string, string> = { bounce: t.accountMgr.animBounce, slide: t.accountMgr.animSlide, fade: t.accountMgr.animFade, spin: t.accountMgr.animSpin, drop: t.accountMgr.animDrop, pop: t.accountMgr.animPop };
  const animHint: Record<string, string> = { bounce: t.accountMgr.animBounceHint, slide: t.accountMgr.animSlideHint, fade: t.accountMgr.animFadeHint, spin: t.accountMgr.animSpinHint, drop: t.accountMgr.animDropHint, pop: t.accountMgr.animPopHint };
  const posLabel: Record<string, string> = { "top-left": t.accountMgr.posTopLeft, "top": t.accountMgr.posTop, "top-right": t.accountMgr.posTopRight, "center": t.accountMgr.posCenter, "bottom-left": t.accountMgr.posBottomLeft, "bottom": t.accountMgr.posBottom, "bottom-right": t.accountMgr.posBottomRight };

  const [minCredits, setMinCredits] = useState("1");
  const [label, setLabel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [soundFile, setSoundFile] = useState<File | null>(null);

  const { data: tiers } = useQuery({
    queryKey: ["overlay-tiers", user?.id],
    queryFn: async () => { const { data } = await api.get(`/overlay-tiers/${user?.id}`); return (data.data || []) as OverlayTier[]; },
    enabled: !!user,
  });

  const { data: config } = useQuery({
    queryKey: ["overlay-config", user?.id],
    queryFn: async () => { const { data } = await api.get(`/overlay/${user?.id}/config`); return data.data; },
    enabled: !!user,
  });

  const [style, setStyle] = useState("bounce");
  const [textTemplate, setTextTemplate] = useState("{donor} donated {amount} Credit!");
  const [accent, setAccent] = useState("#EC4899");
  const [textColor, setTextColor] = useState("#0F0D1A");
  const [font, setFont] = useState("Outfit");
  const [duration, setDuration] = useState(8);
  const [position, setPosition] = useState("center");
  const [volume, setVolume] = useState(80);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsMin, setTtsMin] = useState(1);

  useEffect(() => {
    if (!config) return;
    setStyle(config.overlay_style ?? "bounce");
    setTextTemplate(config.overlay_text_template ?? "{donor} donated {amount} Credit!");
    setAccent(config.overlay_accent_color ?? "#EC4899");
    setTextColor(config.overlay_text_color ?? "#0F0D1A");
    setFont(config.overlay_font ?? "Outfit");
    setDuration(Math.round((config.overlay_duration_ms ?? 8000) / 1000));
    setPosition(config.overlay_position ?? "center");
    setVolume(config.overlay_sound_volume ?? 80);
    setTtsEnabled(config.overlay_tts_enabled ?? true);
    setTtsMin(config.overlay_tts_min_credits ?? 1);
  }, [config]);

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data.data.url as string;
  };

  const addTier = useMutation({
    mutationFn: async () => {
      const imageUrl = imageFile ? await uploadFile(imageFile) : "";
      const soundUrl = soundFile ? await uploadFile(soundFile) : null;
      await api.post("/overlay-tiers", {
        min_credits: parseInt(minCredits),
        image_url: imageUrl,
        sound_url: soundUrl,
        label: label || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overlay-tiers"] });
      setMinCredits("1"); setLabel(""); setImageFile(null); setImagePreview(""); setSoundFile(null);
      toast.success(t.accountMgr.overlayTierAdded);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || t.accountMgr.overlayTierAddFailed),
  });

  const deleteTier = useMutation({
    mutationFn: (id: string) => api.delete(`/overlay-tiers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["overlay-tiers"] }); toast.success(t.accountMgr.overlayTierDeleted); },
  });

  const saveSettings = useMutation({
    mutationFn: () => api.put("/overlay/settings", {
      overlay_style: style,
      overlay_text_template: textTemplate,
      overlay_accent_color: accent,
      overlay_text_color: textColor,
      overlay_font: font,
      overlay_duration_ms: duration * 1000,
      overlay_position: position,
      overlay_sound_volume: volume,
      overlay_tts_enabled: ttsEnabled,
      overlay_tts_min_credits: ttsMin,
    }),
    onSuccess: () => { toast.success(t.accountMgr.overlaySettingsSaved); qc.invalidateQueries({ queryKey: ["overlay-config"] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || t.accountMgr.overlaySettingsFailed),
  });

  const testAlert = useMutation({
    mutationFn: () => api.post("/overlay/test", { credits: 250, message: "Ini contoh pesan donasi." }),
    onSuccess: () => toast.success(t.accountMgr.overlayTestSent),
    onError: () => toast.error(t.accountMgr.overlayTestFailed),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const urls = [
    { name: t.accountMgr.overlayDonationAlert, url: `${origin}/overlay?id=${user?.id}`, size: "800 × 400" },
    { name: t.accountMgr.overlayDonationGoal, url: `${origin}/overlay/goal?id=${user?.id}`, size: "500 × 140" },
  ];

  const copy = (url: string) => { navigator.clipboard.writeText(url); toast.success(t.accountMgr.overlayUrlCopied); };
  const preview = textTemplate.replace("{donor}", "SuperFan").replace("{amount}", "250");

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-black tracking-tight">{t.accountMgr.overlayTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t.accountMgr.overlaySubtitle}
        </p>
      </div>

      {/* Browser source URLs */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <Section title={t.accountMgr.overlayBrowserSourceUrl} description={t.accountMgr.overlayBrowserSourceDesc} />
          <div className="space-y-3">
            {urls.map((u) => (
              <div key={u.name} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="w-full sm:w-40 shrink-0">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{u.size} px</p>
                </div>
                <Input readOnly value={u.url} className="font-mono text-xs" />
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => copy(u.url)}>{t.accountMgr.overlayCopy}</Button>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 dark:border-navy-800 pt-4">
            <Button variant="outline" onClick={() => testAlert.mutate()} disabled={testAlert.isPending}>
              {testAlert.isPending ? t.accountMgr.overlaySending : t.accountMgr.overlayTestAlert}
            </Button>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {t.accountMgr.overlayTestDesc}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardContent className="p-5">
            <Section title={t.accountMgr.overlayAppearanceTitle} description={t.accountMgr.overlayAppearanceDesc} />
            <div className="space-y-5">
              <Field label={t.accountMgr.overlayAnimationLabel}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ANIMATIONS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setStyle(a.id)}
                      aria-pressed={style === a.id}
                      title={animHint[a.id]}
                      className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                        style === a.id
                          ? "border-primary bg-primary-50/60 dark:bg-primary-900/20"
                          : "border-gray-200 hover:border-primary-200 dark:border-navy-800"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{animLabel[a.id]}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={t.accountMgr.overlayPositionLabel}>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      aria-pressed={position === p}
                      className={`cursor-pointer rounded-lg border-2 px-2 py-2 text-xs font-medium transition-colors ${
                        position === p
                          ? "border-primary bg-primary-50/60 dark:bg-primary-900/20"
                          : "border-gray-200 hover:border-primary-200 dark:border-navy-800"
                      }`}
                    >
                      {posLabel[p]}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.accountMgr.overlayAccentColor}>
                  <div className="flex items-center gap-2">
                    <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 bg-transparent dark:border-navy-800" aria-label={t.accountMgr.overlayAccentColor} />
                    <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="font-mono text-xs" />
                  </div>
                </Field>
                <Field label={t.accountMgr.overlayTextColor}>
                  <div className="flex items-center gap-2">
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 bg-transparent dark:border-navy-800" aria-label={t.accountMgr.overlayTextColor} />
                    <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.accountMgr.overlayFont}>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-navy-800 dark:bg-navy-900"
                  >
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label={interpolate(t.accountMgr.overlayDurationLabel, { value: duration })}>
                  <input
                    type="range" min={2} max={30} value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="mt-3 w-full accent-primary"
                    aria-label={t.accountMgr.overlayDurationAria}
                  />
                </Field>
              </div>

              <Field label={t.accountMgr.overlayAlertTextLabel} hint={t.accountMgr.overlayAlertTextHint}>
                <Input value={textTemplate} onChange={(e) => setTextTemplate(e.target.value)} maxLength={120} />
              </Field>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-navy-800 dark:bg-navy-900/60">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t.accountMgr.overlayPreview}</p>
                <p className="text-sm font-semibold" style={{ color: accent, fontFamily: `${font}, sans-serif` }}>{preview}</p>
                <p className="text-2xl font-black tabular-nums" style={{ color: textColor, fontFamily: `${font}, sans-serif` }}>250 Credit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sound + tiers */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <Section title={t.accountMgr.overlaySoundTitle} description={t.accountMgr.overlaySoundDesc} />
              <div className="space-y-5">
                <Field label={interpolate(t.accountMgr.overlayVolumeLabel, { value: volume })}>
                  <input
                    type="range" min={0} max={100} value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="mt-3 w-full accent-primary"
                    aria-label={t.accountMgr.overlayVolumeAria}
                  />
                </Field>

                <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-navy-800">
                  <div>
                    <p className="text-sm font-medium">{t.accountMgr.overlayReadMessage}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {t.accountMgr.overlayReadMessageDesc}
                    </p>
                  </div>
                  <Switch checked={ttsEnabled} onCheckedChange={setTtsEnabled} aria-label={t.accountMgr.overlayTtsAria} />
                </div>

                {ttsEnabled && (
                  <Field label={t.accountMgr.overlayTtsMinLabel} hint={t.accountMgr.overlayTtsMinHint}>
                    <Input type="number" min={1} value={ttsMin} onChange={(e) => setTtsMin(Math.max(1, parseInt(e.target.value) || 1))} />
                  </Field>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <Section title={t.accountMgr.overlayTierTitle} description={t.accountMgr.overlayTierDesc} />

              <div className="space-y-2">
                {tiers?.map((tier: any) => (
                  <div key={tier.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-navy-800">
                    {tier.image_url ? (
                      <img loading="lazy" src={tier.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-navy-800">—</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold tabular-nums">≥ {tier.min_credits} Credit</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {tier.label || t.accountMgr.overlayNoLabel}{tier.sound_url ? ` · ${t.accountMgr.overlayHasSound}` : ` · ${t.accountMgr.overlayNoSound}`}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={interpolate(t.accountMgr.overlayDeleteTier, { min: tier.min_credits })} onClick={() => deleteTier.mutate(tier.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {(!tiers || tiers.length === 0) && (
                  <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-navy-800 dark:text-gray-400">
                    {t.accountMgr.overlayEmptyTiers}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-4 border-t border-gray-100 pt-5 dark:border-navy-800">
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.accountMgr.overlayMinCredits}>
                    <Input type="number" min={1} value={minCredits} onChange={(e) => setMinCredits(e.target.value)} />
                  </Field>
                  <Field label={t.accountMgr.overlayLabel}>
                    <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t.accountMgr.overlayLabelPlaceholder} />
                  </Field>
                </div>

                <input ref={fileRef} type="file" accept="image/*,.gif" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                }} />
                <input ref={soundRef} type="file" accept="audio/*" className="hidden" onChange={(e) => setSoundFile(e.target.files?.[0] || null)} />

                <div className="flex flex-wrap items-center gap-3">
                  {imagePreview && <img loading="lazy" src={imagePreview} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-1.5 h-4 w-4" />{imageFile ? t.accountMgr.overlayChangeImage : t.accountMgr.overlaySelectImage}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => soundRef.current?.click()}>
                    {soundFile ? `${t.accountMgr.overlaySelectSound}: ${soundFile.name.slice(0, 18)}` : t.accountMgr.overlaySelectSound}
                  </Button>
                </div>

                <Button className="w-full" onClick={() => addTier.mutate()} disabled={!minCredits || addTier.isPending}>
                  {addTier.isPending ? t.accountMgr.overlayUploading : t.accountMgr.overlayAddTier}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <Button size="lg" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} className="shadow-elevated">
          {saveSettings.isPending ? t.accountMgr.overlaySaving : t.accountMgr.overlaySaveSettings}
        </Button>
      </div>
    </div>
  );
}
