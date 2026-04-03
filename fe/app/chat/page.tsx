"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const ChatContent = dynamic(() => import("./chat-content"), { ssr: false });

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
