import { Navbar } from "@/components/navbar";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kebijakan Privasi — YourPage", description: "Kebijakan privasi platform YourPage." };

const sections = [
  { id: "data", title: "1. Data yang Kami Kumpulkan", items: ["Akun: Email, username, password (terenkripsi).", "Profil: Nama tampilan, bio, avatar (opsional).", "KYC: Nama lengkap, nomor KTP, foto KTP (hanya untuk verifikasi penarikan).", "Transaksi: Riwayat pembelian, donasi, dan penarikan."] },
  { id: "penggunaan", title: "2. Penggunaan Data", items: ["Menyediakan dan meningkatkan layanan platform.", "Memproses transaksi dan pembayaran.", "Verifikasi identitas untuk penarikan dana.", "Mengirim notifikasi terkait akun dan transaksi."] },
  { id: "perlindungan", title: "3. Perlindungan Data", items: ["Email tidak pernah ditampilkan di halaman publik.", "Password disimpan dalam bentuk hash (bcrypt).", "Data KTP hanya dapat diakses oleh admin untuk verifikasi.", "JWT hanya berisi user ID dan role — tidak ada data pribadi.", "Semua koneksi menggunakan HTTPS (production)."] },
  { id: "penyimpanan", title: "4. Penyimpanan", items: ["Data disimpan di server yang berlokasi di Indonesia.", "File media disimpan di object storage terenkripsi.", "Data tidak dijual atau dibagikan ke pihak ketiga."] },
  { id: "hak", title: "5. Hak Pengguna", items: ["Anda dapat mengubah atau menghapus data profil kapan saja.", "Untuk penghapusan akun, hubungi admin."] },
  { id: "kontak", title: "6. Kontak", items: ["Pertanyaan tentang privasi dapat dikirim ke admin melalui platform."] },
];

export default function PrivacyPage() {
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
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-2">Kebijakan Privasi</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Terakhir diperbarui: April 2026</p>
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
