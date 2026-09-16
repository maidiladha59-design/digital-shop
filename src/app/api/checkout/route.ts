import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  idempotency_key: z.string().min(10),
});

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data checkout tidak valid." },
      { status: 400 }
    );
  }

  const { items, idempotency_key } = parsed.data;

  const { data: orderId, error } = await supabase.rpc("checkout", {
    p_user_id: user.id,
    p_items: items,
    p_idempotency_key: idempotency_key,
  });

  if (error) {
    if (
      error.message.includes("UNAUTHENTICATED") ||
      error.message.includes("USER_ID_MISMATCH")
    ) {
      return NextResponse.json(
        { message: "Sesi login tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }

    if (error.message.includes("INSUFFICIENT_BALANCE")) {
      return NextResponse.json(
        { message: "Saldo Anda tidak mencukupi." },
        { status: 402 }
      );
    }

    if (error.message.includes("PRODUCT_NOT_FOUND")) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan atau sudah tidak tersedia." },
        { status: 404 }
      );
    }

    if (error.message.includes("WALLET_NOT_FOUND")) {
      return NextResponse.json(
        {
          message:
            "Wallet belum tersedia untuk akun ini. Silakan login ulang.",
        },
        { status: 500 }
      );
    }

    if (
      error.message.includes("INVALID_ITEM") ||
      error.message.includes("INVALID_ITEMS") ||
      error.message.includes("INVALID_QUANTITY")
    ) {
      return NextResponse.json(
        { message: "Data produk atau jumlah tidak valid." },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("CHECKOUT ERROR:", error);

      return NextResponse.json(
        { message: `Checkout gagal: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Checkout gagal. Silakan coba lagi." },
      { status: 500 }
    );
  }

  /*
   * Produk digital → otomatis COMPLETED.
   * Produk/jasa non-digital → tetap PROCESSING.
   *
   * Kita mengambil product_type langsung dari tabel products
   * untuk menghindari masalah TypeScript pada nested relation.
   */
  try {
    const admin = createAdminClient();

    const { data: orderItems, error: orderItemsError } = await admin
      .from("order_items")
      .select("product_id")
      .eq("order_id", orderId);

    if (orderItemsError) {
      throw orderItemsError;
    }

    if (orderItems && orderItems.length > 0) {
      const productIds = orderItems
        .map((item) => item.product_id)
        .filter(Boolean);

      if (productIds.length === orderItems.length) {
        const { data: products, error: productsError } = await admin
          .from("products")
          .select("id, product_type")
          .in("id", productIds);

        if (productsError) {
          throw productsError;
        }

        const allDigital =
          Array.isArray(products) &&
          products.length === productIds.length &&
          products.every((product) => product.product_type === "digital");

        if (allDigital) {
          const { error: completeError } = await admin
            .from("orders")
            .update({
              status: "COMPLETED",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .eq("status", "PROCESSING");

          if (completeError) {
            throw completeError;
          }
        }
      }
    }
  } catch (completionError) {
    console.error("AUTO COMPLETE ORDER ERROR:", completionError);

    // Pembayaran tetap berhasil.
    // Admin masih dapat menyelesaikan order dari panel.
  }

  return NextResponse.json(
    {
      order_id: orderId,
      message: "Pesanan berhasil dibuat.",
    },
    { status: 201 }
  );
}