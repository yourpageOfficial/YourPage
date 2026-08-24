import type { Metadata } from "next";

// Next 15 delivers route params asynchronously.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://be:8080/api/v1"}/creators/${slug}`, { next: { revalidate: 60 } });
    const { data } = await res.json();
    if (!data) return { title: "Creator — YourPage" };
    return {
      title: `${data.display_name} (@${data.username}) — YourPage`,
      description: data.bio || `Dukung ${data.display_name} di YourPage. Beli konten eksklusif, kirim donasi, dan chat langsung.`,
      openGraph: {
        title: `${data.display_name} — YourPage`,
        description: data.bio || `Kreator di YourPage`,
        images: data.avatar_url ? [{ url: data.avatar_url, width: 200, height: 200 }] : [],
        type: "profile",
        siteName: "YourPage",
      },
      twitter: { card: "summary", title: data.display_name, description: data.bio || "Kreator di YourPage" },
    };
  } catch { return { title: "Creator — YourPage" }; }
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
