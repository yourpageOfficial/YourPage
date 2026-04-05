"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAdminList } from "@/lib/use-admin-list";
import { AdminList } from "@/components/admin-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink } from "lucide-react";
import { formatIDR, formatDate } from "@/lib/utils";
import Link from "next/link";

const sorts = [{ label: "Name", key: "name" }, { label: "Price", key: "price_idr" }, { label: "Sales", key: "sales_count" }, { label: "Type", key: "type" }, { label: "Date", key: "created_at" }];

export default function AdminProducts() {
  const qc = useQueryClient();
  const list = useAdminList("admin-products", "/admin/products");
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/admin/products/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }) });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Products</h1>
      <AdminList
        search={list.search} onSearch={list.setSearch} searchPlaceholder="Cari nama produk, tipe..."
        sortOptions={sorts} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.toggleSort}
        nextCursor={list.nextCursor} onNext={list.onNext} onPrev={list.onPrev} hasPrev={list.hasPrev}
        count={list.items.length}
      >
        <div className="space-y-2">
          {list.items.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge>{p.type}</Badge>
                    <span className="text-sm font-medium">{formatIDR(p.price_idr)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{p.sales_count} sold</span>
                    {!p.is_active && <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Nonaktif</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">by @{p.creator?.username || "?"} · {formatDate(p.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <Link href={`/products/${p.id}`}><Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button></Link>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {list.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada product.</p>}
        </div>
      </AdminList>
    </div>
  );
}
