"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OverlayContent() {
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("id");
  const [donation, setDonation] = useState<any>(null);
  const lastId = useRef<string>("");
  const initialized = useRef(false);

  useEffect(() => {
    if (!creatorId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/donations/creator/${creatorId}/latest`);
        const data = await res.json();
        if (!data.data) return;

        // First poll — just record the ID, don't show
        if (!initialized.current) {
          lastId.current = data.data.id;
          initialized.current = true;
          return;
        }

        // New donation since last check
        if (data.data.id !== lastId.current) {
          lastId.current = data.data.id;
          setDonation(data.data);
          setTimeout(() => setDonation(null), 8000);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [creatorId]);

  if (!donation) return <div style={{ background: "transparent" }} />;

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 32, pointerEvents: "none", background: "transparent" }}>
      <div style={{
        background: "rgba(255,255,255,0.95)", borderRadius: 16, padding: "20px 32px",
        textAlign: "center", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        border: "3px solid #2563EB", animation: "bounceIn 0.5s ease-out"
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>☕</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#2563EB" }}>{donation.donor_name || "Anonim"}</div>
        <div style={{ fontSize: 28, fontWeight: 900, margin: "4px 0" }}>{(donation.amount_idr / 1000).toFixed(0)} Credit</div>
        {donation.message && <div style={{ fontSize: 14, color: "#666", marginTop: 8, fontStyle: "italic" }}>&ldquo;{donation.message}&rdquo;</div>}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounceIn {
          0% { transform: scale(0) translateY(50px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        body { background: transparent !important; }
      `}} />
    </div>
  );
}

export default function OverlayPage() {
  return (
    <Suspense fallback={<div />}>
      <OverlayContent />
    </Suspense>
  );
}
