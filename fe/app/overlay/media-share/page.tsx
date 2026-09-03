"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/internationalization";

interface MediaShareEvent {
  id: string;
  media_url: string;
  media_type: string;
  donor_name: string;
  message?: string;
}

// Standalone OBS overlay — transparent background, no navbar
export default function MediaShareOverlayPage() {
  const params = useSearchParams();
  const creatorId = params.get("creatorId") ?? "";
  const { t } = useTranslation();
  const [current, setCurrent] = useState<MediaShareEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((event: MediaShareEvent) => {
    setCurrent(event);
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Auto-dismiss after 30 seconds
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setCurrent(null), 500);
    }, 30_000);
  }, []);

  useEffect(() => {
    if (!creatorId) return;
    const es = new EventSource(`/api/v1/overlay/${creatorId}/stream`);
    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "media_share_play") {
          show({
            id: data.id ?? "",
            media_url: data.media_url ?? "",
            media_type: data.media_type ?? "image",
            donor_name: data.donor_name ?? t.overlayAlerts.anonymous,
            message: data.message,
          });
        }
      } catch { /* ignore malformed events */ }
    });
    return () => { es.close(); if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [creatorId, show]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "transparent", fontFamily: "'Outfit', sans-serif" }}
    >
      <div
        className={[
          "transition-all duration-500",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none",
        ].join(" ")}
      >
        {current && (
          <div className="flex flex-col items-center gap-3 max-w-sm">
            {/* Media display */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <img
                src={current.media_url}
                alt="media share"
                className="max-w-[400px] max-h-64 object-contain"
                loading="eager"
              />
            </div>

            {/* Sender info */}
            <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/10">
              <p className="text-white font-bold text-sm">{current.donor_name}</p>
              {current.message && (
                <p className="text-white/70 text-xs mt-0.5 max-w-xs truncate">{current.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
        body { background: transparent !important; }
      `}</style>
    </div>
  );
}
