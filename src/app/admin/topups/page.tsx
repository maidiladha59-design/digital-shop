"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatRupiah, formatDate } from "@/lib/utils";

type Topup = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  proof_url: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
};

export default function AdminTopupsPage() {
  const supabase = createClient();
  const toast = useToast();

  const [topups, setTopups] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const { data: rawTopups, error } = await supabase
      .from("topups")
      .select("id, user_id, amount, status, proof_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal memuat Top Up:", error);
      toast.show(`Gagal memuat Top Up: ${error.message}`, "error");
      setTopups([]);
      setProofUrls({});
      setLoading(false);
      return;
    }

    const rows = rawTopups ?? [];
    const userIds = [...new Set(rows.map((t) => t.user_id))];
    const profileMap = new Map<string, { full_name: string | null; email: string }>();

    if (userIds.length) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profileError) {
        console.warn("Gagal memuat profil Top Up:", profileError);
      } else {
        for (const profile of profiles ?? []) {
          profileMap.set(profile.id, { full_name: profile.full_name, email: profile.email });
        }
      }
    }

    const enriched = rows.map((t) => ({
      ...t,
      profiles: profileMap.get(t.user_id) ?? null,
    }));
    setTopups(enriched as Topup[]);

    const urls: Record<string, string> = {};
    for (const t of rows) {
      if (t.proof_url) {
        const { data: signed } = await supabase.storage
          .from("topup-proofs")
          .createSignedUrl(t.proof_url, 300);
        if (signed) urls[t.id] = signed.signedUrl;
      }
    }
    setProofUrls(urls);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/topup/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.show(json.message || "Gagal menyetujui Top Up.", "error");
        return;
      }
      toast.show("Top Up berhasil disetujui.", "success");
      await load();
    } catch {
      toast.show("Koneksi bermasalah. Silakan coba lagi.", "error");
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    if (reason.trim().length < 3) {
      toast.show("Alasan penolakan wajib diisi.", "error");
      return;
    }
    setActingId(id);
    try {
      const res = await fetch(`/api/topup/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.show(json.message || "Gagal menolak Top Up.", "error");
        return;
      }
      toast.show("Top Up berhasil ditolak.", "success");
      setRejectingId(null);
      setReason("");
      await load();
    } catch {
      toast.show("Koneksi bermasalah. Silakan coba lagi.", "error");
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Memuat data Top Up...</div>;
  }

  return (
    <div className="animate-page-in">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">Keuangan</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Verifikasi Top Up</h1>
          <p className="mt-1 text-sm text-slate-500">Periksa bukti pembayaran lalu setujui atau tolak pengajuan.</p>
        </div>
        <button onClick={load} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600">↻ Refresh</button>
      </div>

      {topups.length === 0 ? (
        <div className="mt-4"><EmptyState title="Belum ada pengajuan Top Up" description="Pengajuan baru dari pengguna akan muncul di sini." /></div>
      ) : (
        <div className="space-y-3">
          {topups.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 font-black text-white">{(t.profiles?.full_name || t.profiles?.email || "U").charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="font-bold text-slate-800">{t.profiles?.full_name || t.profiles?.email || "Pengguna"}</p>
                    <p className="text-xs text-slate-500">{t.profiles?.email || "Email tidak tersedia"} · {formatDate(t.created_at)}</p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <p className="text-xl font-black text-blue-600">{formatRupiah(t.amount)}</p>
                {proofUrls[t.id] ? (
                  <a href={proofUrls[t.id]} target="_blank" rel="noreferrer" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-blue-600 shadow-sm hover:bg-blue-50">Lihat bukti pembayaran →</a>
                ) : <span className="text-xs text-slate-400">Bukti pembayaran tidak tersedia</span>}
              </div>

              {(t.status === "PENDING" || t.status === "VERIFYING") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => handleApprove(t.id)} loading={actingId === t.id}>✓ Approve</Button>
                  <Button variant="danger" onClick={() => setRejectingId(rejectingId === t.id ? null : t.id)}>✕ Reject</Button>
                </div>
              )}

              {rejectingId === t.id && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50 p-3 sm:flex-row">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan..." className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-red-100" />
                  <Button variant="danger" onClick={() => handleReject(t.id)} loading={actingId === t.id}>Kirim Penolakan</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
