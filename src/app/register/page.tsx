"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import { humanizeError } from "@/lib/utils";

export default function RegisterPage() {
  const supabase = createClient();
  const toast = useToast();
  const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    if (password.length < 6) { setLoading(false); setError("Password minimal 6 karakter."); return; }
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setLoading(false);
    if (error) { const msg = humanizeError(error.message); setError(msg); toast.show(msg, "error"); return; }
    setSuccess(true); toast.show("Registrasi berhasil. Silakan cek email untuk verifikasi.", "success");
  }

  if (success) return <div className="mx-auto max-w-xl rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-xl animate-page-in"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl">✓</div><h1 className="mt-5 text-2xl font-black">Registrasi berhasil!</h1><p className="mt-2 text-sm leading-6 text-slate-500">Email verifikasi sudah dikirim ke <b>{email}</b>. Cek inbox atau folder spam.</p><Link href="/login" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700">Kembali ke Login</Link></div>;

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 animate-page-in md:grid-cols-2">
      <div className="order-2 p-6 sm:p-9 md:order-1">
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 text-sm font-bold"><Link href="/login" className="flex-1 rounded-xl px-4 py-2.5 text-center text-slate-500 transition hover:text-blue-600">Login</Link><Link href="/register" className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-blue-700 shadow-sm">Daftar</Link></div>
        <h1 className="text-2xl font-black text-slate-900">Buat akun baru ✨</h1><p className="mt-1 text-sm text-slate-500">Daftar dan mulai menjelajahi Aidil Store.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block"><span className="text-sm font-bold text-slate-700">Nama Lengkap</span><input required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
          <label className="block"><span className="text-sm font-bold text-slate-700">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
          <label className="block"><span className="text-sm font-bold text-slate-700">Password</span><span className="relative mt-2 block"><input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200">{showPassword ? "Sembunyi" : "Lihat"}</button></span><span className="mt-1 block text-xs text-slate-400">Minimal 6 karakter.</span></label>
          {error && <div className="animate-page-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          <Button type="submit" loading={loading} className="w-full">Daftar Sekarang</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/login" className="font-bold text-blue-600 hover:underline">Login</Link></p>
      </div>
      <div className="relative order-1 hidden overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 p-10 text-white md:order-2 md:block"><div className="auth-orb absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" /><div className="relative z-10"><div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-3 shadow-xl"><img src="/logo.svg" alt="Aidil Store" className="h-full w-full rounded-2xl" /></div><p className="mt-8 text-xs font-black uppercase tracking-[.22em] text-blue-100">AIDIL STORE</p><h2 className="mt-2 text-4xl font-black">Yuk bergabung!</h2><p className="mt-4 text-sm leading-6 text-blue-100">Satu akun untuk belanja produk digital, mengatur saldo, dan memantau pesanan.</p><div className="mt-5 grid grid-cols-2 gap-2 text-xs font-bold"><span className="rounded-xl bg-white/10 p-3">⚡ Checkout praktis</span><span className="rounded-xl bg-white/10 p-3">🔐 Akun aman</span></div></div></div>
    </div>
  );
}
