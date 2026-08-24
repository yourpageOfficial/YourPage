# Conversion Copywriting Review & Optimization Guide: YourPage

**Project:** YourPage (Platform All-in-One Monetisasi Konten & Apresiasi Kreator Indonesia)  
**Date:** 2026-08-24  
**Reviewer:** Conversion Copywriting Specialist  
**Document Output:** `review/copywriting-review.md`  
**Target Scope:** Entire Frontend (`fe/app/*`, `fe/components/*`)  
**Core Mission:** Transform technical software descriptions into benefit-driven, high-converting copy that turns casual visitors into active creators and loyal supporters.

---

## 1. Executive Summary & Copy Scorecard

YourPage possesses an all-in-one product suite (donations, digital downloads, memberships, OBS overlay alerts, paid DM chat, and credit wallet). However, much of the current copy speaks from the **software builder's perspective** (describing functional mechanics) rather than the **creator's perspective** (describing income autonomy, fan relationships, and eliminating platform chaos).

### Copywriting Audit Scorecard

| Dimension | Current Rating | Finding & Gap | Target State |
|---|---|---|---|
| **1. Headline Clarity & Hook** | 🟡 7 / 10 | *"Ubah Kontenmu Jadi Penghasilan"* is clean but generic. Lacks the differentiated "All-in-One" positioning against fragmented competitors. | Instantly convey the single-link replacement for Saweria, KaryaKarsa, and Gumroad. |
| **2. Benefits Over Features** | 🔴 5 / 10 | Features are listed as dry mechanics (e.g. *"Produk Digital: Jual e-book, preset..."*) rather than automated revenue outcomes. | Frame every feature as automated creator income and time saved. |
| **3. Call to Action (CTA) Punch** | 🟡 6 / 10 | Generic *"Mulai Sekarang"* and *"Daftar Gratis"* lack specific value propositions and friction reducers. | High-intent action verbs: *"Klaim Link yourpage.id Kamu"*, *"Mulai Jualan Gratis"*. |
| **4. Objection Handling & Trust** | 🔴 5 / 10 | Inconsistent payout timelines (*"Cairkan 24 Jam"* on homepage vs *"1-3 hari kerja"* on `/cara-kerja`), domain typos (`urpage.online`). | Crystal-clear payout guarantees, QRIS logos, bank lists, and zero monthly fee assurance. |
| **5. Voice of Customer (VoC)** | 🟢 8 / 10 | Natural Indonesian creator vocabulary (*"Kreator"*, *"Supporter"*, *"Karya"*, *"Overlay Stream"*). | Strengthen with relatable creator pain points and celebratory microcopy. |

---

## 2. Creator Persona & Empathy Mapping

To write copy that converts, we speak directly to three dominant creator segments in Indonesia:

```
                               ┌───────────────────────────┐
                               │     YOURPAGE CREATORS     │
                               └─────────────┬─────────────┘
                ┌────────────────────────────┼────────────────────────────┐
                ▼                            ▼                            ▼
      🎮 The Live Streamer         📦 The Digital Seller        📚 The Community Educator
   • Needs: OBS alert overlay,  • Needs: Preset/e-book sales, • Needs: Exclusive articles/
     instant tips via QRIS,       automated download links,     tier memberships, private
     sound triggers for hype.     file piracy protection.       chat consultation.
   • Competitor: Saweria        • Competitor: KaryaKarsa/     • Competitor: Patreon /
                                  Gumroad / Manual WA           Substack
```

### Empathy Map

