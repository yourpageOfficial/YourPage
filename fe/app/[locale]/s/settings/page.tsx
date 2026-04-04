"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ChangePasswordCard } from "@/components/change-password";

export default function SupporterSettings() {
  const t = useTranslations("SupporterSettings");
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("settings_title")}</h1>
      <div className="space-y-4">
        <CollapsibleCard title={`👤 ${t("profile")}`} defaultOpen>
          <div className="flex items-center gap-4">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary shrink-0">{user?.display_name?.[0]}</div>
            )}
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
