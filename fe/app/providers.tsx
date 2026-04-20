"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/lib/toast";
import { useTranslation } from "@/lib/use-translation";

function ErrorToast({ message }: { message: string }) {
  useState(() => {
    toast.error(message);
  });
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const defaultError = t("common.error");

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        refetchOnWindowFocus: false,
        staleTime: 30000,
      },
      mutations: {
        retry: 0,
        onError: (error: any) => {
          const msg = error?.response?.data?.error || error?.message || defaultError;
          toast.error(msg);
        },
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}