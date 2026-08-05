# Dokumentasi Teknis — AMK Portal

Website resmi + panel admin PT. Adikara Mandala Kreasi (AMK Agency).
Domain produksi: **https://www.adikaramandalakreasi.com**

---

## 1. Ringkasan Tech Stack

| Layer | Teknologi | Versi (terpasang) |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.19 (`^15.3.0` di package.json) |
| UI Library | React | 19.2.7 |
| Bahasa | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 3.4.19 |
| CSS Processor | PostCSS + Autoprefixer | postcss ^8, autoprefixer ^10.4.20 |
| Data fetching (client) | SWR | 2.4.2 |
| Database | Firebase Firestore | `firebase` 12.15.0 (client SDK), `firebase-admin` 14.1.0 (server SDK) |
| Autentikasi | Firebase Authentication | via `firebase` 12.15.0 & `firebase-admin` 14.1.0 |
| Push Notification | Firebase Cloud Messaging (FCM) | via `firebase-admin/messaging` + Web Push (VAPID) |
| Media/Image Storage | Cloudinary | unsigned upload preset (tanpa API key/secret di client) |
| Hosting | Vercel | — |
| Automasi terjadwal | GitHub Actions (cron) | memanggil API route internal |
| Runtime | Node.js | v22.18.0 (lokal) |
| Package manager | npm (ada `package-lock.json`) | — |

---

## 2. Frontend

- **Next.js 15 App Router** — struktur folder berbasis route group:
  - `app/(portal)/` → halaman publik (about, clients, gallery, news, portfolio, services)
  - `app/admin/` → panel admin, dengan sub-group `(authenticated)` untuk halaman yang butuh login
  - `app/api/` → API routes (admin users, chat, cron, revalidate, force-deploy)
- **React 19** + Server Components sebagai default, dengan client component (`'use client'`) di komponen interaktif (chat widget, form admin, dll).
- **Tailwind CSS 3.4** untuk styling, konfigurasi custom di `tailwind.config.*` (tema warna primary `#0752B7`, dll).
- **SWR** dipakai di sisi client untuk data fetching + caching (misalnya permission matrix admin di `lib/permissions.tsx`).
- Data fetching sisi server dilakukan langsung lewat service layer (`lib/services/*.ts`) yang membungkus Firestore Admin SDK.

### Struktur folder utama

```
app/
  (portal)/        → halaman publik
  admin/           → dashboard admin (CRUD konten, users, permission, chat, dll)
  api/             → route handler (REST-style)
  sitemap.ts       → sitemap.xml dinamis
  robots.ts        → robots.txt dinamis
  layout.tsx       → root layout + metadata SEO (canonical, OG, JSON-LD)
components/        → komponen shared (Navbar, Footer, chat widget, dll) + admin/, sections/
lib/
  services/        → service layer per-entity ke Firestore (clients, news, portfolio, dll)
  firebase.ts      → init Firebase client SDK
  firebaseAdmin.ts → init Firebase Admin SDK (server-only)
  cloudinary.ts / upload.ts → upload gambar ke Cloudinary
  permissions.tsx  → RBAC (role-based access control) untuk admin
  chatbot/         → rule-based auto-reply untuk widget chat
hooks/              → custom hooks (magnetic effect, scroll reveal)
data/               → data statis (portfolio, services) yang belum/masih di-migrate ke Firestore
scripts/            → script one-off (migrasi gambar ke Cloudinary, fix slug, dll), dijalankan via `tsx`
public/             → asset statis (icons, images, favicon.ico, PWA manifest icons)
```

---

## 3. Database — Firebase Firestore

