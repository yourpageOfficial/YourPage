"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageFallback } from "@/components/ui/image-fallback";
import { formatCredit, formatDate } from "@/lib/utils";
import { Download, FileText, Package } from "lucide-react";
import Link from "next/link";
import type { Product, PaginatedResponse } from "@/lib/types";
import { motion } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";

export default function SupporterProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ["library-products"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Product>>("/library/products"); return data.data; },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Produk yang Dibeli</h1>

      {data?.length === 0 && (
        <Card><CardContent className="p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><Package className="h-7 w-7 text-primary" /></div>
          <p className="font-display font-bold">Belum ada produk yang dibeli</p>
          <p className="text-sm text-gray-400 mt-1">Beli produk dari kreator favoritmu</p>
          <Link href="/explore"><Button variant="outline" size="sm" className="mt-4 rounded-2xl">Explore Kreator</Button></Link>
        </CardContent></Card>
      )}

      {/* Grid layout for products */}
      {data && data.length > 0 && (
        <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid sm:grid-cols-2 gap-3">
          {data.map((p) => (
            <motion.div key={p.id} variants={staggerItem}>
              <Card hover className="h-full">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {p.thumbnail_url ? (
                      <ImageFallback src={p.thumbnail_url} alt={p.name} width={160} height={160} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 flex items-center justify-center text-2xl shrink-0">
                        {p.type === "ebook" ? "📖" : p.type === "preset" ? "🎨" : p.type === "template" ? "📄" : "📦"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      {p.creator && (
                        <Link href={`/c/${p.creator.username}`} className="text-xs text-primary hover:underline">@{p.creator.username}</Link>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className="text-[10px]">{p.type}</Badge>
                        <span className="text-xs font-bold text-primary">{formatCredit(p.price_idr)}</span>
                      </div>
                    </div>
                  </div>
                  {p.assets && p.assets.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-primary-50 dark:border-primary-900/20">
                      <div className="flex flex-wrap gap-1.5">
                        {p.assets.map((a) => (
                          <span key={a.id} className="inline-flex items-center gap-1 text-[10px] bg-primary-50 dark:bg-navy-800 rounded-lg px-2 py-1">
                            <FileText className="h-3 w-3" /> {a.file_name}
                          </span>
                        ))}
                      </div>
                      <Link href={`/products/${p.id}`} className="mt-2 block">
                        <Button size="sm" className="w-full rounded-xl"><Download className="mr-1 h-3.5 w-3.5" /> Download</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