| Element | The Live Streamer | The Digital Creator | The Community Educator |
|---|---|---|---|
| **Pains & Frustrations** | *"Platform potongan fee besar, overlay sering delay, penonton malas top-up ribet."* | *"Capek kirim file manual lewat DM/WhatsApp setelah bukti transfer dicek satu-satu."* | *"Ingin buat konten berbayar tapi tidak punya waktu dan keahlian bikin website sendiri."* |
| **Desired Outcome** | Live stream interaktif, sound alert lucu, penonton donasi 1-klik via GoPay/OVO/QRIS. | Upload file sekali, link download aman terkirim otomatis detik itu juga saat pembeli bayar. | Halaman komunitas eksklusif di mana fans setia berlangganan bulanan tanpa potongan gila-gilaan. |
| **Core Objection** | *"Apakah setup OBS-nya ribet?"* | *"Apakah file saya bisa dicuri/dibajak?"* | *"Apakah ada biaya langganan bulanan jika belum ada pembeli?"* |
| **Winning Copy Angle** | *"Copy link overlay ke OBS dalam 30 detik. Siap live stream hari ini."* | *"Upload sekali, jual otomatis 24/7. Dilengkapi proteksi anti-bajak dan link sekali pakai."* | *"Rp 0 selamanya. Tanpa biaya bulanan. Kamu hanya bayar fee kecil saat sudah menghasilkan."* |

---

## 3. Above-the-Fold & Hero Teardown

### Current Homepage Hero Copy (`fe/app/page.tsx`)

```
[Badge] Sparkles · Platform #1 untuk Kreator Indonesia
[H1] Ubah Kontenmu Jadi Penghasilan
[Subheadline] Jual konten eksklusif, terima donasi, chat berbayar — tanpa ribet. Mulai dalam 2 menit, gratis selamanya.
[Primary CTA] Mulai Gratis Sekarang →
[Secondary CTA] Lihat Kreator
[Microcopy] Tanpa kartu kredit · Tanpa biaya bulanan · Langsung jualan
```

### 🔍 Critical Copy Critique:
1. **Headline:** Terlalu pasif dan umum. Platform freelance, agensi, dan platform lain juga menggunakan klaim *"Ubah konten jadi penghasilan"*.
2. **Subheadline:** Mengulang kata *"konten"* dan *"berbayar"*. Tidak menyebut kemudahan pembayaran lokal (QRIS, e-wallet).
3. **Primary CTA:** *"Mulai Gratis Sekarang"* terkesan umum.
4. **Social Proof Cards:** Angka *"1 Credit = Rp 1.000"* dan *"5% Fee terendah"* bagus, namun perlu dikontekskan dengan simulasi penghasilan riil.

---

### 🚀 3 High-Converting Hero Alternatives (A/B Test Ready)

#### Option A: The "All-in-One Creator Hub" (Recommended Primary Control)
> **Badge:** ⚡ Satu Link untuk Semua Kebutuhan Cuanmu  
> **Headline (H1):** Terima Donasi, Jual File Digital & Bangun Komunitas di Satu Halaman  
> **Subheadline:** Gantikan 3 platform terpisah dengan satu link YourPage yang elegan. Terima pembayaran instan dari fans via QRIS, GoPay, OVO, DANA, dan Transfer Bank.  
> **Primary CTA:** Klaim Link Kreatormu — Gratis →  
> **Secondary CTA:** Lihat Demo Halaman  
> **Microcopy:** 🚀 Setup 2 menit · 100% Gratis Tanpa Biaya Bulanan · Fee Rendah Mulai 5%  
> **Rationale:** Mengangkat solusi *"All-in-One"* yang langsung menyelesaikan masalah fragmentasi tools kreator di Indonesia.

#### Option B: The "Fair Value / Stop Working for Free" (High Emotion Hook)
> **Badge:** 🎨 Waktunya Karyamu Dihargai Lebih  
> **Headline (H1):** Berhenti Membagikan Karya Terbaikmu Secara Cuma-Cuma  
> **Subheadline:** Buka pintu apresiasi dari penggemar setiastamu. Kunci konten eksklusif, pasang alert live stream seru, dan cairkan penghasilanmu langsung ke rekening kapan saja.  
> **Primary CTA:** Mulai Hasilkan Uang Sekarang →  
> **Secondary CTA:** Jelajahi Karya Kreator  
> **Microcopy:** 🎁 Bonus 10 Credit gratis untuk 100 pendaftar pertama hari ini  
> **Rationale:** Menyentuh rasa lelah kreator yang rutin memproduksi karya namun belum menerima apresiasi finansial yang layak.

