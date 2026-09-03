# ✍️ Conversion Copywriting & Localization Review: Internationalization (`fe/lib/internationalization`)

**Project:** YourPage (`yourpage.id`) — Indonesian All-in-One Creator Monetization Platform  
**Target Scope:** [`fe/lib/internationalization/`](file:///Users/doang/project/YourPage/fe/lib/internationalization/) (`types.ts`, `id/index.ts`, `en/index.ts`, `context.tsx`, `index.ts`)  
**Audit Date:** 2026-09-03  
**Auditor:** Conversion Copywriting Specialist (`/copywriting`)  
**Status:** Audit Complete & Action Blueprint Ready  

---

## 1. Executive Summary & Copy Scorecard

With the completion of Batch 15, the YourPage frontend centralized all application strings across 80 pages into [`fe/lib/internationalization/`](file:///Users/doang/project/YourPage/fe/lib/internationalization/). This dictionary contains **1,625 structured translation keys** across Indonesian (`id`) and English (`en`).

The top-of-funnel landing pages and feature descriptions succeed at communicating the core value proposition: **one single link in bio combining donations, paid posts, digital store, and chat, powered by QRIS with 1 Credit = Rp 1.000**.

However, a deep audit of the dictionary reveals **3 critical factual/trust contradictions**, lingering **untranslated English/developer jargon in the Indonesian dictionary**, **passive call-to-actions (CTAs)**, and **missed conversion opportunities in friction and zero-data states**.

### 📊 Conversion Copy Scorecard

| Dimension | Score | Primary Finding | Target Standard |
|---|:---:|---|---|
| **1. Hook & Value Prop Clarity** | **8.5 / 10** | Strong hero headline and benefit-driven feature breakdown. | Keep core promise crystal clear: All-in-One monetization with zero monthly upfront fees. |
| **2. Factual Consistency & Trust** | **5.0 / 10** | **Critical:** Residual `urpage.online` domain typo in dashboard hint; Terms of Service stating flat 10% fee while app uses tiered 20%/10%/5%. | 100% data and brand synchronization across legal, onboarding, and dashboard. |
| **3. Call-to-Action (CTA) Power** | **6.0 / 10** | Several key buttons use weak/passive verbs (`"Get Started"`, `"Mulai Sekarang"`, `"Submit KYC"`, `"Beli"`). | Apply formula: `[Action Verb] + [What You Get] + [Friction Reducer]`. |
| **4. Indonesian (`id`) Naturalness** | **6.5 / 10** | Untranslated English terms (`"Excerpt"`, `"Members Only"`, `"url-friendly"`, `"Net Revenue"`, `"Copy Link"`), and flip-flopping between *"Creator"* and *"Kreator"*. | Consistent, conversational modern Indonesian tailored for creators and fans. |
| **5. English (`en`) Idiomatic Quality** | **7.5 / 10** | Generally solid, with minor stiff literal translations from Indonesian idioms. | Natural, punchy international SaaS tone. |
| **6. Microcopy & Empty States** | **6.0 / 10** | Several zero-data and error states act as dead ends (`"Belum ada post"`, `"Credit tidak cukup. Top-up dulu."`). | Transform dead ends into on-ramps for discovery, following, and top-up. |

---

## 2. 🚨 Critical Factual Contradictions & Trust Blockers

These inconsistencies directly hurt user trust, invite customer disputes, or confuse creators sharing their links.

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🚨 TOP 3 CRITICAL INCONSISTENCIES IN I18N DICTIONARIES                                             │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Legacy Domain Typo in Creator Settings                                                         │
│    • EN (fe/lib/internationalization/en/index.ts:581): "urpage.online/c/{username}"               │
│    • ID (fe/lib/internationalization/id/index.ts:581): "urpage.online/c/{username}"               │
│    • Impact: Creators see urpage.online in dashboard settings, while marketing promotes yourpage.id│
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. Legal Terms vs Pricing Model Contradiction                                                     │
│    • EN (fe/lib/internationalization/en/index.ts:715): "A 10% platform fee is applied..."         │
│    • ID (fe/lib/internationalization/id/index.ts:715): "Platform fee sebesar 10% dikenakan..."    │
│    • Real System: Free = 20%, Pro = 10%, Business = 5%.                                           │
│    • Impact: Free tier creators can contest 20% deductions based on the legal terms.              │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. Payout Timeline Phrasing                                                                       │
│    • Landing stats say "1x24 Jam" / "24 Hours Direct Bank Payout".                                │
│    • FAQ specifies "24 business hours" / "1x24 jam kerja".                                        │
│    • Clarification needed to set accurate creator expectations on weekends and holidays.          │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Exact Corrections Needed:
1. **Domain Setting Hint ([`id/index.ts:581`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts#L581), [`en/index.ts:581`](file:///Users/doang/project/YourPage/fe/lib/internationalization/en/index.ts#L581)):**
   - **Old:** `usernameHint: "Your username is used as your page link: urpage.online/c/{username}"`
   - **New:** `usernameHint: "Your username is used as your page link: yourpage.id/c/{username}"`
   - **Old (ID):** `usernameHint: "Username digunakan sebagai link halaman kamu: urpage.online/c/{username}"`
   - **New (ID):** `usernameHint: "Username digunakan sebagai link halaman kamu: yourpage.id/c/{username}"`

2. **Legal Terms ([`id/index.ts:715`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts#L715), [`en/index.ts:715`](file:///Users/doang/project/YourPage/fe/lib/internationalization/en/index.ts#L715)):**
   - **Old (ID):** `section4Item1: "Platform fee sebesar 10% dikenakan pada setiap transaksi (post, produk, donasi)."`
   - **New (ID):** `section4Item1: "Platform fee bervariasi sesuai paket langganan kreator (20% untuk Free, 10% untuk Pro, dan 5% untuk Business) yang dipotong otomatis dari tiap transaksi berhasil."`
   - **Old (EN):** `section4Item1: "A 10% platform fee is applied to every transaction (posts, products, donations)."`
   - **New (EN):** `section4Item1: "Platform fees vary based on your creator subscription plan (20% for Free, 10% for Pro, and 5% for Business), deducted automatically from each completed transaction."`

---

## 3. CTA Overhaul: Upgrading Passive Labels to Value Triggers

Good copywriting replaces passive UI instructions (*"Click Here"*, *"Submit"*, *"Beli"*) with specific, outcome-driven verbs.

| Key Identifier | Existing Copy | Recommended High-Converting Copy | Rationale |
|---|---|---|---|
| `hero.ctaPrimary` | **ID:** `"Klaim Link yourpage.id Kamu — Gratis"`<br>**EN:** `"Claim Your yourpage.id Link — Free"` | *(Keep as-is)* | Outstanding value-driven CTA with clear ownership framing. |
| `finalCta.button` | **ID:** `"Daftar Sekarang — Gratis"`<br>**EN:** `"Get Started Now — Free"` | **ID:** `"Buat Halaman Kreator Kamu — Gratis"`<br>**EN:** `"Claim Your Free Creator Hub"` | "Get Started" is generic; naming the tangible asset accelerates signups. |
| `pricing.proCta` | **ID:** `"Pilih Paket Pro"`<br>**EN:** `"Get Pro"` | **ID:** `"Upgrade ke Pro (Hemat Fee 50%)"`<br>**EN:** `"Upgrade to Pro (Cut Fees by 50%)"` | Connects the upgrade to creator revenue retention. |
| `pricing.businessCta` | **ID:** `"Pilih Paket Business"`<br>**EN:** `"Get Business"` | **ID:** `"Pilih Business (Fee Terendah 5%)"`<br>**EN:** `"Choose Business (Lowest 5% Fee)"` | Highlights the financial upside for large volume creators. |
| `post.buyPost` | **ID:** `"Beli — {price}"`<br>**EN:** `"Buy — {price}"` | **ID:** `"Buka Akses Post — {price} Credit"`<br>**EN:** `"Unlock Post — {price} Credits"` | "Buka Akses" triggers curiosity and value instead of spending pain. |
| `product.buyButton` | **ID:** `"Beli Sekarang"`<br>**EN:** `"Buy Now"` | **ID:** `"Download File Sekarang — {price}"`<br>**EN:** `"Instant Download — {price}"` | Communicates instant gratification and automated delivery. |
| `accountMgr.kycSubmitButton` | **ID:** `"Submit KYC"`<br>**EN:** `"Submit KYC"` | **ID:** `"Verifikasi Identitas & Buka Penarikan"`<br>**EN:** `"Verify Identity to Unlock Withdrawals"` | "Submit KYC" feels like compliance friction; state the reward (unlocking bank payouts). |
| `contentMgr.createTierFirst` | **ID:** `"Buat dulu"`<br>**EN:** `"Create one first"` | **ID:** `"Buat Tier Membership Sekarang"`<br>**EN:** `"Create Membership Tier"` | "Buat dulu" is colloquial and sounds incomplete. |
| `wallet.topupButton` | **ID:** `"Top-up Credit"`<br>**EN:** `"Top-up Credits"` | **ID:** `"Isi Saldo Credit"`<br>**EN:** `"Top-up Credits via QRIS"` | Clearer call-to-action for non-technical supporters. |

---

## 4. Indonesian (`id/index.ts`) Copy Polish

### A. Terminology Harmonization: `Creator` vs `Kreator`
In [`fe/lib/internationalization/id/index.ts`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts), the word *"Creator"* is occasionally used instead of the standardized Indonesian term *"Kreator"*:
* **Line 419:** `upgradeToCreator: "Upgrade ke Creator"` $\rightarrow$ `"Upgrade ke Kreator"`
* **Line 917:** `chatOptionAllDesc: "Supporter & creator"` $\rightarrow$ `"Supporter & kreator"`
* **Line 920:** `chatOptionCreatorLabel: "🎨 Creator Saja"` $\rightarrow$ `"🎨 Kreator Saja"`
* **Line 921:** `chatOptionCreatorDesc: "Hanya sesama creator"` $\rightarrow$ `"Hanya sesama kreator"`
* **Line 1565:** `creator: "Creator"` $\rightarrow$ `"Kreator"`

### B. Untranslated CMS & Developer Jargon in Indonesian
* **Line 18 vs Line 382:** Line 18 has `common.copyLink: "Salin Link"`, but Line 382 has `post.copyLink: "Copy Link"`. Synchronize to `"Salin Link"`.
* **Line 1059:** `excerptOptional: "Excerpt (opsional)"` $\rightarrow$ Change to `"Cuplikan Singkat (opsional)"`. Creators without WordPress background will not know what an "excerpt" is.
* **Line 1061:** `membersOnly: "Members Only"` $\rightarrow$ Change to `"Khusus Member"`.
* **Line 1081:** `slugPlaceholder: "url-friendly"` $\rightarrow$ Change to `"nama-produk-kamu"`.
* **Line 964:** `netRevenue: "Net Revenue"` $\rightarrow$ Change to `"Pendapatan Bersih (Net)"`.
* **Lines 1128–1129:**
  * `statusResolved: "Resolved"` $\rightarrow$ `"Selesai"`
  * `statusDismissed: "Dismissed"` $\rightarrow$ `"Diabaikan"`
* **Lines 1292–1294 (Tax Module):**
  * `taxGrossRevenue: "Gross Revenue"` $\rightarrow$ `"Total Pendapatan Kotor"`
  * `taxPlatformFee: "Platform Fee ({fee}%)"` $\rightarrow$ `"Biaya Platform ({fee}%)"`
  * `taxNetEarnings: "Net Earnings"` $\rightarrow$ `"Pendapatan Bersih"`
* **Lines 1405–1425 (Admin Finance):**
  * `sortAmount: "Amount"` $\rightarrow$ `"Nominal"`
  * `sortProvider: "Provider"` $\rightarrow$ `"Penyedia"`
  * `sortDate: "Date"` $\rightarrow$ `"Tanggal"`
  * `labelPayer: "Payer:"` $\rightarrow$ `"Pembayar:"`
* **Line 1591:** `mainNavigation: "Main navigation"` $\rightarrow$ `"Navigasi Utama"`.

---

## 5. Microcopy & Empty States: Turning Dead Ends into Growth Drivers

When a user lands on an empty feed, an empty catalog, or an error, generic text kills momentum. Here is how to upgrade them:

### A. Friction & Error States
* **Insufficient Balance on Content Purchase ([`id/index.ts:397`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts#L397)):**
  * *Current:* `"Credit tidak cukup. Top-up dulu."` *(Abrupt and dismissive)*
  * *Proposed:* `"Saldo Credit belum mencukupi. Top-up instan via QRIS untuk melanjutkan."`
  * *EN:* `"Insufficient Credit balance. Top up instantly via QRIS to unlock this content."`

* **KYC Required for Payout ([`id/index.ts:995`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts#L995)):**
  * *Current:* `"KYC must be verified first"` / `"KYC wajib diverifikasi dulu"`
  * *Proposed:* `"Verifikasi identitas (KYC) dibutuhkan sebelum penarikan dana pertama demi keamanan rekeningmu."`
  * *EN:* `"Identity verification (KYC) is required before your first bank withdrawal to secure your account."`

* **KYC Security Reassurance ([`id/index.ts:1276`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts#L1276)):**
  * *Current:* `"Diperlukan untuk penarikan pertama. Data aman dan tidak ditampilkan publik."`
  * *Proposed:* `"Dibutuhkan satu kali saja untuk pencairan saldo ke rekening bank. Data KTP dienkripsi aman dan tidak pernah dibagikan ke pihak ketiga."`
  * *EN:* `"Required once to process bank transfers. Your identity data is strictly encrypted and never shared with third parties."`

### B. Empty State Upgrades

| Key | Current State | High-Converting Alternative | Benefit |
|---|---|---|---|
| `supporterHub.emptyFeedDesc` | `"Follow creators to see their content."` | **ID:** `"Temukan kreator favoritmu di Explore dan follow untuk melihat karya eksklusif mereka di sini."`<br>**EN:** `"Discover inspiring creators on Explore and follow them to unlock exclusive updates and drops right here."` | Guides supporter directly into the Explore funnel. |
| `supporterHub.emptyPurchasedPostsDesc` | `"Buy content from your favorite creators"` | **ID:** `"Buka akses ke artikel premium, tutorial, atau komik dari kreator favoritmu."`<br>**EN:** `"Unlock premium articles, tutorials, and exclusive stories from your favorite creators."` | Paints a picture of what they are missing. |
| `contentMgr.emptyPostsDesc` | `"Buat post pertamamu!"` | **ID:** `"Bagikan tulisan, karya seni, atau tutorial pertamamu — gratis atau kunci khusus supporter."`<br>**EN:** `"Publish your first article, artwork, or tutorial — share it free or lock it for supporters."` | Lowers activation barrier for new creators. |
| `contentMgr.emptyProductsDesc` | `"Buat produk digital pertamamu!"` | **ID:** `"Unggah e-book, preset, atau template karyamu. Pembeli akan menerima file otomatis 24/7."`<br>**EN:** `"Upload your e-books, presets, or templates. Customers receive files automatically 24/7."` | Emphasizes the "passive income / 24/7 delivery" value. |
| `monetization.noSalesDesc` | `"Buat konten berbayar untuk mulai menghasilkan"` | **ID:** `"Kunci postingan eksklusif atau jual produk digital pertamamu untuk mulai mendapatkan penghasilan!"`<br>**EN:** `"Lock an exclusive post or launch your first digital product to start earning creator income!"` | Energizing, action-oriented tone. |

---

## 6. Implementation Checklist & Next Steps

- [ ] **Fix 1: Domain Typo** — Replace `urpage.online` with `yourpage.id` in `usernameHint` across [`id/index.ts`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts#L581) and [`en/index.ts`](file:///Users/doang/project/YourPage/fe/lib/internationalization/en/index.ts#L581).
- [ ] **Fix 2: Legal Platform Fee** — Update `terms.section4Item1` in both languages to reflect the actual tiered fee structure (20% Free, 10% Pro, 5% Business).
- [ ] **Fix 3: Harmonize Creator Terminology** — Standardize on `"Kreator"` across all entries in [`id/index.ts`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts).
- [ ] **Fix 4: Translate Jargon & English Residuals** — Translate `excerptOptional`, `membersOnly`, `netRevenue`, `slugPlaceholder`, and Admin moderation/finance status words in [`id/index.ts`](file:///Users/doang/project/YourPage/fe/lib/internationalization/id/index.ts).
- [ ] **Fix 5: Enhance CTAs & Friction Microcopy** — Upgrade key buttons (`finalCta`, `proCta`, `buyPost`, `kycSubmitButton`) and soften error states (`topupRequired`, `kycRequired`).
