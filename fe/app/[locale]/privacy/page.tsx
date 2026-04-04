import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";

export default function PrivacyPage() {
  const t = useTranslations("Privacy");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-10 prose prose-sm sm:prose-base">
        <h1>{t("title")}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t("last_updated")}</p>

        <h2>{t("data_collected_title")}</h2>
        <ul>
          <li><strong>{t("data_account")}</strong> {t("data_account_val")}</li>
          <li><strong>{t("data_profile")}</strong> {t("data_profile_val")}</li>
          <li><strong>{t("data_kyc")}</strong> {t("data_kyc_val")}</li>
          <li><strong>{t("data_transaction")}</strong> {t("data_transaction_val")}</li>
        </ul>

        <h2>{t("data_use_title")}</h2>
        <ul>
          <li>{t("data_use1")}</li>
          <li>{t("data_use2")}</li>
          <li>{t("data_use3")}</li>
          <li>{t("data_use4")}</li>
        </ul>

        <h2>{t("protection_title")}</h2>
        <ul>
          <li>{t("protection1")}</li>
          <li>{t("protection2")}</li>
          <li>{t("protection3")}</li>
          <li>{t("protection4")}</li>
          <li>{t("protection5")}</li>
        </ul>

        <h2>{t("storage_title")}</h2>
        <ul>
          <li>{t("storage1")}</li>
          <li>{t("storage2")}</li>
          <li>{t("storage3")}</li>
        </ul>

        <h2>{t("rights_title")}</h2>
        <ul>
          <li>{t("rights1")}</li>
          <li>{t("rights2")}</li>
        </ul>

        <h2>{t("contact_title")}</h2>
        <p>{t("contact_desc")}</p>
      </main>
    </>
  );
}
