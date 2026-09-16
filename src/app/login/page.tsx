"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/Button";
import { humanizeError } from "@/lib/utils";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const rawRedirectTo = searchParams.get("redirectTo");
  const redirectTo = rawRedirectTo && rawRedirectTo.startsWith("/") && !rawRedirectTo.startsWith("//") ? rawRedirectTo : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { const msg = humanizeError(error.message); setError(msg); toast.show(msg, "error"); return; }
    toast.show("Login berhasil.", "success");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 animate-page-in md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-700 p-10 text-white md:block">
        <div className="auth-orb absolute -right-16 -top-16 h-52 w-52 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="auth-orb absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative z-10"><img src="/logo.svg" alt="Aidil Store" className="h-14 w-14 rounded-2xl bg-white p-2 shadow-xl" /><p className="mt-8 text-xs font-black uppercase tracking-[.22em] text-blue-200">AIDIL STORE</p><h1 className="mt-2 text-4xl font-black">Selamat datang kembali!</h1><p className="mt-4 text-sm leading-6 text-blue-100">Masuk untuk mengakses saldo, pesanan, produk digital, dan fitur akunmu.</p></div>
      </div>
      <div className="p-6 sm:p-9">
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 text-sm font-bold"><Link href="/login" className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-blue-700 shadow-sm">Login</Link><Link href="/register" className="flex-1 rounded-xl px-4 py-2.5 text-center text-slate-500 transition hover:text-blue-600">Daftar</Link></div>
        <h2 className="text-2xl font-black text-slate-900">Masuk ke akun</h2><p className="mt-1 text-sm text-slate-500">Gunakan email dan password yang terdaftar.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block"><span className="text-sm font-bold text-slate-700">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
          <label className="block"><span className="flex items-center justify-between text-sm font-bold text-slate-700"><span>Password</span><Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Lupa password?</Link></span><span className="relative mt-2 block"><input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200">{showPassword ? "Sembunyi" : "Lihat"}</button></span></label>
          {error && <div className="animate-page-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          <Button type="submit" loading={loading} className="w-full">Login</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Belum punya akun? <Link href="/register" className="font-bold text-blue-600 hover:underline">Daftar sekarang</Link></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="mx-auto max-w-md animate-pulse rounded-3xl bg-white p-8 shadow-sm">Memuat halaman login...</div>}><LoginForm /></Suspense>;
}
