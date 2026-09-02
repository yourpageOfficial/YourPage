"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Alert = {
  type: string;
  id: string;
  donor_name: string;
  credits: number;
  amount_idr: number;
  message?: string;
  media_url?: string;
};

type Tier = {
  min_credits: number;
  image_url: string;
  sound_url?: string | null;
  label?: string | null;
};

type Config = {
  tiers: Tier[];
  overlay_style: string;
  overlay_text_template: string;
  overlay_accent_color: string;
  overlay_text_color: string;
  overlay_font: string;
  overlay_duration_ms: number;
  overlay_position: string;
  overlay_sound_volume: number;
  overlay_tts_enabled: boolean;
  overlay_tts_min_credits: number;
};

const DEFAULTS: Config = {
  tiers: [],
  overlay_style: "bounce",
  overlay_text_template: "{donor} donated {amount} Credit!",
  overlay_accent_color: "#EC4899",
  overlay_text_color: "#0F0D1A",
  overlay_font: "Outfit",
  overlay_duration_ms: 8000,
  overlay_position: "center",
  overlay_sound_volume: 80,
  overlay_tts_enabled: true,
  overlay_tts_min_credits: 1,
};

const ANIMATIONS: Record<string, string> = {
  bounce: `@keyframes alertIn{0%{transform:scale(0) translateY(60px);opacity:0}55%{transform:scale(1.08) translateY(-12px);opacity:1}100%{transform:scale(1) translateY(0);opacity:1}}`,
  slide: `@keyframes alertIn{0%{transform:translateX(120%);opacity:0}100%{transform:translateX(0);opacity:1}}`,
  fade: `@keyframes alertIn{0%{opacity:0;transform:scale(0.85)}100%{opacity:1;transform:scale(1)}}`,
  spin: `@keyframes alertIn{0%{transform:rotate(-200deg) scale(0);opacity:0}100%{transform:rotate(0) scale(1);opacity:1}}`,
  drop: `@keyframes alertIn{0%{transform:translateY(-120%) rotate(-6deg);opacity:0}70%{transform:translateY(8px) rotate(2deg);opacity:1}100%{transform:translateY(0) rotate(0);opacity:1}}`,
  pop: `@keyframes alertIn{0%{transform:scale(0.2);opacity:0}40%{transform:scale(1.15);opacity:1}70%{transform:scale(0.95)}100%{transform:scale(1)}}`,
};

const POSITIONS: Record<string, React.CSSProperties> = {
  center: { alignItems: "center", justifyContent: "center" },
  top: { alignItems: "center", justifyContent: "flex-start", paddingTop: 48 },
  bottom: { alignItems: "center", justifyContent: "flex-end", paddingBottom: 48 },
  "top-left": { alignItems: "flex-start", justifyContent: "flex-start", padding: 48 },
  "top-right": { alignItems: "flex-end", justifyContent: "flex-start", padding: 48 },
  "bottom-left": { alignItems: "flex-start", justifyContent: "flex-end", padding: 48 },
  "bottom-right": { alignItems: "flex-end", justifyContent: "flex-end", padding: 48 },
};

function tierFor(tiers: Tier[], credits: number): Tier | undefined {
  return [...tiers].sort((a, b) => b.min_credits - a.min_credits).find((t) => credits >= t.min_credits);
}

