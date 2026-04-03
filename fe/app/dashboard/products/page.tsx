"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import { Trash2, Plus, Upload, FileText } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Product, PaginatedResponse } from "@/lib/types";

export default function DashboardProducts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("ebook");
  const [deliveryType, setDeliveryType] = useState("file");
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [thumbFile, setThumbFile] = useState<File | null>(null);

  // Upload asset to existing product
  const [uploadProductId, setUploadProductId] = useState<string | null>(null);
  const assetRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery({
    queryKey: ["my-products"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>(`/products/creator/${user!.id}`);
      return data.data;
    },
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      // Upload thumbnail
      let thumbnailUrl: string | undefined;
      if (thumbFile) {
        const fd = new FormData();
        fd.append("file", thumbFile);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        thumbnailUrl = data.data.url;
      }

      // Create product
      const { data } = await api.post("/products", {
        name, slug, description, price_idr: parseInt(price) * 1000, type, is_active: true,
        thumbnail_url: thumbnailUrl, delivery_type: deliveryType,
        delivery_url: deliveryType === "link" ? deliveryUrl : undefined,
      });
      const productId = data.data.id;

      // Upload asset files
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        await api.post(`/products/${productId}/assets`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-products"] });
      setShowForm(false);
      setName(""); setSlug(""); setDescription(""); setPrice(""); setFiles([]); setThumbFile(null); setDeliveryType("file"); setDeliveryUrl("");
      toast.success("Produk berhasil dibuat!");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal membuat produk"),
  });

  const addAsset = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/products/${productId}/assets`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-products"] });
      setUploadProductId(null);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="mr-1 h-4 w-4" /> Buat Produk</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="space-y-3 p-4">
            <Input placeholder="Nama produk" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Slug (url-friendly)" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
            <Textarea placeholder="Deskripsi produk..." value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input type="number" placeholder="Harga (Credit)" value={price} onChange={(e) => setPrice(e.target.value)} />
            <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ebook">E-book</option>
              <option value="preset">Preset</option>
              <option value="template">Template</option>
              <option value="other">Lainnya</option>
            </select>

            {/* Delivery type */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Pengiriman</label>
              <div className="flex gap-2 mt-1">
                <Button type="button" size="sm" variant={deliveryType === "file" ? "default" : "outline"} onClick={() => setDeliveryType("file")}>📁 File Digital</Button>
                <Button type="button" size="sm" variant={deliveryType === "link" ? "default" : "outline"} onClick={() => setDeliveryType("link")}>🔗 Link / Key</Button>
              </div>
            </div>

            {deliveryType === "link" && (
              <Input placeholder="Link atau key (misal: URL kursus, license key, invite link)" value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} />
            )}

            {/* Thumbnail */}
            <div>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => setThumbFile(e.target.files?.[0] || null)} />
              <Button type="button" variant="outline" size="sm" onClick={() => thumbRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> {thumbFile ? `Thumbnail: ${thumbFile.name}` : "Upload Thumbnail"}
              </Button>
            </div>

            {/* Asset files */}
            <div>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> Upload File Produk
              </Button>
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                      <FileText className="h-3 w-3" />
                      <span className="truncate">{f.name}</span>
                      <span className="text-gray-400 dark:text-gray-500">({(f.size / 1024).toFixed(0)} KB)</span>
                      <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-500 ml-auto">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={() => createProduct.mutate()} disabled={createProduct.isPending || !name || !slug || !price}>
              {createProduct.isPending ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {products?.map((p) => (
          <Card key={p.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => window.location.href = `/dashboard/products/${p.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>{p.type}</Badge>
                    <span className="text-sm font-medium">{formatCredit(p.price_idr)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{p.sales_count} terjual</span>
                  </div>
                  {p.description && <p className="text-sm text-gray-600 mt-1">{p.description}</p>}
                  {p.assets?.length > 0 && (
                    <div className="mt-2">
                      {p.assets.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5 mr-1">
                          <FileText className="h-3 w-3" /> {a.file_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <input ref={assetRef} type="file" className="hidden" onChange={(e) => {
                    if (e.target.files?.[0] && uploadProductId) {
                      addAsset.mutate({ productId: uploadProductId, file: e.target.files[0] });
                    }
                  }} />
                  <Button variant="ghost" size="sm" onClick={() => { setUploadProductId(p.id); setTimeout(() => assetRef.current?.click(), 100); }}>
                    <Upload className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog title="Hapus Produk?" message="Produk yang dihapus tidak bisa dikembalikan." onConfirm={() => deleteProduct.mutate(p.id)}>
                    {(open) => (
                      <Button variant="ghost" size="icon" onClick={open}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    )}
                  </ConfirmDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
