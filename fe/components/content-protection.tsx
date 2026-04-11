"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

// Blurs paid content when page is not visible (tab switch, screen record preview)
export function ContentProtection({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const [hidden, setHidden] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  return (
    <div className="relative">
      {/* Invisible watermark — buyer ID embedded */}
      {user && (
        <div className="pointer-events-none select-none absolute inset-0 z-10 overflow-hidden opacity-[0.03]"
          style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 100px, currentColor 100px, currentColor 101px)` }}>
          <div className="flex flex-wrap gap-32 p-8 text-[10px] rotate-[-30deg] scale-150 origin-center">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i}>{user.username} {user.id.slice(0, 8)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Content — blurred when tab not visible */}
      <div className={hidden ? "blur-xl transition-all duration-200 select-none pointer-events-none" : "transition-all duration-200"}>
        {children}
      </div>

      {hidden && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 rounded-xl">
          <p className="text-white font-medium text-sm">Konten dilindungi</p>
        </div>
      )}
    </div>
  );
}
