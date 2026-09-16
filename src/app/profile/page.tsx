"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/Button";
import { humanizeError } from "@/lib/utils";

export default function ProfilePage() {
  const supabase = createClient();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single();
      setFullName(data?.full_name || "");
      setEmail(data?.email || "");
      setInitializing(false);
    }
    load();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      toast.show("Silakan login terlebih dahulu.", "error");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.show(humanizeError(error.message), "error");
      return;
    }
    toast.show("Profile berhasil diperbarui.", "success");
  }

  if (initializing) return <p className="text-sm text-gray-500">Memuat profile...</p>;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-bold">Profile Saya</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            disabled
            value={email}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nama Lengkap</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <Button type="submit" loading={loading}>Simpan Perubahan</Button>
      </form>
    </div>
  );
}
