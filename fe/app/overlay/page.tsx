"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const animations: Record<string, string> = {
  bounce: `@keyframes donateIn { 0%{transform:scale(0) translateY(50px);opacity:0} 60%{transform:scale(1.1) translateY(-10px);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }`,
  slide: `@keyframes donateIn { 0%{transform:translateX(100%);opacity:0} 100%{transform:translateX(0);opacity:1} }`,
  fade: `@keyframes donateIn { 0%{opacity:0;transform:scale(0.8)} 100%{opacity:1;transform:scale(1)} }`,
  spin: `@keyframes donateIn { 0%{transform:rotate(-180deg) scale(0);opacity:0} 100%{transform:rotate(0) scale(1);opacity:1} }`,
};

function OverlayContent() {
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("id");
  const [donation, setDonation] = useState<any>(null);
  const [style, setStyle] = useState("bounce");
  const lastId = useRef("");
  const initialized = useRef(false);

  // Fetch creator overlay style
  useEffect(() => {
    if (!creatorId) return;
    fetch(`/api/v1/creators/search?q=`).catch(() => {});
    // Try to get style from creator page
    fetch(`/api/v1/donations/creator/${creatorId}/latest`).then(r => r.json()).then(d => {
      // Style comes from a separate call
    }).catch(() => {});
  }, [creatorId]);

  useEffect(() => {
    if (!creatorId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/donations/creator/${creatorId}/latest`);
        const data = await res.json();
        if (!data.data) return;
        if (!initialized.current) { lastId.current = data.data.id; initialized.current = true; return; }
        if (data.data.id !== lastId.current) {
          lastId.current = data.data.id;
          setDonation(data.data);
          setTimeout(() => setDonation(null), 8000);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [creatorId]);

  // Get style from URL param or default
  const animStyle = searchParams.get("style") || style;

  if (!donation) return <div style={{ background: "transparent" }} />;

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 32, pointerEvents: "none", background: "transparent" }}>
      <div style={{
        background: "rgba(255,255,255,0.95)", borderRadius: 16, padding: "20px 32px",
        textAlign: "center", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        border: "3px solid #2563EB", animation: "donateIn 0.6s ease-out"
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>☕</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#2563EB" }}>{donation.donor_name || "Anonim"}</div>
        <div style={{ fontSize: 32, fontWeight: 900, margin: "4px 0" }}>{(donation.amount_idr / 1000).toFixed(0)} Credit</div>
        {donation.message && <div style={{ fontSize: 14, color: "#666", marginTop: 8, fontStyle: "italic" }}>&ldquo;{donation.message}&rdquo;</div>}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `${animations[animStyle] || animations.bounce} body{background:transparent!important}` }} />
    </div>
  );
}

export default function OverlayPage() {
  return <Suspense fallback={<div />}><OverlayContent /></Suspense>;
}
