import { Navbar } from "@/components/navbar";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-10 prose prose-sm sm:prose-base">
        <h1>Syarat & Ketentuan</h1>
        <p className="text-gray-500 dark:text-gray-400">Terakhir diperbarui: April 2026</p>

        <h2>1. Tentang YourPage</h2>
        <p>YourPage adalah platform monetisasi konten untuk kreator Indonesia. Dengan menggunakan layanan ini, Anda menyetujui syarat dan ketentuan berikut.</p>

        <h2>2. Akun</h2>
        <ul>
          <li>Anda harus berusia minimal 17 tahun untuk mendaftar.</li>
          <li>Informasi yang diberikan harus akurat dan terkini.</li>
          <li>Anda bertanggung jawab atas keamanan akun Anda.</li>
          <li>Satu orang hanya boleh memiliki satu akun.</li>
        </ul>

        <h2>3. Konten</h2>
        <ul>
          <li>Kreator bertanggung jawab penuh atas konten yang dipublikasikan.</li>
          <li>Dilarang mempublikasikan konten NSFW, kekerasan, ujaran kebencian, atau melanggar hukum.</li>
          <li>YourPage berhak menghapus konten dan menangguhkan akun yang melanggar.</li>
        </ul>

        <h2>4. Pembayaran & Fee</h2>
        <ul>
          <li>Platform fee sebesar 10% dikenakan pada setiap transaksi (post, produk, donasi).</li>
          <li>Harga yang ditetapkan kreator sudah termasuk PPN (inclusive).</li>
          <li>Credit yang dibeli tidak dapat dicairkan kembali.</li>
          <li>Minimum penarikan adalah Rp 100.000.</li>
          <li>KYC (verifikasi identitas) wajib untuk penarikan pertama.</li>
        </ul>

        <h2>5. Refund & Sengketa</h2>
        <ul>
          <li>Platform tidak menyediakan refund otomatis.</li>
          <li>Sengketa ditangani oleh admin secara manual.</li>
          <li>Dalam kasus chargeback, platform berhak memotong saldo kreator terkait.</li>
        </ul>

        <h2>6. Penangguhan</h2>
        <p>YourPage berhak menangguhkan atau menghapus akun yang melanggar ketentuan tanpa pemberitahuan sebelumnya.</p>

        <h2>7. Perubahan Ketentuan</h2>
        <p>YourPage dapat mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui platform.</p>
      </main>
    </>
  );
}
