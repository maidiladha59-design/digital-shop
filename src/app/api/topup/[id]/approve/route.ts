import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { message: "Sesi admin tidak ditemukan. Silakan login kembali." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Gagal membaca profil admin:", profileError);
    return NextResponse.json(
      { message: "Profil admin tidak ditemukan." },
      { status: 403 }
    );
  }

  if (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Anda tidak memiliki akses untuk melakukan ini." },
      { status: 403 }
    );
  }

  const { error } = await supabase.rpc("approve_topup", {
    p_topup_id: params.id,
    p_admin_id: user.id,
  });

  if (error) {
    console.error("APPROVE TOPUP ERROR:", error);

    const message = error.message || "Gagal menyetujui Top Up.";
    if (message.includes("TOPUP_ALREADY_PROCESSED")) {
      return NextResponse.json(
        { message: "Transaksi ini sudah diproses sebelumnya." },
        { status: 409 }
      );
    }
    if (message.includes("TOPUP_NOT_FOUND")) {
      return NextResponse.json(
        { message: "Data Top Up tidak ditemukan." },
        { status: 404 }
      );
    }
    if (message.includes("ADMIN_ONLY")) {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses untuk melakukan ini." },
        { status: 403 }
      );
    }
    if (message.includes("UNAUTHENTICATED") || message.includes("ADMIN_ID_MISMATCH")) {
      return NextResponse.json(
        { message: "Sesi admin tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: `Gagal menyetujui Top Up: ${message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Top Up berhasil disetujui." });
}
