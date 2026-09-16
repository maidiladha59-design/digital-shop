"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/Button";
import { humanizeError } from "@/lib/utils";

type PaymentMethod = {
  id: string;
  method: string;
  account_number: string;
  account_name: string;
  instructions: string | null;
  is_active: boolean;
};

const emptyForm = { method: "", account_number: "", account_name: "", instructions: "" };

export default function AdminPaymentSettingsPage() {
  const supabase = createClient();
  const toast = useToast();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("payment_settings").select("*").order("updated_at", { ascending: false });
    setMethods((data as PaymentMethod[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("payment_settings").insert({ ...form, is_active: true });

    setSaving(false);

    if (error) {
      toast.show(humanizeError(error.message), "error");
      return;
    }

    toast.show("Metode pembayaran berhasil ditambahkan.", "success");
    setForm(emptyForm);
    load();
  }

  async function toggleActive(m: PaymentMethod) {
    const { error } = await supabase
      .from("payment_settings")
      .update({ is_active: !m.is_active, updated_at: new Date().toISOString() })
      .eq("id", m.id);

    if (error) {
      toast.show(humanizeError(error.message), "error");
      return;
    }
    toast.show(m.is_active ? "Metode dinonaktifkan." : "Metode diaktifkan.", "success");
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Payment Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Nomor pembayaran ditampilkan ke user dari data ini — tidak hard-code di kode frontend.
      </p>

      <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <input required placeholder="Metode (mis. DANA)" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required placeholder="Nomor Akun" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required placeholder="Nama Pemilik" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Instruksi tambahan (opsional)" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <Button type="submit" loading={saving} className="sm:col-span-2">Tambah Metode Pembayaran</Button>
      </form>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : (
          methods.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <div>
                <p className="font-medium">{m.method} — {m.account_number}</p>
                <p className="text-gray-500">a.n {m.account_name}</p>
              </div>
              <Button variant={m.is_active ? "danger" : "secondary"} onClick={() => toggleActive(m)}>
                {m.is_active ? "Nonaktifkan" : "Aktifkan"}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
