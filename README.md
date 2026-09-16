# Aidil Store v5 — Wallet Edition

Marketplace produk digital berbasis Next.js + Supabase.

## Fitur
- Beranda marketplace modern
- Login, daftar, lupa/reset password
- Dashboard pengguna
- Produk dan kategori
- Detail produk
- Checkout menggunakan saldo wallet
- Wallet + riwayat transaksi
- Top Up dengan metode pembayaran yang dikelola admin
- Upload bukti pembayaran Top Up
- Admin verifikasi/menolak Top Up
- Admin kelola produk, pengguna, order, metode pembayaran
- Download produk digital setelah pembelian
- Logo Aidil Store sebagai satu-satunya branding visual utama
- Responsive untuk HP dan laptop

## Pembayaran
Versi ini TIDAK memakai Midtrans.

Alur:
1. User memilih nominal Top Up.
2. User memilih metode pembayaran yang disediakan admin.
3. User transfer sesuai instruksi.
4. User upload bukti pembayaran.
5. Admin memverifikasi Top Up.
6. Saldo wallet user bertambah.
7. User checkout produk menggunakan saldo wallet.

## Environment
Buat `.env.local` dari `.env.example` dan isi hanya konfigurasi Supabase yang kamu miliki.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
```

Jangan membagikan service role key atau secret lainnya.

## Menjalankan
```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Database v5
Untuk instalasi baru/reset, jalankan di Supabase SQL Editor secara berurutan:
1. reset database yang aman
2. `supabase/schema.sql`
3. `supabase/storage_and_seed.sql`
4. `supabase/migrations_product_media.sql`
5. `supabase/migrations_topup_robust_fix.sql`

`supabase/migrations_v5_remove_midtrans.sql` hanya diperlukan jika meng-upgrade database lama tanpa reset.

## Critical fixes migration (existing v5 database)

If you are updating an existing Aidil Store v5 database, run this file **once** in Supabase SQL Editor after the previously completed migrations:

`supabase/migrations_v5_critical_fixes.sql`

It fixes:
- digital checkout orders becoming `COMPLETED` automatically;
- admin order status management and safe refund handling;
- audit logging for order status changes.

For a fresh database, `schema.sql` already contains the corrected checkout behavior.
