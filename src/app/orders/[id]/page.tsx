import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import DownloadButton from "@/components/DownloadButton";

const ORDER_MESSAGE: Record<string, string> = {
  PENDING: "Pesanan Anda sedang menunggu diproses.",
  PROCESSING: "Pesanan sedang diproses.",
  COMPLETED: "Pesanan selesai.",
  FAILED: "Pesanan gagal diproses.",
  CANCELLED: "Pesanan telah dibatalkan.",
  REFUNDED: "Dana telah dikembalikan ke saldo Anda.",
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, status, created_at, user_id")
    .eq("id", params.id)
    .single();

  if (!order || order.user_id !== user.id) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_id, product_name, unit_price, quantity, subtotal, products(product_type)")
    .eq("order_id", order.id);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold">Pesanan {order.order_number}</h1>
      <p className="mt-1 text-sm text-gray-500">{formatDate(order.created_at)}</p>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
        <StatusBadge status={order.status} />
        <p className="text-sm text-gray-600">{ORDER_MESSAGE[order.status]}</p>
      </div>

      <div className="mt-4 space-y-3">
        {items?.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <div className="flex justify-between">
              <p className="font-medium">{item.product_name}</p>
              <p>{formatRupiah(item.subtotal)}</p>
            </div>
            <p className="mt-1 text-gray-500">
              {item.quantity} x {formatRupiah(item.unit_price)}
            </p>

            {order.status === "COMPLETED" && (item.products as any)?.product_type === "digital" && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-emerald-800">
                <p className="font-medium">Produk Anda siap.</p>
                <DownloadButton productId={item.product_id} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold">
        <span>Total</span>
        <span>{formatRupiah(order.total_amount)}</span>
      </div>
    </div>
  );
}
