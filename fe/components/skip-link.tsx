"use client";

import { useTranslation } from "@/lib/use-translation";

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main" className="skip-to-main" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      {t("layout.skip_to_main")}
    </a>
  );
}