"use client";
import { useTranslation } from "@/lib/internationalization";
import { Navbar } from "@/components/navbar";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";

const sectionIds = ["tentang", "akun", "konten", "pembayaran", "refund", "penangguhan", "perubahan"] as const;

export default function TermsPage() {
  const { t } = useTranslation();
  const terms = t.legal.terms;
  const sections = [
    { id: sectionIds[0], title: terms.section1Title, content: terms.section1Content },
    { id: sectionIds[1], title: terms.section2Title, items: [terms.section2Item1, terms.section2Item2, terms.section2Item3, terms.section2Item4] },
    { id: sectionIds[2], title: terms.section3Title, items: [terms.section3Item1, terms.section3Item2, terms.section3Item3] },
    { id: sectionIds[3], title: terms.section4Title, items: [terms.section4Item1, terms.section4Item2, terms.section4Item3, terms.section4Item4, terms.section4Item5] },
    { id: sectionIds[4], title: terms.section5Title, items: [terms.section5Item1, terms.section5Item2, terms.section5Item3] },
    { id: sectionIds[5], title: terms.section6Title, content: terms.section6Content },
    { id: sectionIds[6], title: terms.section7Title, content: terms.section7Content },
  ];

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-10 flex gap-8">
          <nav className="hidden lg:block w-48 shrink-0 sticky top-20 self-start" aria-label="Table of contents">
            <ul className="space-y-2 text-sm">
              {sections.map(s => (
                <li key={s.id}><a href={`#${s.id}`} className="text-gray-500 hover:text-primary transition-colors">{s.title}</a></li>
              ))}
            </ul>
          </nav>
          <main className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-2">{t.legal.termsTitle}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t.legal.lastUpdated}</p>
            {sections.map(s => (
              <section key={s.id} id={s.id} className="mb-8 scroll-mt-20">
                <h2 className="text-lg font-black mb-3">{s.title}</h2>
                {"content" in s && <p className="text-sm text-gray-600 dark:text-gray-400">{s.content}</p>}
                {"items" in s && s.items && (
                  <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
                    {s.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </main>
        </div>
      </PageTransition>
      <ScrollToTop />
    </>
  );
}
