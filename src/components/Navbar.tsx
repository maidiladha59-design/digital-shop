"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./ToastProvider";

type Profile = { full_name: string | null; email: string; role: string };

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) { setProfile(null); setLoading(false); }
        return;
      }
      const { data } = await supabase.from("profiles").select("full_name, email, role").eq("id", user.id).single();
      if (mounted) { setProfile(data as Profile); setLoading(false); }
    }
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => load());
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  async function handleLogout() {
    setAccountOpen(false);
    setMenuOpen(false);
    await supabase.auth.signOut();
    toast.show("Anda telah berhasil logout.", "success");
    router.push("/");
    router.refresh();
  }

  const name = profile?.full_name || profile?.email?.split("@")[0] || "Pengguna";
  const initial = name.charAt(0).toUpperCase();
  const isAdmin = profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/logo.svg" alt="Aidil Store" className="h-10 w-10 rounded-xl shadow-lg shadow-blue-500/20" />
          <span className="leading-none"><span className="block text-base font-black tracking-tight text-slate-900">AIDIL</span><span className="text-[10px] font-bold tracking-[.22em] text-blue-600">STORE</span></span>
        </Link>

        <div className="hidden flex-1 md:block md:max-w-xl">
          <form action="/" className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input name="q" placeholder="Cari produk digital..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          </form>
        </div>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600">Beranda</Link>
          {profile && <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600">Dashboard</Link>}
          {profile && <Link href="/wallet" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600">Saldo</Link>}
          {profile && <Link href="/orders" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600">Pesanan</Link>}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/checkout" aria-label="Keranjang" className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">🛒</Link>
          {loading ? <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" /> : profile ? (
            <div className="relative hidden sm:block">
              <button onClick={() => setAccountOpen(v => !v)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">{initial}</span>
                <span className="max-w-[100px] truncate text-sm font-semibold text-slate-700">{name}</span>
                <span className="text-xs text-slate-400">⌄</span>
              </button>
              {accountOpen && <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <div className="border-b border-slate-100 px-3 py-2"><p className="text-sm font-bold text-slate-800">{name}</p><p className="truncate text-xs text-slate-400">{profile.email}</p></div>
                <Link href="/profile" onClick={() => setAccountOpen(false)} className="mt-1 block rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50">👤 Profil Saya</Link>
                <Link href="/wallet" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50">💰 Saldo & Top Up</Link>
                <Link href="/orders" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50">📦 Pesanan Saya</Link>
                <Link href="/transactions" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50">🧾 Riwayat Transaksi</Link>
                {isAdmin && <Link href="/admin" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50">🛠️ Admin Panel</Link>}
                <button onClick={handleLogout} className="mt-1 w-full rounded-xl border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50">🚪 Logout</button>
              </div>}
            </div>
          ) : <Link href="/login" className="hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 sm:block">Masuk</Link>}

          <button className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden" onClick={() => setMenuOpen(v => !v)} aria-label="Buka menu">☰</button>
        </div>
      </div>

      {menuOpen && <div className="border-t border-slate-100 bg-white px-4 py-3 shadow-lg lg:hidden">
        <form action="/" className="mb-3"><input name="q" placeholder="Cari produk digital..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400" /></form>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-xl bg-slate-50 px-3 py-3 font-medium">🏠 Beranda</Link>
          {profile ? <><Link href="/dashboard" onClick={() => setMenuOpen(false)} className="rounded-xl bg-slate-50 px-3 py-3 font-medium">📊 Dashboard</Link><Link href="/wallet" onClick={() => setMenuOpen(false)} className="rounded-xl bg-slate-50 px-3 py-3 font-medium">💰 Saldo</Link><Link href="/orders" onClick={() => setMenuOpen(false)} className="rounded-xl bg-slate-50 px-3 py-3 font-medium">📦 Pesanan</Link><Link href="/profile" onClick={() => setMenuOpen(false)} className="rounded-xl bg-slate-50 px-3 py-3 font-medium">👤 Profil</Link>{isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="rounded-xl bg-blue-50 px-3 py-3 font-semibold text-blue-700">🛠️ Admin</Link>}<button onClick={handleLogout} className="rounded-xl bg-red-50 px-3 py-3 text-left font-semibold text-red-600">🚪 Logout</button></> : <><Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-xl bg-blue-600 px-3 py-3 text-center font-bold text-white">Masuk</Link><Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-xl bg-slate-50 px-3 py-3 text-center font-semibold">Daftar</Link></>}
        </div>
      </div>}
    </header>
  );
}
