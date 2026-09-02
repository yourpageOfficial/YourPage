"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { useTranslation } from "@/lib/internationalization";

const ChatContent = dynamic(() => import("./chat-content"), { ssr: false });

export default function ChatPage() {
  const { t } = useTranslation();

  return (
    <SectionErrorBoundary fallbackMessage={t.chat.loadFailed}>
      <Suspense fallback={<div className="p-8 text-center text-gray-500">{t.common.loading}</div>}>
        <ChatContent />
      </Suspense>
    </SectionErrorBoundary>
  );
}
