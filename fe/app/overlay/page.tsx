"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const anims: Record<string, string> = {
  bounce: `@keyframes donateIn{0%{transform:scale(0) translateY(50px);opacity:0}60%{transform:scale(1.1) translateY(-10px);opacity:1}100%{transform:scale(1) translateY(0);opacity:1}}`,
  slide: `@keyframes donateIn{0%{transform:translateX(100%);opacity:0}100%{transform:translateX(0);opacity:1}}`,
  fade: `@keyframes donateIn{0%{opacity:0;transform:scale(0.8)}100%{opacity:1;transform:scale(1)}}`,
  spin: `@keyframes donateIn{0%{transform:rotate(-180deg) scale(0);opacity:0}100%{transform:rotate(0) scale(1);opacity:1}}`,
};

function OverlayContent() {
  const sp = useSearchParams();
  const creatorId = sp.get("id");
  const [style, setStyle] = useState(sp.get("style") || "bounce");
  const [donation, setDonation] = useState<any>(null);
  const [tierImage, setTierImage] = useState("");
  const [textTpl, setTextTpl] = useState("{donor} donated {amount} Credit!");
  const lastId = useRef("");
  const init = useRef(false);

  // Fetch overlay tiers + style settings once
  const [tiers, setTiers] = useState<any[]>([]);
  useEffect(() => {
    if (!creatorId) return;
    fetch(`/api/v1/overlay-tiers/${creatorId}`).then(r => r.json()).then(d => {
      setTiers(d.data || []);
      if (d.overlay_style) setStyle(d.overlay_style);
      if (d.overlay_text_template) setTextTpl(d.overlay_text_template);
    }).catch(() => {});
  }, [creatorId]);

  // Poll donations
  useEffect(() => {
    if (!creatorId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/donations/creator/${creatorId}/latest`);
        const data = await res.json();
        if (!data.data) return;
        if (!init.current) { lastId.current = data.data.id; init.current = true; return; }
        if (data.data.id !== lastId.current) {
          lastId.current = data.data.id;
          // Find matching tier image
          const credits = data.data.amount_idr / 1000;
          const matched = [...tiers].sort((a, b) => b.min_credits - a.min_credits).find(t => credits >= t.min_credits);
          setTierImage(matched?.image_url || "");
          setDonation(data.data);
          setTimeout(() => { setDonation(null); setTierImage(""); }, 8000);
        }
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(poll);
  }, [creatorId, tiers]);

  if (!donation) return <div style={{ background: "transparent" }} />;

  const credits = (donation.amount_idr / 1000).toFixed(0);
  const text = textTpl.replace("{donor}", donation.donor_name || "Anonim").replace("{amount}", credits);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", background: "transparent" }}>
      <div style={{ animation: "donateIn 0.6s ease-out", textAlign: "center" }}>
        {/* Tier GIF/Image */}
        {tierImage && <img src={tierImage} alt="" style={{ width: 120, height: 120, objectFit: "contain", margin: "0 auto 8px" }} />}

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 16, padding: "16px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", border: "3px solid #2563EB", display: "inline-block" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#2563EB" }}>{text}</div>
          <div style={{ fontSize: 28, fontWeight: 900, margin: "4px 0" }}>{credits} Credit</div>
          {donation.message && <div style={{ fontSize: 13, color: "#666", fontStyle: "italic", marginTop: 4 }}>&ldquo;{donation.message}&rdquo;</div>}
          {/* Media from supporter */}
          {donation.media_url && (
            donation.media_url.match(/\.(gif|jpg|jpeg|png|webp)$/i)
              ? <img src={donation.media_url} alt="" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, marginTop: 8 }} />
              : <video src={donation.media_url} autoPlay muted loop style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, marginTop: 8 }} />
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `${anims[style] || anims.bounce} body{background:transparent!important}` }} />
    </div>
  );
}

export default function OverlayPage() {
  return <Suspense fallback={<div />}><OverlayContent /></Suspense>;
}
