"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const ChatContent = dynamic(() => import("./chat-content"), { ssr: false });

export default function ChatPage() {
  const t = useTranslations("Chat");

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">{t("loading")}</div>}>
      <ChatContent />
    </Suspense>
  );
}
