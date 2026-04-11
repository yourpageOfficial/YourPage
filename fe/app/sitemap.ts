import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://yourpage.id";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

async function fetchJSON(path: string) {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/cara-kerja`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/status`, lastModified: new Date(), changeFrequency: "daily", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const [creators, posts, products] = await Promise.all([
    fetchJSON("/creators/search?limit=500"),
    fetchJSON("/posts?status=published&visibility=public&limit=500"),
    fetchJSON("/products?status=active&limit=500"),
  ]);

  const creatorPages: MetadataRoute.Sitemap = creators.map((c: any) => ({
    url: `${BASE}/c/${c.username || c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((p: any) => ({
    url: `${BASE}/posts/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p: any) => ({
    url: `${BASE}/products/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...creatorPages, ...postPages, ...productPages];
}
