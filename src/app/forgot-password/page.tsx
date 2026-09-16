"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/Button";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      toast.show("Masukkan email terlebih dahulu.", "error");
      return;
    }

    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );

      if (error) {
        console.error("RESET PASSWORD ERROR:", error);
        toast.show(error.message, "error");
        return;
      }

      setSent(true);
      toast.show("Link reset password telah dikirim.", "success");
    } catch (error) {
      console.error("RESET PASSWORD EXCEPTION:", error);
      toast.show("Terjadi kesalahan. Silakan coba lagi.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-page-in">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-700 p-7 text-white">
          <img
            src="/logo.svg"
            alt="Aidil Store"
            className="h-12 w-12 rounded-2xl bg-white p-2"
          />

          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
            AIDIL STORE
          </p>

          <h1 className="mt-2 text-2xl font-black">
            Lupa password?
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            Kami akan mengirim tautan untuk membuat password baru.
          </p>
        </div>

        <div className="p-7 sm:p-8">
          {sent ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
              Link reset password telah dikirim ke{" "}
              <b>{email}</b>. Silakan cek inbox atau folder spam.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Email
                </span>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Kirim Link Reset
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-5 block text-center text-sm font-bold text-blue-600 hover:underline"
          >
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}