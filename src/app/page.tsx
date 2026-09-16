import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";

export default async function HomePage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");
  let query = supabase.from("products").select("id, name, slug, price, thumbnail_url, product_type, category_id").eq("is_active", true).order("created_at", { ascending: false });
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.category) query = query.eq("category_id", searchParams.category);
  const { data: products } = await query;

  return <div className="space-y-10 pb-10">
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute -bottom-32 right-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="relative max-w-2xl">
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-blue-100">⚡ DIGITAL MARKETPLACE</span>
        <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Belanja Produk Digital <span className="text-blue-300">Lebih Mudah.</span></h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Temukan produk digital, voucher, template, aset kreatif, dan berbagai kebutuhan digital dalam satu tempat.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link href="#produk" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg hover:bg-blue-50">🛍️ Mulai Belanja</Link><Link href="/register" className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15">Buat Akun Gratis</Link></div>
      </div>
    </section>

    <section>
      <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Jelajahi</p><h2 className="mt-1 text-2xl font-black text-slate-900">Kategori Produk</h2></div><span className="text-sm text-slate-400">{categories?.length || 0} kategori</span></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(categories || []).slice(0, 8).map((c, i) => <Link key={c.id} href={`/?category=${c.id}`} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl group-hover:bg-blue-100">{["🎮","💻","🎁","📱","🎨","🔑","☁️","⚡"][i % 8]}</div><p className="font-bold text-slate-800">{c.name}</p><p className="mt-1 text-xs text-slate-400">Lihat produk →</p></Link>)}
        {(!categories || categories.length === 0) && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Kategori akan muncul setelah data tersedia.</div>}
      </div>
    </section>

    <section id="produk" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Koleksi terbaru</p><h2 className="mt-1 text-2xl font-black text-slate-900">Produk Pilihan</h2></div><form action="/" className="flex gap-2"><input name="q" defaultValue={searchParams.q} placeholder="Cari produk..." className="w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 sm:w-60" /><select name="category" defaultValue={searchParams.category || ""} className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:block"><option value="">Semua</option>{categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Cari</button></form></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products && products.length > 0 ? products.map(p => <Link key={p.id} href={`/products/${p.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50">{p.thumbnail_url ? <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-6xl">🛍️</div>}<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700 shadow-sm">{p.product_type || "Digital"}</span></div><div className="p-4"><p className="line-clamp-2 min-h-[40px] text-sm font-bold text-slate-800 group-hover:text-blue-600">{p.name}</p><p className="mt-2 text-base font-black text-blue-600">{formatRupiah(p.price)}</p><div className="mt-3 rounded-xl bg-slate-50 py-2 text-center text-xs font-bold text-slate-600 group-hover:bg-blue-600 group-hover:text-white">Lihat Produk →</div></div></Link>) : <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><div className="text-5xl">📦</div><p className="mt-3 font-bold text-slate-700">Belum ada produk yang tersedia.</p><p className="mt-1 text-sm text-slate-400">Produk yang ditambahkan admin akan tampil di sini.</p></div>}
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="text-2xl">🔐</div><h3 className="mt-3 font-bold">Transaksi Aman</h3><p className="mt-1 text-sm text-slate-500">Data akun dan transaksi dikelola dengan Supabase.</p></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="text-2xl">⚡</div><h3 className="mt-3 font-bold">Bayar dengan Saldo</h3><p className="mt-1 text-sm text-slate-500">Checkout langsung menggunakan saldo wallet.</p></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="text-2xl">📥</div><h3 className="mt-3 font-bold">Akses Produk</h3><p className="mt-1 text-sm text-slate-500">Produk digital yang sudah dibeli tersedia melalui akun Anda.</p></div></section>

    <footer className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white sm:px-10"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-lg font-black">AIDIL STORE</p><p className="mt-1 text-sm text-slate-400">Marketplace produk digital sederhana dan nyaman.</p></div><div className="flex flex-wrap gap-4 text-sm text-slate-400"><Link href="/profile" className="hover:text-white">Profil</Link><Link href="/orders" className="hover:text-white">Pesanan</Link><Link href="/wallet" className="hover:text-white">Wallet</Link><Link href="/login" className="hover:text-white">Login</Link></div></div><div className="mt-6 border-t border-white/10 pt-5 text-xs text-slate-500">© {new Date().getFullYear()} Aidil Store. Semua hak dilindungi.</div></footer>
  </div>;
}
