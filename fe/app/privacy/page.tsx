import { Navbar } from "@/components/navbar";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-10 prose prose-sm sm:prose-base">
        <h1>Kebijakan Privasi</h1>
        <p className="text-gray-500 dark:text-gray-400">Terakhir diperbarui: April 2026</p>

        <h2>1. Data yang Kami Kumpulkan</h2>
        <ul>
          <li><strong>Akun:</strong> Email, username, password (terenkripsi).</li>
          <li><strong>Profil:</strong> Nama tampilan, bio, avatar (opsional).</li>
          <li><strong>KYC:</strong> Nama lengkap, nomor KTP, foto KTP (hanya untuk verifikasi penarikan).</li>
          <li><strong>Transaksi:</strong> Riwayat pembelian, donasi, dan penarikan.</li>
        </ul>

        <h2>2. Penggunaan Data</h2>
        <ul>
          <li>Menyediakan dan meningkatkan layanan platform.</li>
          <li>Memproses transaksi dan pembayaran.</li>
          <li>Verifikasi identitas untuk penarikan dana.</li>
          <li>Mengirim notifikasi terkait akun dan transaksi.</li>
        </ul>

        <h2>3. Perlindungan Data</h2>
        <ul>
          <li>Email tidak pernah ditampilkan di halaman publik.</li>
          <li>Password disimpan dalam bentuk hash (bcrypt).</li>
          <li>Data KTP hanya dapat diakses oleh admin untuk verifikasi.</li>
          <li>JWT hanya berisi user ID dan role — tidak ada data pribadi.</li>
          <li>Semua koneksi menggunakan HTTPS (production).</li>
        </ul>

        <h2>4. Penyimpanan</h2>
        <ul>
          <li>Data disimpan di server yang berlokasi di Indonesia.</li>
          <li>File media disimpan di object storage terenkripsi.</li>
          <li>Data tidak dijual atau dibagikan ke pihak ketiga.</li>
        </ul>

        <h2>5. Hak Pengguna</h2>
        <ul>
          <li>Anda dapat mengubah atau menghapus data profil kapan saja.</li>
          <li>Untuk penghapusan akun, hubungi admin.</li>
        </ul>

        <h2>6. Kontak</h2>
        <p>Pertanyaan tentang privasi dapat dikirim ke admin melalui platform.</p>
      </main>
    </>
  );
}