function OverlayContent() {
  const sp = useSearchParams();
  const creatorId = sp.get("id");

  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [current, setCurrent] = useState<Alert | null>(null);

  // Alerts arriving while one is on screen must wait their turn, never
  // overwrite each other — a burst of donations should all be shown.
  const queue = useRef<Alert[]>([]);
  const showing = useRef(false);
  const seen = useRef<Set<string>>(new Set());
  const configRef = useRef<Config>(DEFAULTS);
  const playNextRef = useRef<() => void>(() => {});

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!creatorId) return;
    fetch(`/api/v1/overlay/${creatorId}/config`)
      .then((r) => r.json())
      .then((d) => d?.data && setConfig({ ...DEFAULTS, ...d.data, tiers: d.data.tiers || [] }))
      .catch(() => {});
  }, [creatorId]);

  const speak = useCallback((alert: Alert, cfg: Config) => {
    if (!cfg.overlay_tts_enabled || alert.credits < cfg.overlay_tts_min_credits) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const parts = [`${alert.donor_name} berdonasi ${alert.credits} credit`];
    if (alert.message) parts.push(alert.message);
    const utter = new SpeechSynthesisUtterance(parts.join(". "));
    utter.lang = "id-ID";
    utter.volume = Math.min(1, Math.max(0, cfg.overlay_sound_volume / 100));
    window.speechSynthesis.speak(utter);
  }, []);

  const playNext = useCallback(() => {
    const next = queue.current.shift();
    if (!next) {
      showing.current = false;
      return;
    }
    showing.current = true;
    const cfg = configRef.current;
    setCurrent(next);

    const tier = tierFor(cfg.tiers, next.credits);
    if (tier?.sound_url) {
      const audio = new Audio(tier.sound_url);
      audio.volume = Math.min(1, Math.max(0, cfg.overlay_sound_volume / 100));
      // Autoplay can be blocked; the visual alert must still run.
      audio.play().catch(() => {});
    }
    speak(next, cfg);

    window.setTimeout(() => {
      setCurrent(null);
      // Small gap so consecutive alerts read as separate events.
      window.setTimeout(() => playNextRef.current(), 400);
    }, cfg.overlay_duration_ms);
  }, [speak]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const enqueue = useCallback(
    (alert: Alert) => {
      if (seen.current.has(alert.id)) return;
      seen.current.add(alert.id);
      queue.current.push(alert);
      if (!showing.current) playNext();
    },
    [playNext]
  );

  // Live alerts over SSE. EventSource reconnects on its own, which matters for
  // an overlay that may sit open for an entire stream.
  useEffect(() => {
    if (!creatorId) return;
    const es = new EventSource(`/api/v1/overlay/${creatorId}/stream`);
    es.addEventListener("alert", (e) => {
      try {
        enqueue(JSON.parse((e as MessageEvent).data));
      } catch {
        /* ignore malformed frame */
      }
    });
    return () => es.close();
  }, [creatorId, enqueue]);

  if (!creatorId) {
    return (
      <div style={{ fontFamily: "system-ui", padding: 24, color: "#fff", background: "#0F0D1A", minHeight: "100vh" }}>
        <p style={{ fontWeight: 700, fontSize: 18 }}>Overlay URL tidak lengkap</p>
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          Tambahkan <code>?id=&lt;creator-id&gt;</code>. Salin URL lengkapnya dari Dashboard → Overlay.
        </p>
      </div>
    );
  }

  const css = `${ANIMATIONS[config.overlay_style] || ANIMATIONS.bounce}
    @keyframes alertOut{to{opacity:0;transform:scale(0.92)}}
    html,body{background:transparent!important;margin:0;overflow:hidden}
    @media (prefers-reduced-motion: reduce){.yp-alert{animation:none!important}}`;

  if (!current) {
    return (
      <>
        <div style={{ background: "transparent" }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </>
    );
  }

  const tier = tierFor(config.tiers, current.credits);
  const text = config.overlay_text_template
    .replace("{donor}", current.donor_name || "Anonim")
    .replace("{amount}", String(current.credits));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
        background: "transparent",
        fontFamily: `${config.overlay_font}, system-ui, sans-serif`,
        ...(POSITIONS[config.overlay_position] || POSITIONS.center),
      }}
    >
      <div className="yp-alert" style={{ animation: "alertIn 0.7s cubic-bezier(0.34,1.56,0.64,1)", textAlign: "center", maxWidth: 620 }}>
        {tier?.image_url && (
          <img
            src={tier.image_url}
            alt=""
            style={{ width: 148, height: 148, objectFit: "contain", margin: "0 auto 10px", display: "block", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.35))" }}
          />
        )}

        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: 22,
            padding: "20px 34px",
            boxShadow: `0 18px 50px rgba(0,0,0,0.28), 0 0 0 4px ${config.overlay_accent_color}`,
            display: "inline-block",
          }}
        >
          {tier?.label && (
            <div
              style={{
                display: "inline-block",
                background: config.overlay_accent_color,
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                padding: "4px 12px",
                borderRadius: 999,
                marginBottom: 10,
              }}
            >
              {tier.label}
            </div>
          )}

          <div style={{ fontSize: 19, fontWeight: 700, color: config.overlay_accent_color }}>{text}</div>

          <div style={{ fontSize: 40, fontWeight: 900, margin: "6px 0", color: config.overlay_text_color, fontVariantNumeric: "tabular-nums" }}>
            {current.credits} Credit
          </div>

          {current.message && (
            <div style={{ fontSize: 16, color: config.overlay_text_color, opacity: 0.75, fontStyle: "italic", marginTop: 6, lineHeight: 1.45 }}>
              &ldquo;{current.message}&rdquo;
            </div>
          )}

          {current.media_url &&
            (current.media_url.match(/\.(gif|jpg|jpeg|png|webp)$/i) ? (
              <img src={current.media_url} alt="" style={{ maxWidth: 260, maxHeight: 190, borderRadius: 12, marginTop: 12 }} />
            ) : (
              <video src={current.media_url} autoPlay muted loop style={{ maxWidth: 260, maxHeight: 190, borderRadius: 12, marginTop: 12 }} />
            ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </div>
  );
}

export default function OverlayPage() {
  return (
    <Suspense fallback={<div style={{ background: "transparent" }} />}>
      <OverlayContent />
    </Suspense>
  );
}
