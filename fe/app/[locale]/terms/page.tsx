import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";

export default function TermsPage() {
  const t = useTranslations("Terms");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-10 prose prose-sm sm:prose-base">
        <h1>{t("title")}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t("last_updated")}</p>

        <h2>{t("about_title")}</h2>
        <p>{t("about_desc")}</p>

        <h2>{t("account_title")}</h2>
        <ul>
          <li>{t("account_rule1")}</li>
          <li>{t("account_rule2")}</li>
          <li>{t("account_rule3")}</li>
          <li>{t("account_rule4")}</li>
        </ul>

        <h2>{t("content_title")}</h2>
        <ul>
          <li>{t("content_rule1")}</li>
          <li>{t("content_rule2")}</li>
          <li>{t("content_rule3")}</li>
        </ul>

        <h2>{t("payment_title")}</h2>
        <ul>
          <li>{t("payment_rule1")}</li>
          <li>{t("payment_rule2")}</li>
          <li>{t("payment_rule3")}</li>
          <li>{t("payment_rule4")}</li>
          <li>{t("payment_rule5")}</li>
        </ul>

        <h2>{t("refund_title")}</h2>
        <ul>
          <li>{t("refund_rule1")}</li>
          <li>{t("refund_rule2")}</li>
          <li>{t("refund_rule3")}</li>
        </ul>

        <h2>{t("suspension_title")}</h2>
        <p>{t("suspension_desc")}</p>

        <h2>{t("changes_title")}</h2>
        <p>{t("changes_desc")}</p>
      </main>
    </>
  );
}
