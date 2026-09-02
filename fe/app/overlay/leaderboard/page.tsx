"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { LeaderboardEntry, LeaderboardSettings } from "@/lib/types";

// Standalone OBS overlay — no navbar, no footer, transparent background
export default function LeaderboardOverlayPage() {
  const params = useSearchParams();
  const creatorId = params.get("creatorId") ?? "";
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [settings, setSettings] = useState<LeaderboardSettings | null>(null);
  const [animIn, setAnimIn] = useState<string[]>([]);
  const prevEntries = useRef<LeaderboardEntry[]>([]);

  const fetch = async () => {
    if (!creatorId) return;
    try {
      const res = await window.fetch(`/api/v1/leaderboard/${creatorId}`);
      if (!res.ok) return;
      const body = await res.json();
      const newEntries: LeaderboardEntry[] = body.data?.entries ?? [];
      const newSettings: LeaderboardSettings = body.data?.settings;

      // Animate newly appeared entries
      const prevIds = prevEntries.current.map((e) => e.donor_name);
      const newIds = newEntries.filter((e) => !prevIds.includes(e.donor_name)).map((e) => e.donor_name);
      if (newIds.length > 0) {
        setAnimIn(newIds);
        setTimeout(() => setAnimIn([]), 800);
      }
      prevEntries.current = newEntries;
      setEntries(newEntries);
      if (newSettings) setSettings(newSettings);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [creatorId]);

  if (!settings?.is_enabled || entries.length === 0) return null;

  const rankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-300";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-500";
    return "text-white/70";
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  return (
    <div
      className="min-h-screen flex items-end justify-start p-6"
      style={{ background: "transparent", fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="w-72">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <div className="w-1 h-6 bg-yellow-400 rounded-full" />
          <h2 className="text-white font-bold text-sm tracking-wide uppercase opacity-90">
            {settings.title}
          </h2>
        </div>

        {/* Entries */}
        <div className="space-y-1.5">
          {entries.slice(0, settings.max_entries).map((entry) => (
            <div
              key={entry.donor_name}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2",
                "bg-black/50 backdrop-blur-sm border border-white/10",
                animIn.includes(entry.donor_name) ? "animate-slide-in-left" : "",
              ].join(" ")}
            >
              {/* Rank */}
              <span className={`text-sm font-bold w-6 text-center ${rankColor(entry.rank)}`}>
                {rankIcon(entry.rank)}
              </span>

              {/* Name */}
              <span className="flex-1 text-white text-sm font-medium truncate">
                {entry.donor_name}
              </span>

              {/* Amount */}
              {settings.show_amount && (
                <span className="text-yellow-300 text-xs font-bold">
                  {formatIDR(entry.total_idr)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
        body { background: transparent !important; }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-left { animation: slide-in-left 0.5s ease forwards; }
      `}</style>
    </div>
  );
}
