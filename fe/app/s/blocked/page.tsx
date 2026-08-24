"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Ban, ShieldOff } from "lucide-react";
import type { UserBlock, ApiResponse } from "@/lib/types";

export default function BlockedUsersPage() {
  const qc = useQueryClient();

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserBlock[]>>("/follow/blocked");
      return data.data ?? [];
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (blockedId: string) => api.delete(`/follow/block/${blockedId}`),
    onSuccess: () => {
      toast.success("User berhasil di-unblock");
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
    },
    onError: () => toast.error("Gagal unblock user"),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-black flex items-center gap-2">
          <Ban className="h-6 w-6 text-red-500" />
          User yang Diblokir
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          User yang kamu blokir tidak bisa follow, chat, atau berinteraksi denganmu.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!blocks || blocks.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldOff className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Kamu belum memblokir siapapun.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {blocks?.map((block) => (
          <Card key={block.id}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={block.blocked_id} size="sm" />
                <div>
                  <p className="font-medium text-sm">{block.blocked_id}</p>
                  <p className="text-xs text-gray-400">
                    Diblokir {new Date(block.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => unblockMutation.mutate(block.blocked_id)}
                loading={unblockMutation.isPending}
              >
                Buka Blokir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
