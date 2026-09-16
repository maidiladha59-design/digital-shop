"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/Button";
import { formatRupiah, humanizeError } from "@/lib/utils";

const NOMINALS = [10000, 20000, 50000, 100000, 200000, 500000];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type PaymentMethod = {
  id: string;
  method: string;
  account_number: string;
  account_name: string;
  instructions: string | null;
};

function TopUpForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [copied, setCopied] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const requested = Number(searchParams.get("amount") || "0");
    if (Number.isFinite(requested) && requested > 0) {
      const normalized = Math.max(1000, Math.round(requested));
      setAmount(normalized);
      setCustomAmount(String(normalized));
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadMethods() {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("id, method, account_number, account_name, instructions")
        .eq("is_active", true);

      if (!error && data) setMethods(data as PaymentMethod[]);
      setLoadingMethods(false);
    }
    loadMethods();
  }, [supabase]);

  function chooseAmount(n: number) {
    setAmount(n);
    setCustomAmount(String(n));
    setStep(2);
  }

  function chooseCustomAmount() {
    const n = Number(customAmount.replace(/[^0-9]/g, ""));
    if (!Number.isInteger(n) || n < 1000) {
      toast.show("Nominal custom minimal Rp1.000.", "error");
      return;
    }
    setAmount(n);
    setStep(2);
  }

  function chooseMethod(m: PaymentMethod) {
    setSelectedMethod(m);
    setStep(3);
  }

  async function copyNumber() {
    if (!selectedMethod) return;
    await navigator.clipboard.writeText(selectedMethod.account_number);
    setCopied(true);
    toast.show(`Nomor ${selectedMethod.method} berhasil disalin.`, "success");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError(null);
    setUploadedPath(null);

    if (!f) return;

    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError("Format file harus JPG, PNG, atau WEBP.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("Ukuran file maksimal 5MB.");
      return;
    }
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setFileError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      toast.show("Silakan login terlebih dahulu.", "error");
      return;
    }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("topup-proofs").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    setUploading(false);

    if (error) {
      setFileError(humanizeError(error.message));
      toast.show("Bukti pembayaran gagal diupload.", "error");
      return;
    }

    setUploadedPath(path);
    toast.show("Bukti pembayaran berhasil diupload.", "success");
    setStep(4);
  }

  async function handleSubmitTopup() {
    if (!amount || !selectedMethod || !uploadedPath) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          payment_method_id: selectedMethod.id,
          proof_url: uploadedPath,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.show(json.message || "Top Up gagal. Silakan coba lagi.", "error");
        setSubmitting(false);
        return;
      }

      setDone(true);
      toast.show("Top Up berhasil dikirim.", "success");
    } catch {
      toast.show("Koneksi bermasalah. Periksa internet Anda.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h1 className="text-lg font-bold text-emerald-800">Top Up Berhasil Dikirim</h1>
        <p className="mt-2 text-sm text-emerald-700">
          Status: <b>Menunggu verifikasi admin</b>.<br />
          Estimasi verifikasi: maksimal ±1 jam.
        </p>
        <Button className="mt-4" onClick={() => router.push("/wallet")}>
          Kembali ke Saldo
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold">Top Up Saldo</h1>

      {/* Step indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-brand" : "bg-gray-200"}`} />
        ))}
      </div>

      {/* STEP 1: pilih nominal */}
      {step === 1 && (
        <div className="mt-6">
          <p className="text-sm font-medium">Pilih nominal Top Up</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {NOMINALS.map((n) => (
              <button
                key={n}
                onClick={() => chooseAmount(n)}
                className="rounded-lg border border-gray-300 py-3 text-sm font-medium hover:border-brand hover:text-brand"
              >
                {formatRupiah(n)}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-700">Nominal custom</p>
            <div className="mt-2 flex gap-2">
              <input value={customAmount} onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="Contoh: 75000" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
              <Button onClick={chooseCustomAmount}>Lanjut</Button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Minimal Rp1.000.</p>
          </div>
        </div>
      )}

      {/* STEP 2: pilih metode pembayaran */}
      {step === 2 && amount && (
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Nominal: <b className="text-navy">{formatRupiah(amount)}</b>
          </p>
          <p className="mt-4 text-sm font-medium">Pilih metode pembayaran</p>

          {loadingMethods ? (
            <p className="mt-3 text-sm text-gray-400">Memuat metode pembayaran...</p>
          ) : methods.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">Belum ada metode pembayaran aktif. Hubungi admin.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => chooseMethod(m)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left text-sm hover:border-brand"
                >
                  <p className="font-medium">{m.method}</p>
                  <p className="text-xs text-gray-500">a.n {m.account_name}</p>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-500 hover:underline">
            ← Ganti nominal
          </button>
        </div>
      )}

      {/* STEP 3: instruksi transfer + upload bukti */}
      {step === 3 && amount && selectedMethod && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium">{selectedMethod.method}</p>
            <p className="mt-2 text-2xl font-bold tracking-wide">{selectedMethod.account_number}</p>
            <p className="text-sm text-gray-500">a.n {selectedMethod.account_name}</p>
            <Button variant="secondary" className="mt-3" onClick={copyNumber}>
              {copied ? "Tersalin!" : `Salin Nomor ${selectedMethod.method}`}
            </Button>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            Transfer sesuai nominal <b>{formatRupiah(amount)}</b>. Setelah transfer, upload bukti pembayaran di bawah ini.
          </div>

          <div>
            <label className="block text-sm font-medium">Upload Bukti Pembayaran</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm"
            />
            {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
            <Button className="mt-3" onClick={handleUpload} loading={uploading} disabled={!file}>
              Upload Bukti
            </Button>
          </div>

          <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:underline">
            ← Ganti metode pembayaran
          </button>
        </div>
      )}

      {/* STEP 4: konfirmasi & submit */}
      {step === 4 && amount && selectedMethod && uploadedPath && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <p className="flex justify-between py-1"><span className="text-gray-500">Nominal</span><span className="font-medium">{formatRupiah(amount)}</span></p>
            <p className="flex justify-between py-1"><span className="text-gray-500">Metode</span><span className="font-medium">{selectedMethod.method}</span></p>
            <p className="flex justify-between py-1"><span className="text-gray-500">Bukti pembayaran</span><span className="font-medium text-emerald-600">Terupload ✓</span></p>
          </div>

          <Button className="w-full" onClick={handleSubmitTopup} loading={submitting}>
            Submit Top Up
          </Button>
        </div>
      )}
    </div>
  );
}

export default function TopUpPage() { return <Suspense fallback={<div className="mx-auto max-w-lg animate-pulse rounded-3xl bg-white p-8 shadow-sm">Memuat Top Up...</div>}><TopUpForm /></Suspense>; }
