"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface UseFormDirtyOptions {
  isDirty: boolean;
  message?: string;
  onConfirm?: () => void;
}

export function useFormDirty({ isDirty, message = "You have unsaved changes. Are you sure you want to leave?", onConfirm }: UseFormDirtyOptions) {
  const router = useRouter();
  const confirmedRef = useRef(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingUrlRef = useRef<string | null>(null);

  const handleLeave = useCallback((url: string) => {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    if (isDirty) {
      pendingUrlRef.current = url;
      setShowConfirm(true);
    } else {
      router.push(url);
    }
  }, [isDirty, router]);

  const confirmLeave = useCallback(() => {
    confirmedRef.current = true;
    setShowConfirm(false);
    if (pendingUrlRef.current) {
      router.push(pendingUrlRef.current);
      pendingUrlRef.current = null;
    }
    onConfirm?.();
  }, [router, onConfirm]);

  const cancelLeave = useCallback(() => {
    setShowConfirm(false);
    pendingUrlRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  return {
    showConfirm,
    handleLeave,
    confirmLeave,
    cancelLeave,
    isDirty,
  };
}
