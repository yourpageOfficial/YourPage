"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User, Wallet, Search, Menu, X, Moon, Sun, LayoutDashboard, Rss, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useEffect, useState } from "react";

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
    <button onClick={toggle} className="px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-2 text-left w-full">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

export function Navbar() {
  const { user, loading, fetchMe, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      fetchMe();
    } else {
      useAuth.setState({ loading: false });
    }
  }, [fetchMe]);

  if (loading) return <nav className="h-14 sm:h-16 border-b bg-white dark:bg-gray-900 dark:border-gray-700" />;

  const homeLink = user
    ? user.role === "admin" ? "/admin"
    : user.role === "creator" ? "/dashboard"
    : "/s"
    : "/";

  return (
    <nav className="sticky top-0 z-50 h-14 sm:h-16 border-b bg-white/95 dark:bg-gray-900/95 dark:border-gray-700 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-3 sm:px-4">
        <Link href={homeLink} className="text-lg sm:text-xl font-bold text-primary shrink-0">
          YourPage
        </Link>

        {user ? (
          <>
            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              {user.role === "admin" && (
                <Link href="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>
              )}
              {user.role === "creator" && (
                <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              )}
              {user.role === "supporter" && (
                <Link href="/s"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              )}
              <Link href="/explore"><Button variant="ghost" size="sm">Explore</Button></Link>
              <Link href="/chat"><Button variant="ghost" size="icon"><MessageCircle className="h-4 w-4" /></Button></Link>
              <Link href="/notifications"><Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button></Link>
              <Link href="/wallet"><Button variant="ghost" size="icon"><Wallet className="h-4 w-4" /></Button></Link>
              <Link href={user.role === "admin" ? "/admin/profile" : "/profile"}>
                <Button variant="ghost" size="icon" title="Profil"><User className="h-4 w-4" /></Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-4 w-4" /></Button>
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            {/* Mobile nav */}
            <div className="flex sm:hidden items-center gap-1">
              <Link href="/notifications"><Button variant="ghost" size="icon" className="h-9 w-9"><Bell className="h-4 w-4" /></Button></Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/pricing"><Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 hidden sm:inline-flex">Harga</Button></Link>
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/login"><Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">Masuk</Button></Link>
            <Link href="/register"><Button size="sm" className="text-xs sm:text-sm h-8 sm:h-9">Daftar</Button></Link>
          </div>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && user && (
        <div className="sm:hidden absolute top-14 left-0 right-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-lg z-50">
          <div className="flex flex-col p-2" onClick={() => setMenuOpen(false)}>
            {user.role === "admin" && (
              <Link href="/admin" className="px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Admin Panel</Link>
            )}
            {user.role === "creator" && (
              <Link href="/dashboard" className="px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            )}
            {user.role === "creator" && (
              <Link href="/dashboard/feed" className="px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-2"><Rss className="h-4 w-4" /> Feed</Link>
            )}
            {user.role === "supporter" && (
              <Link href="/s" className="px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            )}
            <Link href="/explore" className="px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-2">
              <Search className="h-4 w-4" /> Explore
            </Link>
            <Link href="/wallet" className="px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Wallet
            </Link>
            <Link href={user.role === "admin" ? "/admin/profile" : "/profile"} className="px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-2">
              <User className="h-4 w-4" /> Profil
            </Link>
            <button onClick={logout} className="px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2 text-left w-full">
              <LogOut className="h-4 w-4" /> Logout
            </button>
            <div className="border-t dark:border-gray-700 mt-1 pt-1">
              <ThemeToggleMobile />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
