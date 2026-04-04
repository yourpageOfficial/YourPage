"use client";

export function useHapticFeedback() {
  const trigger = (type: "light" | "medium" | "heavy" = "light") => {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    
    const duration = type === "light" ? 10 : type === "medium" ? 20 : 40;
    navigator.vibrate(duration);
  };

  return { trigger };
}