#### Option C: The "Outcome & Fee Maximizer" (High ROI for Pro Creators)
> **Badge:** 💰 Platform Monetisasi Kreator dengan Fee Terendah  
> **Headline (H1):** Jual Karya Digital Lebih Cepat, Simpan 95% Penghasilanmu  
> **Subheadline:** Otomatisasi pengiriman e-book, preset, dan komikmu 24/7 tanpa repot cek mutasi bank manual. Dana langsung masuk wallet dan siap ditarik ke rekeningmu.  
> **Primary CTA:** Buka Toko Digital Gratis →  
> **Secondary CTA:** Hitung Potensi Penghasilan  
> **Microcopy:** Tanpa biaya langganan bulanan · Payout cepat 1x24 jam · Support seluruh bank RI  
> **Rationale:** Menargetkan kreator yang sudah punya produk dan ingin efisiensi operasional serta fee platform yang jauh lebih hemat dari kompetitor.

---

## 4. Feature-to-Benefit Copy Transformations

Ubah penjelasan fitur teknis menjadi narasi keuntungan finansial dan kebebasan waktu:

```
   [ FITUR TEKNIS ] ──────────────► [ BENEFIT & OUTCOME KREATOR ]
   "Apa yang dibuat software"          "Apa untungnya buat kantong dan hidup kreator"
```

| Fitur Produk | Copy Lama (Feature-Driven) | Copy Baru (Benefit & Outcome Driven) | Emosi / Nilai Kunci |
|---|---|---|---|
| **Post Berbayar** | Konten eksklusif yang hanya bisa diakses setelah bayar. | **Kunci Konten Spesial:** Fans bayar 1-klik untuk membuka bab komik lanjutan, rekaman podcast rahasia, atau tutorial premiummu. | Eksklusivitas & Rasa Penasaran |
| **Produk Digital** | Jual e-book, preset, template, course link, license key. | **Jual Otomatis 24 Jam:** Unggah file sekali, biarkan sistem mengirim link download aman ke pembeli secara otomatis saat kamu tidur. | Passive Income & Efisiensi |
| **Donasi & Goal** | Fans kirim donasi dengan pesan. Set target goal. | **Kumpulkan Dukungan Target:** Ajak fans patungan untuk upgrade gear kamera, PC gaming, atau project impian dengan progress bar transparan. | Kebersamaan & Transparansi |
| **Chat DM Berbayar** | DM dari fans, gratis atau berbayar per pesan. | **Monetisasi Tanya-Jawab & Konsultasi:** Hargai waktumu dengan menetapkan tarif per pesan untuk sesi konsultasi atau sapaan personal. | Menghargai Waktu Pribadi |
| **OBS Overlay** | Notifikasi donasi saat live streaming. | **Alert Stream Interaktif:** Tampilkan pop-up animasi keren, efek suara kustom, dan GIF lucu di layar live stream setiap kali donasi masuk. | Hype & Interaksi Penonton |
| **Proteksi Konten** | Media private, watermark, blur saat tab switch. | **Karya Aman Bebas Pembajakan:** File aslimu terlindungi dengan watermark dinamis, tautan unduhan berdurasi, dan proteksi anti-screenshot. | Keamanan & Ketenangan Pikiran |
| **Sistem Credit** | 1 Credit = Rp 1.000. Satu mata uang untuk semua transaksi. | **Transaksi Mulus Sekali Top-Up:** Fans cukup top-up saldo via QRIS sekali untuk bebas belanja produk, tip, dan langganan tanpa input kartu berulang. | Kemudahan Pembeli |

---

## 5. Page-by-Page Line Audits & Drop-in Copy

---

### 📄 1. Homepage (`fe/app/page.tsx`)

#### Section: Social Proof & Key Numbers
* **Current:** `1 Credit = Rp 1.000` · `5% Fee terendah` · `2 menit Setup halaman` · `24 jam Cairkan dana`
* **Copy Optimization:**
  - `Rp 0` — *Modal Awal (Gratis Selamanya)*
  - `5%` — *Fee Terendah di Indonesia*
  - `2 Menit` — *Halaman Siap Pakai*
  - `1x24 Jam` — *Pencairan Saldo ke Semua Bank*

