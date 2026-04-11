"use client";

import { create } from "zustand";

interface ToastAction { label: string; onClick: () => void; }

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  action?: ToastAction;
  persistent?: boolean;
}

interface ToastStore {
  toasts: Toast[];
  add: (type: Toast["type"], message: string, opts?: { action?: ToastAction; persistent?: boolean }) => void;
  remove: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message, opts) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, type, message, ...opts }] }));
    if (!opts?.persistent) {
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
    }
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string, opts?: { action?: ToastAction; persistent?: boolean }) => useToast.getState().add("success", msg, opts),
  error: (msg: string, opts?: { action?: ToastAction; persistent?: boolean }) => useToast.getState().add("error", msg, opts),
  info: (msg: string, opts?: { action?: ToastAction; persistent?: boolean }) => useToast.getState().add("info", msg, opts),
};
