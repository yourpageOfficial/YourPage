"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredit, formatDate } from "@/lib/utils";
import { Trash2, Plus, Upload, FileText, Package, X } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Product, PaginatedResponse } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { staggerChildren, staggerItem } from "@/lib/motion-variants";
import { useTranslation } from "@/lib/internationalization";

export default function DashboardProducts() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const { t, interpolate } = useTranslation();
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

  const [uploadProductId, setUploadProductId] = useState<string | null>(null);
  const assetRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery({
    queryKey: ["my-products"],
    enabled: !!user,
    queryFn: async () => { const { data } = await api.get<PaginatedResponse<Product>>(`/products/creator/${user!.id}`); return data.data; },
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      let thumbnailUrl: string | undefined;
      if (thumbFile) {
        const fd = new FormData(); fd.append("file", thumbFile);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        thumbnailUrl = data.data.url;
      }
      const { data } = await api.post("/products", {
        name, slug, description, price_idr: parseInt(price) * 1000, type, is_active: true,
        thumbnail_url: thumbnailUrl, delivery_type: deliveryType,
        delivery_url: deliveryType === "link" ? deliveryUrl : undefined,
      });
      const productId = data.data.id;
      for (const f of files) {
        const fd = new FormData(); fd.append("file", f);
        await api.post(`/products/${productId}/assets`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-products"] });
      setShowForm(false); setName(""); setSlug(""); setDescription(""); setPrice(""); setFiles([]); setThumbFile(null); setDeliveryType("file"); setDeliveryUrl("");
      toast.success(t.contentMgr.productCreated);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t.contentMgr.productCreatedFailed),
  });

  const addAsset = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const fd = new FormData(); fd.append("file", file);
      await api.post(`/products/${productId}/assets`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-products"] }); setUploadProductId(null); },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }),
  });

  const totalSales = products?.reduce((s, p) => s + (p.sales_count || 0), 0) || 0;

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Products" }]} className="mb-4" />
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight">{t.contentMgr.productsTitle}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">{interpolate(t.contentMgr.productsCount, { count: products?.length || 0 })}</span>
            {totalSales > 0 && <span className="text-xs text-green-500">{interpolate(t.contentMgr.productsSoldCount, { count: totalSales })}</span>}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="rounded-2xl">
          {showForm ? <><X className="mr-1.5 h-4 w-4" /> {t.contentMgr.close}</> : <><Plus className="mr-1.5 h-4 w-4" /> {t.contentMgr.createProduct}</>}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
            <Card className="border-primary/20">
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1.5 block">{t.contentMgr.productName}</label><Input placeholder={t.contentMgr.productNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div><label className="text-sm font-medium mb-1.5 block">{t.contentMgr.slug}</label><Input placeholder={t.contentMgr.slugPlaceholder} value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></div>
                </div>
                <Textarea placeholder={t.contentMgr.descriptionPlaceholder} value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1.5 block">{t.contentMgr.priceCredit}</label><Input type="number" placeholder={t.contentMgr.pricePlaceholder} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{t.contentMgr.typeLabel}</label>
                    <select className="w-full rounded-xl border border-primary-200 dark:border-primary-900/40 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="ebook">{t.contentMgr.ebook}</option><option value="preset">{t.contentMgr.preset}</option><option value="template">{t.contentMgr.template}</option><option value="other">{t.contentMgr.other}</option>
                    </select>
                  </div>
                </div>

                {/* Delivery toggle */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t.contentMgr.deliveryLabel}</label>
                  <div className="inline-flex rounded-xl bg-primary-50 dark:bg-navy-800 p-1">
                    <button onClick={() => setDeliveryType("file")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${deliveryType === "file" ? "bg-white dark:bg-navy-900 text-primary shadow-sm" : "text-gray-500"}`}>{t.contentMgr.fileDelivery}</button>
                    <button onClick={() => setDeliveryType("link")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${deliveryType === "link" ? "bg-white dark:bg-navy-900 text-primary shadow-sm" : "text-gray-500"}`}>{t.contentMgr.linkDelivery}</button>
                  </div>
                </div>
                {deliveryType === "link" && <Input placeholder={t.contentMgr.deliveryUrlPlaceholder} value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} />}

                <div className="flex gap-3">
                  <div>
                    <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => setThumbFile(e.target.files?.[0] || null)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => thumbRef.current?.click()} className="rounded-xl">
                      <Upload className="mr-1 h-4 w-4" /> {thumbFile ? `✅ ${thumbFile.name}` : t.contentMgr.thumbnail}
                    </Button>
                  </div>
                  <div>
                    <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="rounded-xl">
                      <Upload className="mr-1 h-4 w-4" /> {t.contentMgr.productFiles} {files.length > 0 && `(${files.length})`}
                    </Button>
                  </div>
                </div>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {files.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary-50 dark:bg-navy-800 rounded-lg px-2 py-1">
                        <FileText className="h-3 w-3" /> {f.name}
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-500 ml-0.5 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <Button onClick={() => createProduct.mutate()} disabled={createProduct.isPending || !name || !slug || !price} className="rounded-xl">
                  {createProduct.isPending ? t.contentMgr.saving : t.contentMgr.saveProduct}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product grid — 2 cols on desktop */}
      <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid sm:grid-cols-2 gap-3">
        {products?.map((p) => (
          <motion.div key={p.id} variants={staggerItem}>
            <Card clickable onClick={() => router.push(`/dashboard/products/${p.id}`)} className="h-full">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {p.thumbnail_url ? (
                    <img loading="lazy" src={p.thumbnail_url} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 flex items-center justify-center text-2xl shrink-0">
                      {p.type === "ebook" ? "📖" : p.type === "preset" ? "🎨" : p.type === "template" ? "📄" : "📦"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-[10px]">{p.type}</Badge>
                      <span className="text-sm font-bold text-primary">{formatCredit(p.price_idr)}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{interpolate(t.contentMgr.productsSoldCount, { count: p.sales_count })}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <input ref={assetRef} type="file" className="hidden" onChange={(e) => {
                      if (e.target.files?.[0] && uploadProductId) addAsset.mutate({ productId: uploadProductId, file: e.target.files[0] });
                    }} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setUploadProductId(p.id); setTimeout(() => assetRef.current?.click(), 100); }}>
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDialog title={t.contentMgr.deleteProductTitle} message={t.contentMgr.deleteProductMessage} onConfirm={() => deleteProduct.mutate(p.id)}>
                      {(open) => <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); open(); }}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>}
                    </ConfirmDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {products?.length === 0 && (
        <Card><CardContent className="p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3"><Package className="h-7 w-7 text-primary" /></div>
          <p className="font-display font-bold">{t.contentMgr.emptyProductsTitle}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.contentMgr.emptyProductsDesc}</p>
        </CardContent></Card>
      )}
    </div>
  );
}