#### Section: Bento Grid Header
* **Current:** `Berhenti Kasih Konten Gratis — Kamu sudah buat konten bagus. Saatnya dihargai.`
* **Copy Optimization:**
  - **H2:** `Semua Cara Hasilkan Uang, Ada di Satu Link`
  - **Sub:** `Dari donasi live stream hingga toko produk digital otomatis — pilih cara monetisasi yang paling pas dengan gaya kontenmu.`

#### Section: 3 Steps Timeline
* **Current:**
  - Step 1: `Daftar Gratis — Buat akun, pilih username, atur profil. Selesai dalam 2 menit.`
  - Step 2: `Upload & Atur Harga — Buat post berbayar, upload produk, set harga dalam Credit.`
  - Step 3: `Terima Uang — Fans beli, donasi, chat. Credit masuk wallet, cairkan ke rekening.`
* **Copy Optimization:**
  - Step 1: `Klaim Username Pilihanmu (2 Menit)` — *Daftar gratis dan dapatkan link personal `yourpage.id/c/namamu`.*
  - Step 2: `Unggah Karya & Tentukan Harga` — *Pasang harga karya digital, atur target donasi, atau kunci postingan eksklusif.*
  - Step 3: `Terima Penghasilan & Tarik ke Rekening` — *Fans membayar via QRIS/e-wallet lokal, saldo langsung masuk dompet dan siap ditarik ke bank kamu.*

---

### 📄 2. Halaman Harga & Tier (`fe/app/pricing/page.tsx`)

#### Value Framing for Each Plan
* **Free Plan:**
  - **Headline:** *Mulai Tanpa Modal*
  - **Sub:** *Cocok untuk kreator yang baru memulai dan ingin menguji respon penggemar.*
  - **CTA:** `Mulai Gratis Sekarang`
* **Pro Plan (Recommended / 🔥 Populer):**
  - **Headline:** *Tumbuh Lebih Cepat & Hemat Fee*
  - **Sub:** *Untuk kreator aktif yang ingin potongan fee lebih ringan (hanya 10%) dan branding halaman personal.*
  - **CTA:** `Pilih Paket Pro`
* **Business Plan:**
  - **Headline:** *Maksimalkan Profit Studio & Top Creator*
  - **Sub:** *Simpan 95% pendapatanmu (fee terendah 5%), unlimited produk, auto-reply chat, dan prioritas pencairan.*
  - **CTA:** `Pilih Paket Business`

#### Pricing FAQ Reassurance Block
Tambahkan microcopy di bawah tabel perbandingan harga:
> *"Semua paket dapat dicoba secara fleksibel. Pembayaran paket Pro/Business menggunakan saldo Credit yang bisa kamu top-up kapan saja tanpa langganan otomatis yang menjebak."*

---

### 📄 3. Halaman Cara Kerja (`fe/app/cara-kerja/page.tsx`)

#### Critical Consistency & Trust Fixes:
1. **Domain Consistency:** Ganti seluruh teks contoh `urpage.online/c/username` menjadi `yourpage.id/c/username`.
2. **Pencairan Saldo:** Ubah kalimat `admin approve dalam 24 jam lalu transfer 1-3 hari` menjadi standar terpadu:
   > *"Permintaan pencairan dana diproses dan ditransfer dalam 1x24 jam kerja langsung ke rekening Bank BCA, Mandiri, BRI, BNI, Jago, SeaBank, GoPay, OVO, atau DANA kamu."*
3. **Keamanan Konten:** Tambahkan jaminan:
   > *"Setiap file yang dibeli pembeli tersimpan permanen di Library mereka, sehingga kamu tidak perlu repot mengirim ulang file jika ada pembeli yang kehilangan link."*

---

### 📄 4. Halaman Registrasi (`fe/app/register/page.tsx`)

#### Branding Banner (Sisi Kiri):
* **Current:** `Mulai monetisasi kontenmu hari ini. Gratis selamanya, upgrade kapan saja.`
* **Optimized Copy:**
  - **H1:** `Rumah Terbaik untuk Karyamu.`
  - **Points:**
    - ✨ *Dapatkan link personal dalam 2 menit*
    - 🔒 *Proteksi file digital anti-bajak*
    - 💰 *Potongan fee terendah mulai 5%*
    - ⚡ *Terima donasi & pembayaran QRIS lokal*

