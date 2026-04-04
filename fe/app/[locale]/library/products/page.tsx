"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import Link from "next/link";
import type { Product, PaginatedResponse } from "@/lib/types";

export default function LibraryProducts() {
  const t = useTranslations("LibraryProducts");
  const { data: products } = useQuery({
    queryKey: ["library-products"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>("/library/products");
      return data.data;
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("purchased_products")}</h1>
      <div className="space-y-3">
        {products?.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{p.name}</p>
                <Badge>{p.type}</Badge>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{formatIDR(p.price_idr)}</span>
              </div>
              <Link href={`/products/${p.id}/download`}>
                <Button size="sm">{t("download")}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {products?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_products")}</p>}
      </div>
    </div>
  );
}
