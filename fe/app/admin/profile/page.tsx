"use client";

import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ChangePasswordCard } from "@/components/change-password";
import { useTranslation } from "@/lib/internationalization";

export default function AdminProfile() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-display font-black tracking-tight">{t.adminOverview.adminProfileTitle}</h1>
      <div className="space-y-4">
        <CollapsibleCard title={t.adminOverview.profileCardTitle} defaultOpen>
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar_url} name={user?.display_name} size="xl" />
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
