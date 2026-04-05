import { create } from "zustand";
import api from "./api";
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
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", data.data.access_token);
    localStorage.setItem("refresh_token", data.data.refresh_token);
    const me = await api.get("/auth/me");
    const user = me.data.data;
    set({ user });
    // Set a session cookie for server-side middleware route protection
    document.cookie = `auth-role=${user.role}; path=/; SameSite=Lax`;
    // Redirect — first time to welcome, otherwise to dashboard
    const isFirstLogin = !localStorage.getItem("has_logged_in");
    localStorage.setItem("has_logged_in", "true");

    if (isFirstLogin) {
      window.location.href = "/welcome";
    } else if (user.role === "admin") {
      window.location.href = "/admin";
    } else if (user.role === "creator") {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/s";
    }
  },
  register: async (email, username, password, role, referralCode) => {
    await api.post("/auth/register", { email, username, password, role, referral_code: referralCode || undefined });
  },
  logout: () => {
    const rt = localStorage.getItem("refresh_token");
    if (rt) api.post("/auth/logout", { refresh_token: rt }).catch(() => {});
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("has_logged_in");
    // Clear session cookie
    document.cookie = "auth-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
}));
