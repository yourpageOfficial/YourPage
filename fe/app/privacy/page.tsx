"use client";
import { useTranslation } from "@/lib/internationalization";
import { Navbar } from "@/components/navbar";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";

const sectionIds = ["data", "penggunaan", "perlindungan", "penyimpanan", "hak", "kontak"] as const;

export default function PrivacyPage() {
  const { t } = useTranslation();
  const priv = t.legal.privacy;
  const sections = [
    { id: sectionIds[0], title: priv.section1Title, items: [priv.section1Item1, priv.section1Item2, priv.section1Item3, priv.section1Item4] },
    { id: sectionIds[1], title: priv.section2Title, items: [priv.section2Item1, priv.section2Item2, priv.section2Item3, priv.section2Item4] },
    { id: sectionIds[2], title: priv.section3Title, items: [priv.section3Item1, priv.section3Item2, priv.section3Item3, priv.section3Item4, priv.section3Item5] },
    { id: sectionIds[3], title: priv.section4Title, items: [priv.section4Item1, priv.section4Item2, priv.section4Item3] },
    { id: sectionIds[4], title: priv.section5Title, items: [priv.section5Item1, priv.section5Item2] },
    { id: sectionIds[5], title: priv.section6Title, items: [priv.section6Item1] },
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
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-2">{t.legal.privacyTitle}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t.legal.lastUpdated}</p>
            {sections.map(s => (
              <section key={s.id} id={s.id} className="mb-8 scroll-mt-20">
                <h2 className="text-lg font-black mb-3">{s.title}</h2>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
                  {s.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            ))}
          </main>
        </div>
      </PageTransition>
      <ScrollToTop />
    </>
  );
}
