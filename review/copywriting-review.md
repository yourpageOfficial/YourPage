# ✍️ Conversion Copywriting Review & Optimization Guide: YourPage Frontend

**Project:** YourPage — Platform Monetisasi Konten & Apresiasi Kreator Indonesia  
**Scope:** Seluruh antarmuka publik dan aplikasi di [`fe/`](file:///Users/doang/project/YourPage/fe)  
**Date:** 2026-09-02  
**Target File:** `review/copywriting-review.md`  
**Core Mission:** Mengubah copy teknis-mekanis (*"fitur apa yang dibuat"*) menjadi copy berbasis hasil, emosi, dan konversi (*"bagaimana kreator menghasilkan uang & fans merasa terhubung"*), serta memperbaiki inkonsistensi faktual di codebase.

---

## 1. Executive Summary & Copy Scorecard

YourPage memiliki proposisi produk yang sangat kuat: menyatukan **konten berbayar, toko file digital otomatis, donasi langsung, alert OBS overlay untuk live stream, chat privat berbayar, dan sistem credit QRIS** dalam satu tautan personal.

Namun, audit mendalam terhadap seluruh codebase di [`fe/`](file:///Users/doang/project/YourPage/fe) mengungkap bahwa copy saat ini masih didominasi perspektif **sistem/software builder** (menjelaskan fungsionalitas dan instruksi teknis), bukan dari sudut pandang **kebutuhan emosional kreator** (kebebasan finansial, hemat waktu verifikasi bukti transfer manual, kemandirian berkarya) maupun **dorongan fans** (kemudahan apresiasi instan via QRIS tanpa hambatan kartu kredit).

### 📊 Copy Scorecard

| Dimensi Audit | Skor | Temuan Utama | Target Standar Copywriting |
|---|:---:|---|---|
| **1. Hook & Headline Clarity** | **6.5 / 10** | Tagline *"Ubah Kontenmu Jadi Penghasilan"* terlalu umum dan banyak dipakai platform freelance. Kurang mengunci diferensiasi *"All-in-One Link"* lokal pengganti Saweria, KaryaKarsa, dan Gumroad sekaligus. | Komunikasikan proposisi nilai unik secara instan: 1 tautan untuk semua aliran cuan tanpa potongan bulanan. |
| **2. Benefits Over Features** | **5.5 / 10** | Fitur bento grid dan deskripsi produk masih berupa daftar teknis (contoh: *"Produk Digital: Jual e-book, preset, template"*). | Dinarasikan sebagai hasil bisnis: *"Toko Digital Otomatis 24 Jam: Upload sekali, kirim file instan saat kamu tidur"*. |
| **3. Call to Action (CTA) Strength** | **5.0 / 10** | Tombol di banyak halaman memakai kata kerja pasif/generik: *"Mulai Gratis Sekarang"*, *"Beli"*, *"Daftar"*, *"Submit"*. | Gunakan rumus aktif: *[Kata Kerja Aksi] + [Apa yang Didapat] + [Peredam Hambatan]*. |
| **4. Konsistensi & Objection Handling** | **4.5 / 10** | Ditemukan kontradiksi fatal: klaim pencairan *"24 jam"* di homepage vs *"1-3 hari kerja"* di FAQ, domain salah ketik `urpage.online`, dan Syarat & Ketentuan menyatakan fee flat 10% padahal sistem memakai tier 20%/10%/5%. | Satu standar data terpadu di seluruh halaman legal, onboarding, FAQ, dan landing page. |
| **5. Empty States & Dead Ends** | **4.0 / 10** | Pesan state kosong bertuliskan dingin: *"Belum ada post"*, *"Belum ada produk"*, *"Belum ada konten"* tanpa pemandu aksi atau tombol eksplorasi. | Ubah state kosong menjadi corong konversi (ajak follow, bagikan tautan, atau tawarkan chat request). |

---

## 2. Temuan Kritis & Inkonsistensi Faktual di Codebase

Sebelum memoles gaya bahasa, terdapat **4 inkonsistensi faktual** di frontend yang berisiko merusak kredibilitas dan memicu friksi bagi pengguna:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🚨 TEMUAN KRITIS DI FRONTEND CODEBASE                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Salah Nama Domain di Cara Kerja (fe/app/cara-kerja/page.tsx:26)                                      │
│    • Eksisting: "...link halaman kamu: urpage.online/c/username"                                        │
│    • Koreksi: Ganti ke "yourpage.id/c/username" agar seragam dengan halaman profil & legal.             │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. Kontradiksi Waktu Pencairan Dana                                                                     │
│    • Homepage (fe/app/page.tsx:26): "24 jam — Cairkan dana"                                             │
│    • Cara Kerja (fe/app/cara-kerja/page.tsx:79): "...ditransfer dalam 1-3 hari kerja ke rekening bank"     │
│    • Dampak: Pengguna bingung apakah saldo cair dalam 1x24 jam atau harus menunggu hingga 3 hari kerja. │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. Diskrepansi Biaya Platform di Legal Terms (fe/app/terms/page.tsx:11)                                │
│    • Terms tertulis: "Platform fee sebesar 10% dikenakan pada setiap transaksi (post, produk, donasi)." │
│    • Realita sistem & PRD: Free tier = 20%, Pro tier = 10%, Business tier = 5%.                         │
│    • Dampak: Risiko komplain hukum dari kreator Free tier yang dipotong 20% padahal Terms menulis 10%.  │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. Placeholder Nomor Telepon Kontak (fe/app/contact/page.tsx:26)                                       │
│    • Teks WhatsApp tertulis: "+62 812-xxxx-xxxx". Belum diganti nomor resmi layanan pelanggan.          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Profil Pengguna & Pemetaan Empati (Creator & Supporter)

Agar copy memiliki daya bujuk tinggi, pesan dibagi berdasarkan 3 persona utama kreator dan 1 persona supporter:

```
                                ┌───────────────────────────┐
                                │     PENGGUNA YOURPAGE     │
                                └─────────────┬─────────────┘
                 ┌────────────────────────────┼────────────────────────────┐
                 ▼                            ▼                            ▼
       🎮 Streamer & Gamer          📦 Kreator Aset Digital       📚 Edukator & Penulis
    • Butuh: Alert OBS, tips     • Butuh: Jual preset/e-book   • Butuh: Artikel eksklusif,
      instan QRIS, sound trigger.  otomatis, file anti-bajak.    komunitas member, private DM.
    • Kompetitor: Saweria        • Kompetitor: Gumroad/Karya   • Kompetitor: Substack/Patreon
```

### Matriks Kebutuhan & Sudut Pandang Copy

| Persona | Frustrasi Utama (*Pain Points*) | Hasil yang Diinginkan (*Dream Outcome*) | Sudut Copy Paling Mengonversi (*Winning Hook*) |
|---|---|---|---|
| **🎮 Streamer & Gamer** | Potongan platform besar, overlay sering delay, penonton malas top-up ribet. | Stream interaktif, penonton donasi 1-klik via GoPay/OVO/ShopeePay/BCA. | *"Pasang alert OBS dalam 30 detik. Siap live stream dan terima saweran QRIS hari ini."* |
| **📦 Kreator File Digital** | Capek kirim link manual lewat DM/WhatsApp setelah minta kirim bukti transfer bank. | Upload file sekali, sistem mengirim file aman detik itu juga saat pembeli membayar. | *"Jual karya digital otomatis 24/7 saat kamu tidur. Dilengkapi proteksi link berdurasi."* |
| **📚 Edukator & Penulis** | Sulit membangun membership bulanan lokal tanpa kartu kredit. | Pembaca setia berlangganan konten eksklusif dengan saldo Credit lokal. | *"Bangun komunitas pembaca setiamu tanpa biaya bulanan platform. Bayar fee kecil saat cuan."* |
| **☕ Supporter / Penggemar** | Proses pembayaran luar negeri rumit, harus punya kartu kredit Visa/Mastercard. | Dukung kreator idola dengan mudah pakai saldo e-wallet dan QRIS yang sudah ada di HP. | *"Dukung karya kreator favoritmu semudah scan QRIS. Akses konten eksklusif permanen di Library."* |

---

## 4. Audit Rinci Per Halaman & Drop-In Replacement Copy

---

### 📄 Halaman 1: Landing Page Utama ([`fe/app/page.tsx`](file:///Users/doang/project/YourPage/fe/app/page.tsx))

#### A. Above The Fold (Hero Section)

* **Badge Atas ([L68-71](file:///Users/doang/project/YourPage/fe/app/page.tsx#L68-L71)):**
  - *Saat ini:* `Platform #1 untuk Kreator Indonesia`
  - *Optimasi:* `⚡ Satu Link untuk Semua Aliran Penghasilanmu`

* **Headline (H1) ([L72-74](file:///Users/doang/project/YourPage/fe/app/page.tsx#L72-L74)):**
  - *Saat ini:* `Ubah Kontenmu Jadi Penghasilan`
  - *Opsi Kontrol Utama (All-in-One Solution):*
    ```tsx
    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.05] text-white text-balance">
      Terima Donasi, Jual Karya & <span className="text-accent">Bangun Komunitas</span> di Satu Link
    </h1>
    ```
  - *Opsi Penantang (Emotion / Stop Working for Free):*
    ```tsx
    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.05] text-white text-balance">
      Berhenti Berbagi Karyamu Gratis. <span className="text-accent">Saatnya Dihargai.</span>
    </h1>
    ```

* **Subheadline ([L75-77](file:///Users/doang/project/YourPage/fe/app/page.tsx#L75-L77)):**
  - *Saat ini:* `Jual konten eksklusif, terima donasi, chat berbayar — tanpa ribet. Mulai dalam 2 menit, gratis selamanya.`
  - *Optimasi:*
    ```tsx
    <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-xl leading-relaxed">
      Gantikan 3 platform terpisah dengan satu halaman personal. Terima pembayaran instan dari fans via QRIS, e-wallet, dan Bank Transfer tanpa biaya bulanan.
    </p>
    ```

* **Primary & Secondary CTAs ([L80-89](file:///Users/doang/project/YourPage/fe/app/page.tsx#L80-L89)):**
  - *Primary Saat Ini:* `Mulai Gratis Sekarang →`
  - *Primary Optimasi:*
    ```tsx
    <Link href="/register">
      <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">
        Klaim Link yourpage.id Kamu — Gratis <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Button>
    </Link>
    ```
  - *Secondary Saat Ini:* `Lihat Kreator`
  - *Secondary Optimasi:* `Jelajahi Karya Kreator`

* **Microcopy / Trust Badges ([L91-98](file:///Users/doang/project/YourPage/fe/app/page.tsx#L91-L98)):**
  - *Optimasi:* `["100% Gratis Selamanya", "Setup 2 Menit", "Support QRIS & Semua Bank"]`

#### B. Stat Strip ([`fe/app/page.tsx:22-27`](file:///Users/doang/project/YourPage/fe/app/page.tsx#L22-L27))
* **Saat ini:**
  - `1 Credit = Rp 1.000`
  - `5% Fee terendah`
  - `2 menit Setup halaman`
  - `24 jam Cairkan dana`
* **Optimasi:**
  - `Rp 0` — *Modal Awal (Gratis Selamanya)*
  - `Mulai 5%` — *Fee Paling Ringan di Indonesia*
  - `2 Menit` — *Halaman Siap Pasang di Bio*
  - `1x24 Jam` — *Pencairan Saldo Langsung ke Rekening*

#### C. How It Works (3 Langkah) ([`fe/app/page.tsx:29-33`](file:///Users/doang/project/YourPage/fe/app/page.tsx#L29-L33))
* **Langkah 1:** `Klaim Username Pilihanmu (2 Menit)` — *Daftar gratis dan dapatkan alamat personal yourpage.id/c/namamu.*
* **Langkah 2:** `Unggah Karya & Tentukan Harga` — *Pasang harga karya digital, atur target donasi, atau kunci postingan eksklusif.*
* **Langkah 3:** `Terima Cuan & Tarik ke Rekening` — *Fans membayar via QRIS/e-wallet lokal, saldo langsung masuk dompet dan siap ditarik ke bank kamu.*

#### D. Bento Grid Fitur ([`fe/app/page.tsx:35-44`](file:///Users/doang/project/YourPage/fe/app/page.tsx#L35-L44))
Ubah fokus dari deskripsi teknis menjadi keuntungan finansial langsung:

| Fitur | Copy Lama (Mekanik) | Copy Baru (Benefit & Outcome Driven) |
|---|---|---|
| **Post Berbayar** | *Konten eksklusif yang hanya bisa diakses setelah bayar.* | **Kunci Post Eksklusif:** Biarkan fans setia membayar 1-klik untuk membaca komik lanjutan, rekaman rahasia, atau tutorial premium. |
| **Produk Digital** | *Jual e-book, preset, template, course link, license key.* | **Toko File Otomatis 24 Jam:** Upload sekali, link unduhan aman terkirim otomatis detik itu juga ke pembeli saat kamu tidur. |
| **Donasi + Goal** | *Fans kirim donasi dengan pesan. Set target goal.* | **Target Apresiasi Transparan:** Ajak audiens patungan upgrade gear kamera atau PC gaming dengan visual progress bar. |
| **Chat Berbayar** | *DM dari fans, gratis atau berbayar per pesan.* | **Tanya-Jawab & Sesi Konsultasi:** Hargai waktumu dengan menetapkan tarif per pesan untuk sesi konsultasi atau sapaan personal. |
| **OBS Overlay** | *Notifikasi donasi saat live streaming.* | **Alert Live Stream Interaktif:** Buat stream makin seru dengan animasi kustom, pop-up pesan saweran, dan efek suara lucu. |
| **Konten Aman** | *Media private, watermark, blur saat tab switch.* | **Karya Bebas Pembajakan:** File aslimu terlindungi dengan tautan unduhan berdurasi, watermark dinamis, dan proteksi anti-screenshot. |
| **Analytics** | *Dashboard lengkap — penjualan, donasi, chart.* | **Pantau Pertumbuhan Real-Time:** Pantau siapa supporter paling loyal, produk paling laris, dan tren pendapatan bulananmu. |
| **Custom Page** | *Warna aksen, banner, social links — branding kamu.* | **Halaman Cantik Sesuai Brand:** Kustomisasi warna aksen, foto header, dan tautan sosial media agar halaman tampak profesional. |

#### E. Section Transparansi Fee ([`fe/app/page.tsx:160-166`](file:///Users/doang/project/YourPage/fe/app/page.tsx#L160-L166))
* **Judul Saat Ini:** `Fee Rendah. Sisanya Buat Kamu.`
* **Subheadline:** `Nggak ada biaya tersembunyi. Kamu selalu tahu persis berapa yang kamu bawa pulang dari tiap transaksi.`
* **Optimasi:**
  - **H2:** `Simpan Hingga 95% Hasil Karyamu. Tanpa Potongan Terselubung.`
  - **Sub:** `Platform lain memotong fee besar atau mewajibkan langganan mahal di muka. Di YourPage, kamu hanya membayar fee kecil saat sudah berhasil menghasilkan penjualan.`

---

### 📄 Halaman 2: Harga & Paket Langganan ([`fe/app/pricing/page.tsx`](file:///Users/doang/project/YourPage/fe/app/pricing/page.tsx))

#### A. Hero & Value Framing
* **Saat ini ([L47-51](file:///Users/doang/project/YourPage/fe/app/pricing/page.tsx#L47-L51)):**
  - `Transparent pricing` *(Inggris campur)*
  - `Pilih Paket yang Tepat — Mulai gratis, upgrade kapan saja. Makin tinggi tier, makin rendah fee-nya.`
* **Optimasi:**
  - **Badge:** `💎 Pilihan Paket Fleksibel`
  - **H1:** `Mulai Gratis Hari Ini, Upgrade Kapan Saja Saat Kamu Berkembang`
  - **Sub:** `Tanpa komitmen kartu kredit. Biaya paket dipotong dari saldo Credit tanpa perpanjangan otomatis yang menjebak.`

#### B. Framing Tiga Paket Layanan:
1. **Free Plan (Gratis Selamanya):**
   - *Sub:* Pilihan terbaik untuk kreator pemula yang ingin mulai monetisasi tanpa modal sepeser pun.
   - *CTA Button:* `Mulai Jualan Gratis` (Ganti dari *"Mulai Sekarang"*)
2. **Pro Plan (Rp 49.000 / bln) — 🔥 Paling Populer:**
   - *Sub:* Untuk kreator aktif yang ingin potongan fee lebih hemat (hanya 10%) dan branding halaman personal.
   - *Value Anchor:* Cukup 5x penjualan produk dalam sebulan untuk menutup biaya paket!
   - *CTA Button:* `Pilih Paket Pro`
3. **Business Plan (Rp 149.000 / bln):**
   - *Sub:* Maksimalkan profit untuk studio, kreator full-time, dan streamer dengan fee terendah 5% dan storage 50 GB.
   - *CTA Button:* `Pilih Paket Business`

---

### 📄 Halaman 3: Cara Kerja Platform ([`fe/app/cara-kerja/page.tsx`](file:///Users/doang/project/YourPage/fe/app/cara-kerja/page.tsx))

#### A. Perbaikan Faktual & Typo:
1. **Langkah 1 Kreator ([L26](file:///Users/doang/project/YourPage/fe/app/cara-kerja/page.tsx#L26)):**
   - *Sebelum:* `Username akan jadi link halaman kamu: urpage.online/c/username`
   - *Sesudah:* `Username akan jadi tautan tokomu: yourpage.id/c/namamu`
2. **Langkah 6 Pencairan Dana ([L31](file:///Users/doang/project/YourPage/fe/app/cara-kerja/page.tsx#L31)):**
   - *Sebelum:* `Verifikasi KYC (upload KTP), lalu tarik Credit ke rekening bank. Min 100 Credit = Rp 100.000.`
   - *Sesudah:* `Verifikasi identitas sekali (upload KTP), lalu tarik saldo kapan saja ke rekening bank atau e-wallet. Minimum penarikan 100 Credit (Rp 100.000).`
3. **Pencairan Dana di FAQ ([L79](file:///Users/doang/project/YourPage/fe/app/cara-kerja/page.tsx#L79)):**
   - *Sebelum:* `Setelah admin approve, dana ditransfer dalam 1-3 hari kerja ke rekening bank kamu.`
   - *Sesudah:* `Permintaan pencairan dana diproses dan ditransfer dalam 1x24 jam kerja langsung ke rekening bank kamu.`

#### B. FAQ Penenang Keraguan Pengguna (Objection-Busting FAQ):
Tambahkan atau perbarui 4 pertanyaan utama yang sering menghambat konversi:
* **Q1: "Apakah benar-benar tanpa modal awal?"**  
  *A1:* Ya! Mendaftar dan membuka halaman YourPage 100% gratis selamanya. Kami hanya mengambil potongan kecil saat kamu berhasil mendapatkan donasi atau penjualan. Jika belum ada penjualan, kamu tidak membayar apa pun.
* **Q2: "Metode pembayaran apa saja yang bisa digunakan pembeli/fans saya?"**  
  *A2:* Sangat lengkap dan ramah pengguna lokal! Fans bisa membayar via QRIS (GoPay, OVO, DANA, ShopeePay, LinkAja), Transfer Virtual Account Bank BCA, Mandiri, BRI, BNI, serta kartu debit/kredit.
* **Q3: "Apakah file digital yang saya jual aman dari pembajakan?"**  
  *A3:* Ya. Pembeli menerima tautan unduhan berdurasi yang kadaluarsa otomatis. Postingan berbayar juga dilengkapi proteksi blur saat tab browser berpindah dan pencegah klik kanan.
* **Q4: "Saya sudah punya akun donasi di tempat lain. Apakah bisa pindah ke YourPage?"**  
  *A4:* Sangat bisa! Kamu bisa menggunakan YourPage bersamaan atau memindahkan link bio akunmu dalam 2 menit untuk menikmati fee yang jauh lebih hemat (hingga 5%) serta fitur jualan produk digital otomatis yang tidak ada di platform donasi biasa.

---

### 📄 Halaman 4: Alur Registrasi & Onboarding ([`fe/app/register/page.tsx`](file:///Users/doang/project/YourPage/fe/app/register/page.tsx) & [`fe/app/welcome/page.tsx`](file:///Users/doang/project/YourPage/fe/app/welcome/page.tsx))

#### A. Sisi Kiri Banner Registrasi ([`fe/app/register/page.tsx:76-80`](file:///Users/doang/project/YourPage/fe/app/register/page.tsx#L76-L80))
* **Copy Eksisting:** `Mulai monetisasi kontenmu hari ini. Gratis selamanya, upgrade kapan saja.`
* **Copy Optimasi:**
  - **Judul:** `Rumah Terbaik untuk Karyamu.`
  - **Poin Unggulan:**
    - ✨ *Link personal siap dibagikan dalam 2 menit*
    - 🔒 *Proteksi file digital otomatis anti-bocor*
    - 💰 *Fee terendah di Indonesia, mulai 5%*
    - ⚡ *Terima pembayaran QRIS lokal seketika*

#### B. Pilihan Peran Pendaftaran ([`fe/app/register/page.tsx:15-18`](file:///Users/doang/project/YourPage/fe/app/register/page.tsx#L15-L18))
* **Supporter:**
  - *Copy Lama:* `Beli konten, kirim donasi, chat dengan kreator`
  - *Copy Baru:* **`☕ Saya Ingin Menikmati & Mendukung Karya`**  
    *Akses karya eksklusif, kirim pesan apresiasi donasi, dan simpan seluruh file di perpustakaan pribadimu.*
* **Creator:**
  - *Copy Lama:* `Jual konten, terima donasi, buka page sendiri`
  - *Copy Baru:* **`🎨 Saya Ingin Menjual Karya & Buka Halaman`**  
    *Klaim link halamanmu, jual e-book/preset otomatis, pasang alert live stream, dan cairkan pendapatan ke rekening.*

#### C. Microcopy Kode Referral ([`fe/app/register/page.tsx:140`](file:///Users/doang/project/YourPage/fe/app/register/page.tsx#L140))
* **Sebelum:** `🎁 Kamu dan teman yang mengajak akan dapat 10 Credit gratis!`
* **Sesudah:** `🎁 Bonus Terpasang: Kamu & temanmu masing-masing mendapatkan 10 Credit (Rp 10.000) gratis saat akun berhasil dibuat!`

#### D. Halaman Aktivasi / Welcome ([`fe/app/welcome/page.tsx`](file:///Users/doang/project/YourPage/fe/app/welcome/page.tsx))
Setelah sign up, dorong pengguna menyelesaikan setup dalam 60 detik:
1. **Langkah 1 (Bangun Kredibilitas):** `📸 Pasang Foto Profil & Bio Menarik` — *Kreator dengan profil lengkap mendapatkan 3x lebih banyak dukungan donasi.*
2. **Langkah 2 (Mulai Menghasilkan):** `📦 Unggah Produk Digital atau Post Pertama` — *Tawarkan preset, e-book, atau bagikan karya eksklusif pertamamu.*
3. **Langkah 3 (Distribusi):** `🔗 Pasang Link yourpage.id di Bio Media Sosial` — *Salin tautan tokomu ke Instagram, TikTok, Twitter/X, atau deskripsi YouTube.*

---

### 📄 Halaman 5: Halaman Toko Kreator & Paywall ([`fe/app/c/[slug]/page.tsx`](file:///Users/doang/project/YourPage/fe/app/c/[slug]/page.tsx) & [`fe/components/post-card.tsx`](file:///Users/doang/project/YourPage/fe/components/post-card.tsx))

#### A. Card Post Terkunci ([`fe/components/post-card.tsx:124-132`](file:///Users/doang/project/YourPage/fe/components/post-card.tsx#L124-L132))
* **Saat ini:**
  - *Teks:* `Konten berbayar`
  - *Tombol:* `Beli 10 Credit`
* **Kritik:** Terkesan seperti pengeluaran/beban biaya dingin, tanpa ada rasa penasaran (*curiosity hook*).
* **Optimasi:**
  - *Teks:* `🔒 Konten Spesial Terkunci`
  - *Subteks:* `Dukung kreator dengan sekali bayar untuk membuka akses penuh selamanya.`
  - *Tombol:* `Buka Akses Konten Ini (10 Credit) 🔓`
  - *Jika Saldo Kurang:* `Saldo Belum Cukup · Top-up 10 Credit (Rp 10.000) via QRIS →`

#### B. Modal Donasi ([`fe/app/c/[slug]/page.tsx:405-416`](file:///Users/doang/project/YourPage/fe/app/c/[slug]/page.tsx#L405-L416))
* **Judul Modal:** Ganti `Dukung [Nama]` menjadi `Beri Apresiasi untuk [Nama] ☕`
* **Success State:**
  - *Lama:* `Donasi terkirim! Terima kasih atas dukunganmu`
  - *Baru:* `🎉 Apresiasimu Berhasil Terkirim! Pesanmu sudah masuk ke dashboard [Nama Kreator]. Terima kasih telah mendukung karya lokal!`

#### C. Transformasi Empty States (Mengubah Dead-End Menjadi Peluang)
Hilangkan teks kosong yang dingin di seluruh antarmuka frontend:

| Halaman & Lokasi | Teks Saat Ini (Mati) | Teks Rekomendasi (Menggerakkan Aksi) |
|---|---|---|
| Tab Post Publik Kreator | `Belum ada post` | `✨ [Nama Kreator] sedang menyiapkan karya terbarunya. Klik tombol "Follow" di atas agar kamu mendapat notifikasi saat post pertama rilis!` |
| Tab Produk Kreator | `Belum ada produk` | `📦 Belum ada produk digital yang dijual saat ini. Ingin request materi atau preset tertentu? Kirim pesan lewat tombol "Chat".` |
| Feed Supporter ([`fe/app/s/page.tsx:76`](file:///Users/doang/project/YourPage/fe/app/s/page.tsx#L76)) | `Belum ada konten — Follow kreator untuk melihat konten mereka.` | `🌟 Feed kamu masih sepi! Temukan kreator inspiratif di bidang desain, edukasi, gaming, dan musik untuk kamu ikuti.` + Tombol: `Jelajahi Kreator Favorit →` |
| Library Produk ([`fe/app/library/products/page.tsx:39`](file:///Users/doang/project/YourPage/fe/app/library/products/page.tsx#L39)) | `Belum ada produk yang dibeli.` | `📚 Perpustakaan karyamu masih kosong. Beli e-book, preset, atau materi digital sekali dan simpan aksesnya di sini selamanya.` + Tombol: `Cari Karya Digital →` |
| Daftar Komentar Post ([`fe/app/posts/[id]/page.tsx:216`](file:///Users/doang/project/YourPage/fe/app/posts/%5Bid%5D/page.tsx#L216)) | `Belum ada komentar. Jadilah yang pertama!` | `💬 Belum ada komentar. Jadilah orang pertama yang menyapa dan meninggalkan apresiasi untuk karya ini!` |

---

### 📄 Halaman 6: Dompet, Top-Up & Penarikan Saldo ([`fe/app/wallet/topup/page.tsx`](file:///Users/doang/project/YourPage/fe/app/wallet/topup/page.tsx) & [`fe/app/dashboard/withdrawals/page.tsx`](file:///Users/doang/project/YourPage/fe/app/dashboard/withdrawals/page.tsx))

#### A. Edukasi Sistem Credit
* **Penegasan Nilai Tukar:** Pastikan selalu tertulis jelas di bagian atas formulir:
  > **`1 Credit = Rp 1.000`**  
  > *"Top-up sekali via QRIS/Bank, gunakan saldo Credit untuk membeli produk, membuka post, kirim saweran, atau langganan tanpa repot transfer bank berulang kali."*

#### B. Halaman Penarikan Saldo Kreator
* **Banner Jaminan & Ketenangan Pikiran:**
  Tambahkan instruksi terpadu sebelum tombol tarik:
  > **🛡️ Penarikan Dana Aman & Cepat**  
  > - Minimum penarikan: **100 Credit (Rp 100.000)**  
  > - Permintaan diproses dan ditransfer langsung ke rekening bank atau e-walletmu dalam **1x24 jam kerja**.  
  > - Pastikan nama rekening bank penerima sama dengan identitas KTP yang sudah diverifikasi.

---

### 📄 Halaman 7: Ketentuan Layanan & Kontak ([`fe/app/terms/page.tsx`](file:///Users/doang/project/YourPage/fe/app/terms/page.tsx) & [`fe/app/contact/page.tsx`](file:///Users/doang/project/YourPage/fe/app/contact/page.tsx))

#### A. Koreksi Pasal Fee di Terms of Service ([`fe/app/terms/page.tsx:11`](file:///Users/doang/project/YourPage/fe/app/terms/page.tsx#L11))
* **Saat ini (Salah):**
  `Platform fee sebesar 10% dikenakan pada setiap transaksi (post, produk, donasi).`
* **Koreksi Drop-in:**
  `Platform fee dikenakan pada setiap transaksi sukses berdasarkan tier keanggotaan kreator: Free (20%), Pro (10%), dan Business (5%). Harga yang ditetapkan kreator sudah termasuk seluruh biaya operasional platform.`

#### B. Perbaikan Kontak Pelanggan ([`fe/app/contact/page.tsx:26`](file:///Users/doang/project/YourPage/fe/app/contact/page.tsx#L26))
* **Saat ini:**
  `+62 812-xxxx-xxxx`
* **Koreksi:**
  Ganti dengan akun WhatsApp resmi YourPage atau arahkan sementara ke `support@yourpage.id` dengan respon jaminan: *"Tim kami membalas setiap pesan dalam waktu kurang dari 24 jam kerja."*

---

## 5. Matriks Kata Kerja Aksi (High-Converting CTA Library)

Seluruh tombol di frontend harus mengadopsi standar copy aksi berikut:

| Konteks Tombol | ❌ Copy Lama (Lemah / Pasif) | ✅ High-Converting Copy (Aktif & Bernilai) |
|---|---|---|
| **Landing Hero CTA** | `Mulai Gratis Sekarang` | `Klaim Link yourpage.id Kamu — Gratis →` |
| **Buka Post Berbayar** | `Beli 10 Credit` | `Buka Akses Konten Ini (10 Credit) 🔓` |
| **Beli Produk Digital** | `Beli Sekarang` | `Dapatkan File Instan Ini ⚡` |
| **Daftar Akun Baru** | `Daftar` / `Submit` | `Buat Akun Gratis Sekarang` |
| **Upgrade Paket** | `Upgrade` | `Tingkatkan Paket & Hemat Fee 🚀` |
| **Kirim Donasi** | `Kirim Donasi` | `Kirim Apresiasi ☕` |
| **Top-up Saldo** | `Top-up` | `Isi Saldo Credit via QRIS` |
| **Cairkan Saldo** | `Tarik Dana` | `Tarik Saldo ke Rekening Bank 💰` |

---

## 6. Rencana Tindak Lanjut Terjadwal (Implementation Roadmap)

### 🔴 P0 — Perbaikan Segera (Inkonsistensi & Risiko Hukum)
1. Perbaiki domain salah ketik `urpage.online` di [`fe/app/cara-kerja/page.tsx:26`](file:///Users/doang/project/YourPage/fe/app/cara-kerja/page.tsx#L26) menjadi `yourpage.id`.
2. Sinkronkan pasal fee di [`fe/app/terms/page.tsx:11`](file:///Users/doang/project/YourPage/fe/app/terms/page.tsx#L11) agar sesuai skema tier (20%, 10%, 5%).
3. Seragamkan klaim waktu pencairan saldo di seluruh aplikasi menjadi *"Diproses dalam 1x24 jam kerja"*.
4. Ganti placeholder nomor telepon `+62 812-xxxx-xxxx` di [`fe/app/contact/page.tsx:26`](file:///Users/doang/project/YourPage/fe/app/contact/page.tsx#L26).

### 🟡 P1 — Optimasi Konversi Utama (Dampak Signifikan)
1. Pasang Headline baru, Subheadline, dan CTA *"Klaim Link yourpage.id Kamu"* di Hero Section [`fe/app/page.tsx`](file:///Users/doang/project/YourPage/fe/app/page.tsx).
2. Tulis ulang 8 item fitur di Bento Grid `fe/app/page.tsx` menjadi copy berorientasi benefit/hasil.
3. Hapus istilah bahasa Inggris yang tercampur (`"Transparent pricing"`) di [`fe/app/pricing/page.tsx`](file:///Users/doang/project/YourPage/fe/app/pricing/page.tsx).
4. Perbarui copy paywall di [`fe/components/post-card.tsx`](file:///Users/doang/project/YourPage/fe/components/post-card.tsx) dan [`fe/app/posts/[id]/page.tsx`](file:///Users/doang/project/YourPage/fe/app/posts/%5Bid%5D/page.tsx) agar lebih menarik rasa penasaran fans.

### 🟢 P2 — Peningkatan Retensi & Microcopy
1. Perbarui deskripsi pilihan peran (Creator vs Supporter) di [`fe/app/register/page.tsx`](file:///Users/doang/project/YourPage/fe/app/register/page.tsx).
2. Terapkan copy edukatif dan tombol CTA pada seluruh empty states di Feed, Library, dan Halaman Kreator.
3. Perjelas kartu aksi onboarding 60 detik di [`fe/app/welcome/page.tsx`](file:///Users/doang/project/YourPage/fe/app/welcome/page.tsx).
