import { create } from "zustand";
import api from "./api";
import { useLocale } from "./use-locale";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, role: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    // Step 1: Login — BE sets HttpOnly cookies
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.data.access_token;

    // Step 2: Get user info using token from response (cookie may not be ready)
    const me = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = me.data.data;
    set({ user, loading: false });

    // Step 3: Set auth-role cookie for middleware (backup — BE also sets it)
    document.cookie = `auth-role=${user.role}; path=/; max-age=604800; SameSite=Lax`;

    // Step 4: Redirect
    const isFirstLogin = !localStorage.getItem("has_logged_in");
    localStorage.setItem("has_logged_in", "true");

    const dest = isFirstLogin ? "/welcome"
      : user.role === "admin" ? "/admin"
      : user.role === "creator" ? "/dashboard"
      : "/s";
    window.location.href = dest;
  },
  register: async (email, username, password, role, referralCode) => {
    await api.post("/auth/register", { email, username, password, role, referral_code: referralCode || undefined });
  },
  logout: () => {
    api.post("/auth/logout").catch(() => {});
    document.cookie = "auth-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("has_logged_in");
    set({ user: null });
    window.location.href = "/";
  },
  fetchMe: async () => {
    try {
      const { data } = await api.get("/auth/me");
      const user = data.data;
      set({ user, loading: false });
      if (user.locale) {
        useLocale.getState().setLocale(user.locale as "id" | "en");
      }
    } catch {
      set({ user: null, loading: false });
    }
  },
}));
