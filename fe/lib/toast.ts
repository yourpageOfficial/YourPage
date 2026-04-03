"use client";

import { create } from "zustand";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  add: (type: Toast["type"], message: string) => void;
  remove: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Shorthand
export const toast = {
  success: (msg: string) => useToast.getState().add("success", msg),
  error: (msg: string) => useToast.getState().add("error", msg),
  info: (msg: string) => useToast.getState().add("info", msg),
};
