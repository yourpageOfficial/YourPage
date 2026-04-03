"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCredit, formatDate } from "@/lib/utils";
import { Download, FileText, Package } from "lucide-react";
import Link from "next/link";
import type { Product, PaginatedResponse } from "@/lib/types";

export default function SupporterProducts() {
  const { data } = useQuery({
    queryKey: ["library-products"],
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Product>>("/library/products"); return data.data; },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Produk yang Dibeli</h1>
      {data?.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-400" />
          <p className="mt-3 text-gray-500 dark:text-gray-400">Belum ada produk yang dibeli.</p>
          <Link href="/explore"><Button variant="outline" size="sm" className="mt-3">Explore Kreator</Button></Link>
        </div>
      )}
      <div className="space-y-3">
        {data?.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt="" className="h-20 w-20 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-20 w-20 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl shrink-0">
                    {p.type === "ebook" ? "📖" : p.type === "preset" ? "🎨" : p.type === "template" ? "📄" : "📦"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      {p.creator && (
                        <Link href={`/c/${p.creator.username}`} className="text-sm text-primary hover:underline">
                          @{p.creator.username}
                        </Link>
                      )}
                    </div>
                    <Badge>{p.type}</Badge>
                  </div>
                  {p.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatCredit(p.price_idr)}</span>
                    <span>{formatDate(p.created_at)}</span>
                    {p.assets?.length > 0 && <span>{p.assets.length} file</span>}
                  </div>
                  {p.assets?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.assets.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">
                          <FileText className="h-3 w-3" /> {a.file_name} <span className="text-gray-400 dark:text-gray-400">({a.file_size_kb}KB)</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Link href={`/products/${p.id}`} className="shrink-0 self-center">
                  <Button size="sm"><Download className="mr-1 h-4 w-4" /> Download</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
