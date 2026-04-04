"use client";

import { useRouter, usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "id" : "en";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
      title={locale === "en" ? "Switch to Indonesian" : "Switch to English"}
    >
      <Globe className="h-4 w-4" />
      <span className="uppercase text-xs">{locale}</span>
    </button>
  );
}
