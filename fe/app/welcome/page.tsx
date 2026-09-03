"use client";

import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/internationalization";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Package, Heart, Search, Wallet, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const welcome = t.welcomePage;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-accent-600" />
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight">{welcome.title}</h1>
        <p className="text-2xl font-black text-primary mt-1">{user?.display_name}</p>
        <p className="mt-3 text-gray-500 dark:text-gray-400">{welcome.accountCreated}</p>

        {user?.role === "creator" ? (
          <div className="mt-8 space-y-3 text-left">
            <StepCard icon={FileText} title={welcome.creator.createPost} desc={welcome.creator.createPostDesc} href="/dashboard/posts" color="text-blue-500" bg="bg-primary-50 dark:bg-primary-900/20" />
            <StepCard icon={Package} title={welcome.creator.uploadProduct} desc={welcome.creator.uploadProductDesc} href="/dashboard/products" color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" />
            <StepCard icon={Heart} title={welcome.creator.receiveDonation} desc={welcome.creator.receiveDonationDesc} href={`/c/${user?.creator_profile?.page_slug || user?.username}`} color="text-pink-500" bg="bg-pink-50 dark:bg-pink-900/20" />
            <Link href="/dashboard"><Button className="w-full mt-4 h-12 rounded-2xl" size="lg">{welcome.openDashboard} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3 text-left">
            <StepCard icon={Search} title={welcome.supporter.findCreators} desc={welcome.supporter.findCreatorsDesc} href="/explore" color="text-blue-500" bg="bg-primary-50 dark:bg-primary-900/20" />
            <StepCard icon={Wallet} title={welcome.supporter.topupCredit} desc={welcome.supporter.topupCreditDesc} href="/wallet/topup" color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" />
            <StepCard icon={FileText} title={welcome.supporter.buyContent} desc={welcome.supporter.buyContentDesc} href="/explore" color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" />
            <Link href="/s"><Button className="w-full mt-4 h-12 rounded-2xl" size="lg">{welcome.openDashboard} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        )}
      </main>
    </>
  );
}

function StepCard({ icon: Icon, title, desc, href, color, bg }: { icon: any; title: string; desc: string; href: string; color: string; bg: string }) {
  return (
    <Link href={href}>
      <Card clickable>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
