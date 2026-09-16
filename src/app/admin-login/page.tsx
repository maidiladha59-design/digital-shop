"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { humanizeError } from "@/lib/utils";

export default function AdminLoginPage() {
  const supabase = createClient(); const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [remember, setRemember] = useState(true); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => { setRemember(localStorage.getItem("aidil_admin_remember") !== "0"); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) { setError(humanizeError(loginError.message)); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sesi login tidak ditemukan. Silakan coba lagi."); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profileError) { console.error(profileError); await supabase.auth.signOut(); setError("Profil admin belum tersedia atau gagal dibaca. Pastikan data profile akun ini sudah dibuat di Supabase."); return; }
      const isAdmin = profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";
      if (!isAdmin) { await supabase.auth.signOut(); setError("Akun ini bukan akun admin."); return; }
      localStorage.setItem("aidil_admin_remember", remember ? "1" : "0"); router.replace("/admin"); router.refresh();
    } catch (err) {
      console.error(err); setError("Terjadi kesalahan saat login. Periksa koneksi internet lalu coba lagi.");
    } finally { setLoading(false); }
  }

  return <main className="flex min-h-[78vh] items-center justify-center py-6 animate-page-in"><div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 md:grid-cols-2"><div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-700 p-10 text-white md:block"><div className="auth-orb absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" /><div className="relative z-10"><img src="/logo.svg" alt="Aidil Store" className="h-14 w-14 rounded-2xl bg-white p-2 shadow-xl" /><p className="mt-8 text-xs font-black uppercase tracking-[.22em] text-blue-200">AIDIL STORE · ADMIN</p><h1 className="mt-2 text-4xl font-black">Kelola toko dengan mudah.</h1><p className="mt-4 text-sm leading-6 text-blue-100">Pantau produk, order, pengguna, saldo dan verifikasi Top Up dari satu dashboard.</p><div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold"><span className="rounded-xl bg-white/10 p-3">📦 Produk</span><span className="rounded-xl bg-white/10 p-3">💰 Top Up</span></div></div></div><div className="p-6 sm:p-10"><div className="flex items-center gap-3 md:hidden"><img src="/logo.svg" alt="Aidil Store" className="h-12 w-12 rounded-xl" /><div><p className="font-black">AIDIL STORE</p><p className="text-xs text-slate-500">Admin Panel</p></div></div><div className="mt-7 md:mt-0"><span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">🔐 Area Admin</span><h2 className="mt-3 text-2xl font-black text-slate-900">Masuk sebagai Admin</h2><p className="mt-1 text-sm text-slate-500">Gunakan akun admin yang terdaftar di Supabase.</p></div><form onSubmit={submit} className="mt-7 space-y-5"><label className="block"><span className="text-sm font-semibold text-slate-700">Email Admin</span><input value={email} onChange={e => setEmail(e.target.value)} type="email" required autoComplete="username" placeholder="admin@email.com" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label><label className="block"><span className="text-sm font-semibold text-slate-700">Password</span><span className="relative mt-2 block"><input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Masukkan password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200">{showPassword ? "Sembunyi" : "Lihat"}</button></span></label><div className="flex items-center justify-between gap-3 text-sm"><label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300" /> Ingat pilihan</label><Link href="/forgot-password" className="font-semibold text-blue-600 hover:underline">Lupa password?</Link></div>{error && <div className="animate-page-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700">{error}</div>}<button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Memeriksa akun..." : "Masuk ke Dashboard"}</button></form><div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5 text-sm"><Link href="/" className="font-medium text-slate-500 hover:text-blue-600">← Kembali ke toko</Link><Link href="/login" className="font-semibold text-blue-600 hover:underline">Login pengguna</Link></div></div></div></main>;
}
