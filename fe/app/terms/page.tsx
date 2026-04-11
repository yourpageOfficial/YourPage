import { Navbar } from "@/components/navbar";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Syarat & Ketentuan — YourPage", description: "Syarat dan ketentuan penggunaan platform YourPage." };

const sections = [
  { id: "tentang", title: "1. Tentang YourPage", content: "YourPage adalah platform monetisasi konten untuk kreator Indonesia. Dengan menggunakan layanan ini, Anda menyetujui syarat dan ketentuan berikut." },
  { id: "akun", title: "2. Akun", items: ["Anda harus berusia minimal 17 tahun untuk mendaftar.", "Informasi yang diberikan harus akurat dan terkini.", "Anda bertanggung jawab atas keamanan akun Anda.", "Satu orang hanya boleh memiliki satu akun."] },
  { id: "konten", title: "3. Konten", items: ["Kreator bertanggung jawab penuh atas konten yang dipublikasikan.", "Dilarang mempublikasikan konten NSFW, kekerasan, ujaran kebencian, atau melanggar hukum.", "YourPage berhak menghapus konten dan menangguhkan akun yang melanggar."] },
  { id: "pembayaran", title: "4. Pembayaran & Fee", items: ["Platform fee sebesar 10% dikenakan pada setiap transaksi (post, produk, donasi).", "Harga yang ditetapkan kreator sudah termasuk PPN (inclusive).", "Credit yang dibeli tidak dapat dicairkan kembali.", "Minimum penarikan adalah Rp 100.000.", "KYC (verifikasi identitas) wajib untuk penarikan pertama."] },
  { id: "refund", title: "5. Refund & Sengketa", items: ["Platform tidak menyediakan refund otomatis.", "Sengketa ditangani oleh admin secara manual.", "Dalam kasus chargeback, platform berhak memotong saldo kreator terkait."] },
  { id: "penangguhan", title: "6. Penangguhan", content: "YourPage berhak menangguhkan atau menghapus akun yang melanggar ketentuan tanpa pemberitahuan sebelumnya." },
  { id: "perubahan", title: "7. Perubahan Ketentuan", content: "YourPage dapat mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui platform." },
];

export default function TermsPage() {
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
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-2">Syarat & Ketentuan</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Terakhir diperbarui: April 2026</p>
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
