import { Navbar } from "@/components/navbar";
import { PageTransition } from "@/components/ui/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hubungi Kami — YourPage", description: "Hubungi tim YourPage untuk pertanyaan atau bantuan." };

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight">Hubungi Kami</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Ada pertanyaan atau butuh bantuan?</p>
          <div className="mt-8 space-y-3">
            <Card hover><CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0"><Mail className="h-5 w-5 text-primary" /></div>
              <div className="text-left"><p className="font-semibold">Email</p><p className="text-sm text-gray-500 dark:text-gray-400">support@yourpage.id</p></div>
            </CardContent></Card>
            <Card hover><CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0"><MessageCircle className="h-5 w-5 text-green-500" /></div>
              <div className="text-left"><p className="font-semibold">WhatsApp</p><p className="text-sm text-gray-500 dark:text-gray-400">+62 812-xxxx-xxxx</p></div>
            </CardContent></Card>
          </div>
          <p className="mt-8 text-[10px] text-gray-400">Respon dalam 1x24 jam di hari kerja.</p>
        </main>
      </PageTransition>
    </>
  );
}
