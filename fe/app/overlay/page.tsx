"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OverlayContent() {
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("id");
  const [donation, setDonation] = useState<any>(null);
  const [shown, setShown] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!creatorId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/donations/creator/${creatorId}/latest`);
        const data = await res.json();
        if (data.data && !shown.has(data.data.id)) {
          setDonation(data.data);
          setShown(prev => new Set(prev).add(data.data.id));
          setTimeout(() => setDonation(null), 8000);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [creatorId, shown]);

  if (!donation) return <div />;

  return (
    <div className="fixed inset-0 flex items-end justify-center pb-8 pointer-events-none">
      <div className="animate-bounce-in bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl px-8 py-5 text-center max-w-md border-2 border-primary">
        <p className="text-3xl mb-2">☕</p>
        <p className="text-lg font-bold text-primary">{donation.donor_name || "Anonim"}</p>
        <p className="text-2xl font-black my-1">{(donation.amount_idr / 1000).toFixed(0)} Credit</p>
        {donation.message && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">&ldquo;{donation.message}&rdquo;</p>}
      </div>
      <style jsx>{`
        @keyframes bounceIn {
          0% { transform: scale(0) translateY(50px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-bounce-in { animation: bounceIn 0.5s ease-out; }
      `}</style>
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
