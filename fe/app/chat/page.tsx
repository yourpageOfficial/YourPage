"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { SectionErrorBoundary } from "@/components/section-error-boundary";

const ChatContent = dynamic(() => import("./chat-content"), { ssr: false });

export default function ChatPage() {
  return (
    <SectionErrorBoundary fallbackMessage="Chat gagal dimuat">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat...</div>}>
        <ChatContent />
      </Suspense>
    </SectionErrorBoundary>
  );
}
