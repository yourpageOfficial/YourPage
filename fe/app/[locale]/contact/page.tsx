import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle } from "lucide-react";

export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-3 sm:px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        <div className="mt-8 space-y-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Mail className="h-8 w-8 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-medium">{t("email_label")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("email_value")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <MessageCircle className="h-8 w-8 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-medium">{t("whatsapp_label")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("phone_placeholder")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">{t("response_time")}</p>
      </main>
    </>
  );
}
