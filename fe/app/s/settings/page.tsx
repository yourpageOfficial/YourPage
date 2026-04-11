"use client";

import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ChangePasswordCard } from "@/components/change-password";

export default function SupporterSettings() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">Settings</h1>
      <div className="space-y-4">
        <CollapsibleCard title="👤 Profil" defaultOpen>
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar_url} name={user?.display_name} size="xl" />
            <div>
              <p className="font-medium">{user?.display_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
              <Badge className="mt-1">{user?.role}</Badge>
            </div>
          </div>
        </CollapsibleCard>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