- **Project ID**: `adikaramandalakreasi-36ba6` (lihat `.firebaserc`).
- Akses dari client pakai `firebase` SDK (`lib/firebase.ts`) dengan config dari env `NEXT_PUBLIC_FIREBASE_*`.
- Akses dari server (API routes, Server Components, `generateMetadata`) pakai `firebase-admin` SDK (`lib/firebaseAdmin.ts`) dengan service account (`FIREBASE_ADMIN_*` env, private key di-encode base64 opsional).
- Security rules ada di `firestore.rules`, di-deploy terpisah lewat Firebase CLI (`firebase.json` hanya mendaftarkan `firestore.rules`, tidak ada Firebase Hosting di config ini — hosting tetap di Vercel).
- Semua akses data dibungkus lewat **service layer** di `lib/services/` (satu file per collection: `newsService`, `portfolioService`, `clientsService`, `usersService`, `rolePermissionService`, dll) — tidak ada komponen yang query Firestore langsung.
- **Firebase Storage TIDAK dipakai** meski env var `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` ada (sisa dari setup awal / dipakai fitur lain Firebase). Semua upload gambar production sudah dipindah ke Cloudinary (lihat `scripts/migrate-images-to-cloudinary.ts` — migrasi dari base64-di-Firestore ke Cloudinary).

---

## 4. Autentikasi & Otorisasi

- **Firebase Authentication** (email/password) untuk login admin (`app/admin/login`).
- Verifikasi identitas di server pakai `adminAuth().verifyIdToken()` (contoh: `app/api/force-deploy/route.ts`, `app/api/admin/users`).
- **RBAC custom** di atas Firebase Auth: role user (`admin` / `editor`, dll) disimpan di collection `users` (key = email), lalu setiap role punya matrix permission per-menu (`view`/`edit`/`delete`/`approve`) yang disimpan lewat `rolePermissionService` dan dikonsumsi di client via `usePermissionValue()` / `usePermission()` (`lib/permissions.tsx`).
- Halaman admin di-manage lewat menu tree dinamis (`lib/adminMenuTree.ts`, editable di admin → "Menu Struktur").

---

## 5. Media & Storage — Cloudinary

- Upload gambar (logo, galeri, foto tim, cover berita/portfolio, dll) langsung dari browser ke Cloudinary pakai **unsigned upload preset** — tidak perlu API key/secret di client.
- Env terkait: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- Helper: `lib/cloudinary.ts` (upload logic) dan `lib/upload.ts`.
- Rendering gambar pakai `next/image` dengan `remotePatterns: { hostname: '**' }` di `next.config.ts` — mengizinkan gambar dari domain manapun (termasuk link eksternal yang ditempel admin lewat fitur "Pakai Link"), bukan cuma Cloudinary.

---

## 6. Push Notification & Chat

- **Firebase Cloud Messaging (FCM)** untuk notifikasi push (chat admin↔visitor).
  - Web Push pakai VAPID key (`NEXT_PUBLIC_FIREBASE_VAPID_KEY`).
  - Kirim notifikasi dari server pakai `adminMessaging()` (`lib/firebaseAdmin.ts`), dipicu dari `app/api/chat/notify`.
- **Visitor chat widget** (`components/VisitorChatWidget.tsx`) di halaman publik + panel chat di admin, data chat disimpan di Firestore lewat `chatService` / `visitorChatService`.
- **Auto-reply rule-based** (bukan LLM) di `lib/chatbot/rules.ts` untuk respons cepat sebelum admin membalas manual.

---

## 7. SEO

