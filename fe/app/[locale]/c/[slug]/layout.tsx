import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ slug: string; locale: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "CreatorLayout" });
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://be:8080/api/v1";
    const res = await fetch(`${apiUrl}/creators/${slug}`, { next: { revalidate: 60 } });
    const data = await res.json();
    const c = data?.data;
    if (c) {
      return {
        title: `${c.display_name} (@${c.username}) — YourPage`,
        description: c.bio || t("meta_description", { name: c.display_name }),
        openGraph: {
          title: `${c.display_name} — YourPage`,
          description: c.bio || t("og_description", { name: c.display_name }),
          type: "profile",
          images: c.avatar_url ? [c.avatar_url] : [],
        },
      };
    }
  } catch {}
  return { title: t("fallback_title") };
}

export default function CreatorLayout({ children }: Props) {
  return <>{children}</>;
}