#### Role Selection Microcopy:
* **Supporter Option:**
  - **Label:** `☕ Saya Ingin Menikmati & Mendukung Karya`
  - **Description:** *Beli e-book/preset, kirim pesan donasi ke kreator, dan simpan karya di perpustakaan digital pribadimu.*
* **Creator Option:**
  - **Label:** `🎨 Saya Ingin Menjual Karya & Terima Donasi`
  - **Description:** *Buka halaman publik, atur harga konten, pasang alert live stream, dan tarik hasil penjualan ke rekening.*

#### Referral Incentive Callout:
* **Current:** `🎁 Kamu dan teman yang mengajak akan dapat 10 Credit gratis!`
* **Optimized:** `🎁 Bonus Terpasang: Kamu & temanmu masing-masing mendapatkan 10 Credit (Rp 10.000) gratis saat pendaftaran berhasil!`

---

### 📄 5. Halaman Selamat Datang (`fe/app/welcome/page.tsx`)

Bimbing kreator baru untuk langsung mengambil tindakan pertama dalam 60 detik pertama:

#### Creator Welcome Action Cards:
1. **Langkah 1 (High Impact):** `✨ Lengkapi Profil & Pasang Foto Banner` — *Kreator dengan foto profil dan bio lengkap mendapatkan 3x lebih banyak donasi.*
2. **Langkah 2 (Monetisasi Cepat):** `📦 Unggah Produk Digital Pertama` — *Mulai jual preset, e-book, atau link eksklusifmu sekarang.*
3. **Langkah 3 (Promosi):** `🔗 Bagikan Link yourpage.id ke Bio Media Sosial` — *Pasang link di Instagram, TikTok, Twitter/X, atau deskripsi YouTube kamu.*

---

### 📄 6. Halaman Toko Kreator Publik (`fe/app/c/[slug]/page.tsx`)

Tingkatkan konversi dari penggemar yang mampir ke profil kreator:

| Elemen UI | Copy Standar | Copy yang Menggerakkan Fans |
|---|---|---|
| **Tab Donasi** | *Kirim Donasi* | *Beri Apresiasi & Tinggalkan Pesan ☕* |
| **Progress Goal** | *Target Rp 1.000.000* | *Bantu [Nama Kreator] Upgrade Mic Podcast Baru 🎙️ (Tercapai 65%)* |
| **Tombol Unlock Post** | *Beli Post 10 Credit* | *Buka Konten Eksklusif Ini (10 Credit) 🔓* |
| **Tombol Beli Produk** | *Beli Produk* | *Dapatkan File Instan Ini (Download Langsung) ⚡* |
| **Tombol Chat DM** | *Kirim Pesan* | *Chat Privat 1-on-1 dengan [Nama Kreator] 💬* |

---

## 6. Objection Handling & Risk-Reversal Blueprint

Pengunjung memiliki 4 keraguan psikologis utama sebelum mendaftar. Selalu jawab di bagian FAQ atau microcopy:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ❓ Q1: "Apakah saya harus membayar biaya langganan bulanan untuk mulai berjualan?"      │
│ 💡 A1: Sama sekali tidak. Paket Free 100% gratis selamanya tanpa biaya tersembunyi.    │
│        Kami hanya mengambil potongan kecil (fee) saat kamu berhasil mendapatkan        │
│        penjualan atau donasi. Tidak ada penjualan = kamu tidak bayar apa pun.         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ❓ Q2: "Bagaimana cara penggemar / pembeli saya membayar?"                             │
│ 💡 A2: Sangat mudah dan ramah pengguna lokal! Fans bisa membayar menggunakan:           │
│        • QRIS Nasional (GoPay, OVO, DANA, ShopeePay, LinkAja)                         │
│        • Transfer Bank / Virtual Account (BCA, Mandiri, BRI, BNI, Permata, dll)       │
│        • Kartu Debit / Kredit Visa & Mastercard                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ❓ Q3: "Kapan dan ke mana uang saya bisa dicairkan?"                                   │
│ 💡 A3: Kapan pun saldo kamu mencapai minimal 100 Credit (Rp 100.000). Pencairan        │
│        diproses cepat dalam 1x24 jam kerja langsung ke rekening bank atau e-walletmu.  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ❓ Q4: "Saya sudah punya akun di platform donasi lain. Apakah bisa pindah?"            │
│ 💡 A4: Tentu saja! Kamu bisa menggunakan YourPage bersamaan atau memindahkan link bio  │
│        kamu dalam 2 menit untuk menikmati fee yang jauh lebih hemat (hingga 5%) serta  │
│        fitur jualan file digital otomatis yang tidak dimiliki platform donasi biasa.  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Action-Oriented CTA Library

