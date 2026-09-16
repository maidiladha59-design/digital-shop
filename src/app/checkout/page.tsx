"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/Button";
import { formatRupiah } from "@/lib/utils";

type Product = { id: string; name: string; price: number; thumbnail_url: string | null; product_type?: string };

function CheckoutForm() {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const parsedQty = Number(searchParams.get("qty") ?? "1");
  const qty = Number.isInteger(parsedQty) && parsedQty > 0 ? parsedQty : 0;
  const [product, setProduct] = useState<Product | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const idempotencyKey = useMemo(() => `${productId}-${qty}-${Date.now()}-${Math.random().toString(36).slice(2)}`, [productId, qty]);

  useEffect(() => {
    async function load() {
      if (!productId || qty < 1) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const target = `/checkout?product=${encodeURIComponent(productId)}&qty=${encodeURIComponent(String(qty))}`;
        router.push(`/login?redirectTo=${encodeURIComponent(target)}`);
        return;
      }
      const [{ data: p }, { data: wallet }] = await Promise.all([
        supabase.from("products").select("id, name, price, thumbnail_url, product_type").eq("id", productId).single(),
        supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
      ]);
      setProduct(p as Product);
      setBalance(Number(wallet?.balance || 0));
      setLoading(false);
    }
    load();
  }, [productId, qty, supabase, router]);

  async function handleConfirm() {
    if (!product || confirming) return;
    const total = product.price * qty;
    if (balance < total) {
      toast.show("Saldo tidak mencukupi. Silakan Top Up terlebih dahulu.", "error");
      router.push(`/wallet/topup?amount=${encodeURIComponent(String(total - balance))}`);
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ product_id: product.id, quantity: qty }], idempotency_key: idempotencyKey }) });
      const json = await res.json();
      if (!res.ok) { toast.show(json.message || "Checkout gagal.", "error"); setConfirming(false); return; }
      toast.show("Pesanan berhasil dibuat menggunakan saldo.", "success");
      router.push(`/orders/${json.order_id}`);
    } catch { toast.show("Koneksi bermasalah. Silakan coba lagi.", "error"); setConfirming(false); }
  }

  if (!productId || qty < 1) return <p className="text-sm text-slate-500">Parameter produk atau jumlah tidak valid.</p>;
  if (loading) return <div className="mx-auto max-w-lg animate-pulse rounded-3xl bg-white p-8 shadow-sm">Memuat checkout...</div>;
  if (!product) return <p className="text-sm text-slate-500">Produk tidak ditemukan.</p>;
  const subtotal = product.price * qty;
  const enough = balance >= subtotal;

  return (
    <div className="mx-auto max-w-2xl animate-page-in">
      <div className="mb-6 flex items-center gap-3"><img src="/logo.svg" alt="Aidil Store" className="h-12 w-12 rounded-2xl shadow-lg" /><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">AIDIL STORE</p><h1 className="text-2xl font-black text-slate-900">Konfirmasi Checkout</h1></div></div>
      <div className="grid gap-5 md:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-4"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">{product.thumbnail_url ? <img src={product.thumbnail_url} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl">🛍️</div>}</div><div><p className="font-black text-slate-900">{product.name}</p><p className="mt-1 text-sm text-slate-500">Jumlah pembelian: {qty}</p><p className="mt-3 text-lg font-black text-blue-600">{formatRupiah(product.price)} / item</p></div></div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">Ringkasan</p><div className="mt-4 space-y-3 text-sm"><p className="flex justify-between"><span className="text-slate-500">Subtotal</span><b>{formatRupiah(subtotal)}</b></p><p className="flex justify-between"><span className="text-slate-500">Saldo saat ini</span><b>{formatRupiah(balance)}</b></p><div className="border-t border-slate-100 pt-3"><p className="flex justify-between text-base"><span className="font-bold">Total</span><b className="text-blue-600">{formatRupiah(subtotal)}</b></p></div></div><div className={`mt-4 rounded-2xl p-3 text-xs font-bold ${enough ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{enough ? "✓ Saldo mencukupi untuk pembelian ini." : "Saldo belum mencukupi. Top Up dulu sebelum checkout."}</div><Button className="mt-4 w-full" onClick={handleConfirm} loading={confirming}>{enough ? "Bayar dengan Saldo" : "Top Up Saldo"}</Button></div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="mx-auto max-w-lg animate-pulse rounded-3xl bg-white p-8 shadow-sm">Memuat checkout...</div>}><CheckoutForm /></Suspense>;
}
