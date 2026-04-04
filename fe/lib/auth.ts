import { create } from "zustand";
import api from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updatePreferredLanguage: (lang: "en" | "id") => Promise<void>;
}

const getLocalePrefix = (lang: "en" | "id") => `/${lang}`;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", data.data.access_token);
    localStorage.setItem("refresh_token", data.data.refresh_token);
    const me = await api.get("/auth/me");
    const user = me.data.data;
    set({ user });
    
    const preferredLang = user.preferred_language || "id";
    const locale = getLocalePrefix(preferredLang);
    const isFirstLogin = !localStorage.getItem("has_logged_in");
    localStorage.setItem("has_logged_in", "true");

    if (isFirstLogin) {
      window.location.href = `${locale}/welcome`;
    } else if (user.role === "admin") {
      window.location.href = `${locale}/admin`;
    } else if (user.role === "creator") {
      window.location.href = `${locale}/dashboard`;
    } else {
      window.location.href = `${locale}/s`;
    }
  },
  register: async (email, username, password, role) => {
    await api.post("/auth/register", { email, username, password, role });
  },
  logout: () => {
    const rt = localStorage.getItem("refresh_token");
    if (rt) api.post("/auth/logout", { refresh_token: rt }).catch(() => {});
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null });
    window.location.href = "/";
  },
  fetchMe: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  updatePreferredLanguage: async (lang: "en" | "id") => {
    try {
      await api.put("/auth/me", { preferred_language: lang });
      const user = get().user;
      if (user) {
        set({ user: { ...user, preferred_language: lang } });
      }
    } catch (err) {
      console.error("Failed to update preferred language:", err);
    }
  },
}));
