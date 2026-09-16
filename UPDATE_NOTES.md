# Aidil Store v5 — Update Notes

## Perubahan utama
- Midtrans dihapus dari frontend dan backend.
- Route `/api/payment/*` dihapus.
- Library Midtrans dihapus.
- Checkout sekarang memakai `/api/checkout` dan RPC `checkout`.
- Pembayaran produk dilakukan menggunakan saldo wallet.
- Top Up tetap memakai bukti pembayaran dan verifikasi admin.
- Karakter/mascot anime dihapus.
- Branding utama menggunakan `public/logo.svg`.
- `.env.example` tidak lagi membutuhkan konfigurasi Midtrans.
- `schema.sql` tidak lagi membuat tabel/function khusus Midtrans.

## Database fresh/reset
Jalankan:
1. reset database yang aman
2. `supabase/schema.sql`
3. `supabase/storage_and_seed.sql`
4. `supabase/migrations_product_media.sql`
5. `supabase/migrations_topup_robust_fix.sql`

## Upgrade tanpa reset
Jalankan `supabase/migrations_v5_remove_midtrans.sql` sekali untuk menghapus artefak Midtrans lama. Pastikan tidak ada data pembayaran gateway lama yang masih diperlukan.

## Reset v5
`supabase/RESET_V5.sql` hanya menghapus tabel/fungsi/type aplikasi di schema `public` dan policy Storage lama. File di Storage tidak dihapus.
Jika akun Auth lama harus dipertahankan, jalankan `supabase/after_reset_existing_users.sql` setelah `schema.sql`.
