"use client";

import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { FileText, Package, Heart, Wallet } from "lucide-react";

const sections = [
  {
    label: "Library",
    items: [
      { href: "/library/posts", label: "Post", icon: FileText },
      { href: "/library/products", label: "Produk", icon: Package },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { href: "/donations/sent", label: "Donasi Terkirim", icon: Heart },
      { href: "/wallet", label: "Wallet", icon: Wallet },
    ],
  },
];

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Navbar />
      <div className="mx-auto flex max-w-6xl">
        <MobileSidebar><SidebarNav sections={sections} /></MobileSidebar>
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </AuthGuard>
  );
}
