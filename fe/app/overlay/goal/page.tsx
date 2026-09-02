"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Config = {
  overlay_accent_color: string;
  overlay_text_color: string;
  overlay_font: string;
  donation_goal_title?: string;
  donation_goal_amount: number;
  donation_goal_current: number;
};

function formatIDR(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

function GoalContent() {
  const sp = useSearchParams();
  const creatorId = sp.get("id");
  const [cfg, setCfg] = useState<Config | null>(null);

  const load = useCallback(() => {
    if (!creatorId) return;
    fetch(`/api/v1/overlay/${creatorId}/config`)
      .then((r) => r.json())
      .then((d) => d?.data && setCfg(d.data))
      .catch(() => {});
  }, [creatorId]);

  useEffect(() => {
    load();
  }, [load]);

  // A donation moves the goal, so refresh the bar whenever one lands rather
  // than polling on a timer.
  useEffect(() => {
    if (!creatorId) return;
    const es = new EventSource(`/api/v1/overlay/${creatorId}/stream`);
    es.addEventListener("alert", () => load());
    return () => es.close();
  }, [creatorId, load]);

  if (!creatorId) {
    return (
      <div style={{ fontFamily: "system-ui", padding: 24, color: "#fff", background: "#0F0D1A", minHeight: "100vh" }}>
        Tambahkan <code>?id=&lt;creator-id&gt;</code> pada URL.
      </div>
    );
  }
  if (!cfg || cfg.donation_goal_amount <= 0) {
    return <div style={{ background: "transparent" }} />;
  }

  const pct = Math.min(100, Math.round((cfg.donation_goal_current / cfg.donation_goal_amount) * 100));
  const accent = cfg.overlay_accent_color || "#EC4899";

  return (
    <div
      style={{
        fontFamily: `${cfg.overlay_font || "Outfit"}, system-ui, sans-serif`,
        padding: 20,
        background: "transparent",
      }}
    >
      <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 18, padding: "16px 20px", boxShadow: `0 12px 36px rgba(0,0,0,0.22), 0 0 0 3px ${accent}`, maxWidth: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: cfg.overlay_text_color || "#0F0D1A" }}>
            {cfg.donation_goal_title || "Target Donasi"}
          </span>
          <span style={{ fontSize: 15, fontWeight: 900, color: accent, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: 16, background: "rgba(0,0,0,0.09)", borderRadius: 999, overflow: "hidden", margin: "10px 0 8px" }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${accent}, #F97316)`,
              borderRadius: 999,
              transition: "width 900ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>

        <div style={{ fontSize: 13, color: cfg.overlay_text_color || "#0F0D1A", opacity: 0.75, fontVariantNumeric: "tabular-nums" }}>
          {formatIDR(cfg.donation_goal_current)} dari {formatIDR(cfg.donation_goal_amount)}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: "html,body{background:transparent!important;margin:0}" }} />
    </div>
  );
}

export default function GoalOverlayPage() {
  return (
    <Suspense fallback={<div style={{ background: "transparent" }} />}>
      <GoalContent />
    </Suspense>
  );
}
