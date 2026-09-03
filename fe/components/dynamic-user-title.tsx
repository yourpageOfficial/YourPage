"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation, type TranslationDictionary } from "@/lib/internationalization";

type CompSocialKey = keyof TranslationDictionary["compSocial"];

const ROUTE_KEYS: Record<string, CompSocialKey> = {
  "/dashboard": "routeDashboard",
  "/dashboard/posts": "routeManagePosts",
  "/dashboard/products": "routeManageProducts",
  "/dashboard/sales": "routeSales",
  "/dashboard/donations": "routeDonations",
  "/dashboard/analytics": "routeAnalytics",
  "/dashboard/withdrawals": "routeWithdrawals",
  "/dashboard/profile": "routeCreatorProfile",
  "/dashboard/subscription": "routeSubscription",
  "/s": "routeSupporterDashboard",
  "/wallet": "routeWallet",
  "/chat": "routeChat",
  "/notifications": "routeNotifications",
  "/explore": "routeExplore",
  "/feed": "routeFeed",
};

export function DynamicUserTitle() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();

  useEffect(() => {
    const defaultTitle = t.compSocial.titleDefault;

    if (!user) {
      document.title = defaultTitle;
      return;
    }

    const userName = user.display_name || user.username || t.compSocial.titleCreator;
    const routeKey = ROUTE_KEYS[pathname];
    const pageName = routeKey
      ? t.compSocial[routeKey]
      : pathname.startsWith("/c/") ? t.compSocial.routeCreatorPage : "";

    if (pageName) {
      document.title = `${pageName} — ${userName} | YourPage`;
    } else {
      document.title = `${userName} | YourPage`;
    }
  }, [user, pathname, t]);

  return null;
}
