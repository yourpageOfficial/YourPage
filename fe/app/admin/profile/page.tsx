"use client";

import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ChangePasswordCard } from "@/components/change-password";

export default function AdminProfile() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin Profile</h1>
      <div className="space-y-4">
        <CollapsibleCard title="👤 Profil" defaultOpen>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-700 shrink-0">{user?.display_name?.[0]}</div>
            <div>
              <p className="text-xl font-bold">{user?.display_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
              <Badge className="mt-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{user?.role}</Badge>
            </div>
          </div>
        </CollapsibleCard>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
