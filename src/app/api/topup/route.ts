import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  amount: z.number().int().positive(),
  payment_method_id: z.string().uuid(),
  proof_url: z.string().min(1),
});

// Membuat pengajuan Top Up baru. Saldo TIDAK ditambahkan di sini —
// hanya bertambah setelah admin melakukan approve (lihat /api/topup/[id]/approve).
export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Data Top Up tidak valid." }, { status: 400 });
  }

  const { amount, payment_method_id, proof_url } = parsed.data;

  // Bukti pembayaran wajib berada di folder milik user yang sedang login.
  // Ini mencegah user mengirim path file milik user lain.
  if (!proof_url.startsWith(`${user.id}/`)) {
    return NextResponse.json({ message: "Bukti pembayaran tidak valid." }, { status: 400 });
  }

  const { data: paymentMethod, error: paymentMethodError } = await supabase
    .from("payment_settings")
    .select("id")
    .eq("id", payment_method_id)
    .eq("is_active", true)
    .maybeSingle();

  if (paymentMethodError || !paymentMethod) {
    return NextResponse.json({ message: "Metode pembayaran tidak tersedia." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("topups")
    .insert({
      user_id: user.id,
      amount,
      payment_method_id,
      proof_url,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ message: "Top Up gagal. Silakan coba lagi." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, message: "Top Up berhasil dikirim." }, { status: 201 });
}
