"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const MENU = [
  ["/admin", "📊", "Dashboard"],
  ["/admin/products", "📦", "Produk"],
  ["/admin/orders", "🧾", "Pesanan"],
  ["/admin/users", "👥", "Pengguna"],
  ["/admin/topups", "💰", "Top Up"],
  ["/admin/payment-settings", "💳", "Pembayaran"],
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await createClient().auth.signOut();
    router.replace("/admin-login");
    router.refresh();
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
        <img src="/logo.svg" alt="Aidil Store" className="h-11 w-11 rounded-xl bg-white p-1" />
        <div><p className="font-black">AIDIL STORE</p><p className="text-xs text-blue-100">Admin Panel</p></div>
      </div>
      <nav className="p-3">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Menu utama</p>
        <div className="space-y-1">
          {MENU.map(([href, icon, label]) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}><span>{icon}</span>{label}</Link>;
          })}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">🏠 Lihat Toko</Link>
          <button disabled={loading} onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">🚪 {loading ? "Keluar..." : "Logout"}</button>
        </div>
      </nav>
    </aside>
  );
}