Gunakan rumus: **[Kata Kerja Aksi Kuat] + [Nilai Spesifik yang Didapat] + [Peredam Hambatan]**

### Primary High-Converting CTAs:
- `Klaim Link yourpage.id Kamu — Gratis →`
- `Mulai Hasilkan Uang dari Kontenmu →`
- `Buka Toko Digital & Terima Donasi Sekarang →`
- `Coba Gratis Selamanya Tanpa Biaya Bulanan →`

### Contextual In-App CTAs:
- **Di Halaman Post:** `Buka Akses Konten Ini (10 Credit) 🔓`
- **Di Halaman Produk:** `Download File Sekarang ⚡`
- **Di Modal Donasi:** `Kirim Apresiasi & Tampilkan Pesan di Stream 🎉`
- **Di Dashboard Upgrade:** `Simpan Lebih Banyak Cuan (Upgrade ke Pro) 🚀`

---

## 8. Prioritized A/B Testing Matrix

| Prioritas | Halaman & Elemen | Variasi A (Kontrol) | Variasi B (Penantang) | Hipotesis & Target Metrik | Skor ICE |
|:---:|---|---|---|---|:---:|
| **P1** | **Homepage Hero Headline** | *"Ubah Kontenmu Jadi Penghasilan"* | *"Terima Donasi, Jual File Digital & Komunitas di Satu Link"* | Menyebut 3 kapabilitas utama meningkatkan relevansi; **Target: +28% Registrasi Kreator** | **9.2** |
| **P1** | **Homepage Primary CTA** | *"Mulai Gratis Sekarang"* | *"Klaim Link yourpage.id Kamu — Gratis →"* | Menggunakan ownership (*klaim link*) meningkatkan click-through rate; **Target: +22% CTR** | **9.0** |
| **P2** | **Pricing Plan Hero** | *"Mulai gratis, upgrade kapan saja"* | *"Simpan Hingga 95% Penghasilan Karyamu (Fee Terendah 5%)"* | Menyoroti penghematan fee menarik kreator berpenghasilan tinggi; **Target: +18% Upgrade Pro** | **8.5** |
| **P2** | **Profile Storefront Donasi** | *"Kirim Donasi"* | *"Beri Apresiasi & Dukung Project Ini ☕"* | Emosi apresiasi mengonversi lebih baik daripada kata transaksi 'donasi'; **Target: +15% Volume Donasi** | **8.1** |
| **P3** | **Registration Form Subhead** | *"Daftar gratis dalam 2 menit"* | *"100% Gratis Selamanya · Langsung Jualan Hari Ini"* | Menghilangkan rasa takut biaya tersembunyi; **Target: +12% Form Completion** | **7.8** |

---

## 9. Implementation Checklist for Frontend Engineers

- [ ] Update Homepage Hero Headline, Subheadline, and CTA buttons in [`fe/app/page.tsx`](../fe/app/page.tsx).
- [ ] Replace feature descriptions in the Bento Grid with outcome-oriented benefits.
- [ ] Update Pricing Page cards and feature descriptions in [`fe/app/pricing/page.tsx`](../fe/app/pricing/page.tsx).
- [ ] Correct domain references (`urpage.online` ➔ `yourpage.id`) and payout timeline in [`fe/app/cara-kerja/page.tsx`](../fe/app/cara-kerja/page.tsx).
- [ ] Refine Role Selection descriptions in [`fe/app/register/page.tsx`](../fe/app/register/page.tsx).
- [ ] Update welcome action step cards in [`fe/app/welcome/page.tsx`](../fe/app/welcome/page.tsx).
- [ ] Ensure microcopy trust badges (QRIS, Bank Transfer, Instant Download) are present on checkout and storefront modals.
