import type { Metadata } from "next";

type Props = { params: { slug: string }; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://be:8080/api/v1";
    const res = await fetch(`${apiUrl}/creators/${params.slug}`, { next: { revalidate: 60 } });
    const data = await res.json();
    const c = data?.data;
    if (c) {
      return {
        title: `${c.display_name} (@${c.username}) — YourPage`,
        description: c.bio || `Halaman kreator ${c.display_name} di YourPage`,
        openGraph: {
          title: `${c.display_name} — YourPage`,
          description: c.bio || `Dukung ${c.display_name} di YourPage`,
          type: "profile",
          images: c.avatar_url ? [c.avatar_url] : [],
        },
      };
    }
  } catch {}
  return { title: "Kreator — YourPage" };
}

export default function CreatorLayout({ children }: Props) {
  return <>{children}</>;
}
