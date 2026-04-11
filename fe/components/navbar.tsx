"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User, Wallet, Search, Menu, X, Moon, Sun, LayoutDashboard, Rss, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function ThemeToggleMobile() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return (
    <button onClick={toggle} className="px-4 py-3 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl flex items-center gap-2.5 text-left w-full transition-colors">
      {dark ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-primary" />}
      {dark ? "Mode Terang" : "Mode Gelap"}
    </button>
  );
}

export function Navbar() {
  const { user, loading, fetchMe, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Try fetchMe — works with both cookie auth and legacy localStorage
      // If no auth at all, fetchMe will fail and set loading=false
      fetchMe();
    }
  }, [fetchMe]);

  if (loading) return <nav className="h-16 border-b border-primary-100 dark:border-primary-900/30 bg-white dark:bg-navy-900" />;

  const homeLink = user
    ? user.role === "admin" ? "/admin"
    : user.role === "creator" ? "/dashboard"
    : "/s"
    : "/";

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-primary-100/80 dark:border-primary-900/30 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href={homeLink} className="text-xl font-display font-black tracking-tight shrink-0 flex items-center gap-0.5">
          <span className="text-primary">Your</span>
          <span className="text-accent">.</span>
          <span className="text-primary dark:text-white">Page</span>
        </Link>

        {user ? (
          <>
            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              {user.role === "admin" && (
                <Link href="/admin"><Button variant="ghost" size="sm" className={cn(isActive("/admin") && "text-primary bg-primary-50 dark:bg-primary-900/20")} aria-current={isActive("/admin") ? "page" : undefined}>Admin</Button></Link>
              )}
              {user.role === "creator" && (
                <Link href="/dashboard"><Button variant="ghost" size="sm" className={cn(isActive("/dashboard") && "text-primary bg-primary-50 dark:bg-primary-900/20")} aria-current={isActive("/dashboard") ? "page" : undefined}>Dashboard</Button></Link>
              )}
              {user.role === "supporter" && (
                <Link href="/s"><Button variant="ghost" size="sm" className={cn(isActive("/s") && "text-primary bg-primary-50 dark:bg-primary-900/20")} aria-current={isActive("/s") ? "page" : undefined}>Dashboard</Button></Link>
              )}
              <Link href="/explore"><Button variant="ghost" size="sm" className={cn(isActive("/explore") && "text-primary bg-primary-50 dark:bg-primary-900/20")} aria-current={isActive("/explore") ? "page" : undefined}>Explore</Button></Link>
              <div className="w-px h-6 bg-primary-100 dark:bg-primary-900/30 mx-1" />
              <Link href="/chat"><Button variant="ghost" size="icon" aria-label="Chat" className={cn(isActive("/chat") && "text-primary bg-primary-50 dark:bg-primary-900/20")}><MessageCircle className="h-4 w-4" /></Button></Link>
              <Link href="/notifications"><Button variant="ghost" size="icon" aria-label="Notifikasi" className={cn(isActive("/notifications") && "text-primary bg-primary-50 dark:bg-primary-900/20")}><Bell className="h-4 w-4" /></Button></Link>
              <Link href="/wallet"><Button variant="ghost" size="icon" aria-label="Wallet" className={cn(isActive("/wallet") && "text-primary bg-primary-50 dark:bg-primary-900/20")}><Wallet className="h-4 w-4" /></Button></Link>
              <Link href={user.role === "admin" ? "/admin/profile" : "/profile"}>
                <Button variant="ghost" size="icon" aria-label="Profil" className={cn(isActive("/profile") && "text-primary bg-primary-50 dark:bg-primary-900/20")}><User className="h-4 w-4" /></Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Keluar" className="text-gray-400 hover:text-red-500"><LogOut className="h-4 w-4" /></Button>
              <ThemeToggle />
            </div>

            {/* Mobile nav */}
            <div className="flex sm:hidden items-center gap-1">
              <Link href="/notifications"><Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifikasi"><Bell className="h-4 w-4" /></Button></Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/pricing"><Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 hidden sm:inline-flex">Harga</Button></Link>
            <ThemeToggle />
            <Link href="/login"><Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">Masuk</Button></Link>
            <Link href="/register"><Button size="sm" className="text-xs sm:text-sm h-8 sm:h-9">Daftar</Button></Link>
          </div>
        )}
      </div>

      {/* Mobile dropdown */}
      {menuOpen && user && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border-b border-primary-100 dark:border-primary-900/30 shadow-elevated z-50 animate-slide-down">
          <div className="flex flex-col p-3 gap-0.5" onClick={() => setMenuOpen(false)}>
            {user.role === "admin" && (
              <Link href="/admin" className={cn("px-4 py-3 text-sm font-medium rounded-xl flex items-center gap-2.5 transition-colors", isActive("/admin") ? "text-primary bg-primary-50 dark:bg-primary-900/20" : "hover:bg-primary-50 dark:hover:bg-primary-900/20")} aria-current={isActive("/admin") ? "page" : undefined}><LayoutDashboard className="h-4 w-4" /> Admin Panel</Link>
            )}
            {user.role === "creator" && (
              <>
                <Link href="/dashboard" className={cn("px-4 py-3 text-sm font-medium rounded-xl flex items-center gap-2.5 transition-colors", isActive("/dashboard") ? "text-primary bg-primary-50 dark:bg-primary-900/20" : "hover:bg-primary-50 dark:hover:bg-primary-900/20")} aria-current={isActive("/dashboard") ? "page" : undefined}><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                <Link href="/dashboard/feed" className="px-4 py-3 text-sm font-medium rounded-xl flex items-center gap-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"><Rss className="h-4 w-4" /> Feed</Link>
              </>
            )}
            {user.role === "supporter" && (
              <Link href="/s" className={cn("px-4 py-3 text-sm font-medium rounded-xl flex items-center gap-2.5 transition-colors", isActive("/s") ? "text-primary bg-primary-50 dark:bg-primary-900/20" : "hover:bg-primary-50 dark:hover:bg-primary-900/20")} aria-current={isActive("/s") ? "page" : undefined}><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            )}
            <Link href="/explore" className="px-4 py-3 text-sm font-medium rounded-xl flex items-center gap-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"><Search className="h-4 w-4" /> Explore</Link>
            <Link href="/wallet" className="px-4 py-3 text-sm font-medium rounded-xl flex items-center gap-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"><Wallet className="h-4 w-4" /> Wallet</Link>
            <Link href={user.role === "admin" ? "/admin/profile" : "/profile"} className="px-4 py-3 text-sm font-medium rounded-xl flex items-center gap-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"><User className="h-4 w-4" /> Profil</Link>
            <div className="border-t border-primary-100 dark:border-primary-900/30 my-1" />
            <ThemeToggleMobile />
            <button onClick={logout} className="px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-2.5 text-left w-full transition-colors"><LogOut className="h-4 w-4" /> Keluar</button>
          </div>
        </div>
      )}
    </nav>
  );
}
