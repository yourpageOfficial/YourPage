import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-3 sm:px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">Hubungi Kami</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Ada pertanyaan atau butuh bantuan? Hubungi tim YourPage.</p>
        <div className="mt-8 space-y-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Mail className="h-8 w-8 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">support@yourpage.id</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <MessageCircle className="h-8 w-8 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">+62 812-xxxx-xxxx</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">Respon dalam 1x24 jam di hari kerja.</p>
      </main>
    </>
  );
}
