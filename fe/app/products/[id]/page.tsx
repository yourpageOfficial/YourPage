"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR, formatCredit, formatDate } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Download, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ReportButton } from "@/components/report-button";
import type { Product, ApiResponse } from "@/lib/types";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [buying, setBuying] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrls, setDownloadUrls] = useState<any[]>([]);

  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
      return data.data;
    },
  });

  useQuery({
    queryKey: ["product-download", id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/products/${id}/download`);
        if (data.success) { setPurchased(true); setDownloadUrls(data.data || []); }
        return data.data;
      } catch { return null; }
    },
    retry: false,
  });

  const handleBuy = async () => {
    setBuying(true); setError("");
    try {
      await api.post("/checkout/product", { product_id: id, provider: "credits" });
      setPurchased(true);
      const { data } = await api.get(`/products/${id}/download`);
      setDownloadUrls(data.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gagal";
      if (msg.includes("Credit") || msg.includes("insufficient")) setError("Credit tidak cukup.");
      else if (msg.includes("already")) {
        setPurchased(true);
        try { const { data } = await api.get(`/products/${id}/download`); setDownloadUrls(data.data || []); } catch {}
      } else setError(msg);
    } finally { setBuying(false); }
  };

  if (!product) return <><Navbar /><div className="p-8"><ListSkeleton count={3} /></div></>;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-5">
          {/* Left — Thumbnail */}
          <div className="md:col-span-2">
            {product.thumbnail_url ? (
              <img src={product.thumbnail_url} alt={product.name} className="w-full rounded-xl object-cover aspect-[4/3] sm:aspect-square shadow-sm" />
            ) : (
              <div className="w-full rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3] sm:aspect-square flex items-center justify-center text-5xl sm:text-7xl">
                {product.type === "ebook" ? "📖" : product.type === "preset" ? "🎨" : product.type === "template" ? "📄" : "📦"}
              </div>
            )}
          </div>

          {/* Right — Info */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="text-xs">{product.type}</Badge>
              <Badge className="text-xs" variant="outline">{product.delivery_type === "link" ? "🔗 Link" : "📁 File"}</Badge>
              {!product.is_active && <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Inactive</Badge>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>

            {/* Creator */}
            {product.creator && (
              <Link href={`/c/${product.creator.username}`} className="flex items-center gap-2 mt-3 group">
                {product.creator.avatar_url ? (
                  <img src={product.creator.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary">
                    {product.creator.display_name?.[0]}
                  </div>
                )}
                <span className="text-sm text-gray-600 group-hover:text-primary">{product.creator.display_name}</span>
              </Link>
            )}

            {/* Price */}
            <p className="mt-4 text-3xl sm:text-4xl font-bold text-primary">{formatCredit(product.price_idr)}</p>
            <p className="text-sm text-gray-500 mt-1">{product.sales_count} terjual · {formatDate(product.created_at)}</p>
            <div className="mt-2"><ReportButton targetType="product" targetId={id} /></div>

            {/* Description */}
            {product.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Deskripsi</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Files included */}
            {product.assets?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">File yang didapat</h3>
                <div className="space-y-2">
                  {product.assets.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.file_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{a.file_size_kb} KB · {a.mime_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="mt-8">
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

              {purchased ? (
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="font-semibold text-green-700 dark:text-green-400">Sudah Dibeli</p>
                    </div>
                    {downloadUrls.length > 0 ? (
                      <div className="space-y-2">
                        {downloadUrls.map((d: any, i: number) => (
                          <a key={d.asset_id || i} href={d.signed_url} target="_blank" rel="noopener">
                            <Button variant="outline" size="sm" className="w-full justify-start mb-1">
                              {d.file_name === "Link" ? "🔗 Buka Link" : <><Download className="mr-2 h-4 w-4" /> {d.file_name}</>}
                              {d.expires_in_seconds > 0 && <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{d.expires_in_seconds / 60}min</span>}
                            </Button>
                          </a>
                        ))}
                        {product.delivery_note && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{product.delivery_note}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Creator belum upload file untuk produk ini.</p>
                    )}
                  </CardContent>
                </Card>
              ) : error.includes("Credit") ? (
                <Link href="/wallet/topup">
                  <Button size="lg" className="w-full">Top-up Credit Sekarang</Button>
                </Link>
              ) : (
                <Button size="lg" className="w-full" onClick={handleBuy} disabled={buying}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {buying ? "Memproses..." : `Beli — ${formatCredit(product.price_idr)}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
