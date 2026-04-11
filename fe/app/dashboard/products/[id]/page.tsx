"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Upload, Trash2, Save, ArrowLeft, FileText } from "lucide-react";
import type { Product, ApiResponse } from "@/lib/types";

export default function DashboardProductDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const assetRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("ebook");
  const [isActive, setIsActive] = useState(true);
  const [deliveryType, setDeliveryType] = useState("file");
  const [deliveryUrl, setDeliveryUrl] = useState("");

  const { data: product } = useQuery({
    queryKey: ["my-product", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(String(Math.floor(product.price_idr / 1000)));
      setType(product.type);
      setIsActive(product.is_active);
      setDeliveryType((product as any).delivery_type || "file");
      setDeliveryUrl((product as any).delivery_url || "");
    }
  }, [product]);

  const save = useMutation({
    mutationFn: () => api.put(`/products/${id}`, {
      name, description, price_idr: parseInt(price) * 1000, type, is_active: isActive,
      delivery_type: deliveryType,
      delivery_url: deliveryType === "link" && deliveryUrl ? deliveryUrl : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-product", id] }); toast.success("Produk tersimpan!"); },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menyimpan"),
  });

  const addAsset = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/products/${id}/assets`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-product", id] }),
  });

  const deleteAsset = useMutation({
    mutationFn: (assetId: string) => api.delete(`/products/${id}/assets/${assetId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-product", id] }),
  });

  if (!product) return <ListSkeleton count={3} />;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/products")} className="mb-4">
        <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
      </Button>

      <Card className="mb-6">
        <CardHeader><CardTitle>Edit Produk</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nama produk" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Deskripsi produk..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
          <Input type="number" placeholder="Harga (Credit)" value={price} onChange={(e) => setPrice(e.target.value)} />
          <div className="flex gap-2">
            <select className="rounded-xl border border-primary-200 dark:border-primary-900/40 bg-white dark:bg-navy-800 px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ebook">E-book</option>
              <option value="preset">Preset</option>
              <option value="template">Template</option>
              <option value="other">Lainnya</option>
            </select>
            <Button size="sm" variant={isActive ? "default" : "outline"} onClick={() => setIsActive(!isActive)}>
              {isActive ? "✓ Aktif" : "Nonaktif"}
            </Button>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Pengiriman</label>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant={deliveryType === "file" ? "default" : "outline"} onClick={() => setDeliveryType("file")}>File Upload</Button>
              <Button size="sm" variant={deliveryType === "link" ? "default" : "outline"} onClick={() => setDeliveryType("link")}>Link / Key</Button>
            </div>
          </div>
          {deliveryType === "link" && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL / Serial Key</label>
              <Input placeholder="https://... atau serial key" value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} className="mt-1" />
            </div>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="mr-1 h-4 w-4" /> {save.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
          {save.isSuccess && <span className="text-sm text-green-600 ml-2">Tersimpan!</span>}
        </CardContent>
      </Card>

      {/* Assets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>File Produk ({product.assets?.length || 0})</CardTitle>
            <div>
              <input ref={assetRef} type="file" multiple className="hidden"
                onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(f => addAsset.mutate(f)); }} />
              <Button size="sm" variant="outline" onClick={() => assetRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> Upload File
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {product.assets?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada file. Upload file yang akan diterima pembeli.</p>}
          <div className="space-y-2">
            {product.assets?.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded border p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium">{a.file_name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{a.file_size_kb} KB</span>
                  <Badge className="text-[10px]">{a.mime_type}</Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteAsset.mutate(a.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