- `app/layout.tsx` → set `metadataBase`, `canonical`, Open Graph, Twitter Card, JSON-LD (`ProfessionalService` schema), dan verification tag Google Search Console (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`).
- `app/sitemap.ts` → sitemap.xml dinamis (mengikuti konten Firestore, render dynamic supaya selalu up to date tiap ada perubahan konten).
- `app/robots.ts` → robots.txt dinamis, disallow `/admin`, referensi sitemap ke `SITE_URL`.
- `lib/seo.ts` → single source of truth untuk `SITE_URL` (dari env `NEXT_PUBLIC_SITE_URL`, fallback ke domain produksi) dan resolusi favicon (`faviconUrl()`).
- `public/favicon.ico` → favicon statis fallback (untuk crawler favicon Google), terpisah dari favicon dinamis yang bisa diganti admin lewat panel.
- Redirect 301 permanen dari domain lama `adikaramandalakreasi.vercel.app` → domain custom, didefinisikan di `next.config.ts` (`redirects()`).

---

## 8. PWA (Admin)

- `app/admin/manifest.webmanifest/route.ts` → manifest PWA dinamis khusus scope `/admin` (install-icon pakai favicon perusahaan + bundled icon di `public/icons/`).
- `public/admin-sw.js` → service worker untuk PWA admin (offline/push support).
- `public/icons/` → set icon PWA (`icon-192.png`, `icon-512.png`, versi maskable).

---

## 9. Hosting & Deployment

- **Hosting: Vercel** (bukan Firebase Hosting — Firebase cuma dipakai untuk Firestore/Auth/Messaging).
- Domain produksi custom (`www.adikaramandalakreasi.com`), domain default Vercel (`adikaramandalakreasi.vercel.app`) di-redirect permanen ke domain custom.
- **ISR (Incremental Static Regeneration)**: revalidasi on-demand lewat `app/api/revalidate`, dipanggil tiap konten di admin disimpan (`lib/revalidate.ts`).
- **Deploy Hook** (`VERCEL_DEPLOY_HOOK_URL`) dipakai sebagai stopgap di `app/api/force-deploy` — memicu full rebuild kalau kuota ISR-write Vercel habis dan revalidate on-demand berhenti berfungsi.
- `serverExternalPackages: ['firebase-admin']` di `next.config.ts` — workaround supaya `firebase-admin` tidak di-bundle Next.js (mencegah crash `ERR_REQUIRE_ESM` di Vercel).

---

## 10. Automasi Terjadwal (Cron)

- **GitHub Actions**, bukan Vercel Cron — didefinisikan di `.github/workflows/cron-revalidate-scheduled.yml`.
- Jadwal: tiap hari jam 00:00 WIB (`0 17 * * *` UTC), plus bisa di-trigger manual (`workflow_dispatch`).
- Memanggil endpoint `GET /api/cron/revalidate-scheduled` (diamankan pakai `Authorization: Bearer <CRON_SECRET>`) untuk mem-publish artikel berita yang dijadwalkan (`scheduled publish`) dan revalidate path terkait.
- Setiap run dicatat ke collection Firestore `cron_logs`, bisa dilihat riwayatnya di admin panel → menu **Cron Logs**.

> Sempat memanggil domain lama `adikaramandalakreasi.vercel.app` dan berpotensi silent-broken oleh redirect 301 (04 Agustus 2026) — sudah diperbaiki (05 Agustus 2026) untuk memanggil domain custom `www.adikaramandalakreasi.com` langsung.

---

## 11. Environment Variables

| Variable | Kegunaan |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` / `AUTH_DOMAIN` / `PROJECT_ID` / `STORAGE_BUCKET` / `MESSAGING_SENDER_ID` / `APP_ID` | Config Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push cert untuk FCM (chat notification) |
| `NEXT_PUBLIC_SITE_URL` | Domain produksi — dipakai untuk sitemap, canonical, OG |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Meta tag verifikasi Google Search Console |
| `FIREBASE_ADMIN_PROJECT_ID` / `CLIENT_EMAIL` / `PRIVATE_KEY` (atau `PRIVATE_KEY_BASE64`) | Service Account untuk Firebase Admin SDK (server-only) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `UPLOAD_PRESET` | Upload gambar ke Cloudinary (unsigned) |
| `CRON_SECRET` | Autentikasi endpoint cron dari GitHub Actions |
| `VERCEL_DEPLOY_HOOK_URL` | Trigger full rebuild manual dari admin panel |

Semua variable ini didaftarkan (tanpa value) di `.env.local.example` sebagai referensi setup.

---

## 12. Ringkasan Alur Data

```
Browser (publik)  ──> Next.js Server Component ──> lib/services/* ──> Firestore (firebase-admin)
Browser (admin)   ──> Firebase Auth (login)    ──> Firestore (firebase client SDK, sesuai security rules)
Upload gambar     ──> langsung ke Cloudinary (unsigned upload) ──> URL disimpan di Firestore
Publish terjadwal ──> GitHub Actions (cron) ──> API route ──> Firestore + revalidatePath()
Chat visitor      ──> Firestore (chatService) ──> FCM push ke admin (adminMessaging)
```
