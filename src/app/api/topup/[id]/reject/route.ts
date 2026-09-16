import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ reason: z.string().min(3, "Alasan penolakan wajib diisi.") });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Anda tidak memiliki akses untuk melakukan ini." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: topup } = await supabase.from("topups").select("status").eq("id", params.id).single();
  if (!topup || (topup.status !== "PENDING" && topup.status !== "VERIFYING")) {
    return NextResponse.json({ message: "Transaksi ini sudah diproses sebelumnya." }, { status: 409 });
  }

  const { error } = await supabase
    .from("topups")
    .update({
      status: "REJECTED",
      rejection_reason: parsed.data.reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ message: "Gagal menolak Top Up. Silakan coba lagi." }, { status: 500 });
  }

  await createAdminClient().from("audit_logs").insert({
    actor_id: user.id,
    action: "topup.reject",
    target_type: "topup",
    target_id: params.id,
    metadata: { reason: parsed.data.reason },
  });

  return NextResponse.json({ message: "Top Up berhasil ditolak." });
}
