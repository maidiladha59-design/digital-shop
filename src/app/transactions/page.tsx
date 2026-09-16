import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDate } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";

const TYPE_LABEL: Record<string, string> = {
  TOPUP: "Top Up",
  PURCHASE: "Pembelian",
  REFUND: "Refund",
  ADJUSTMENT: "Penyesuaian",
};

export default async function TransactionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", user.id).single();

  const { data: transactions } = wallet
    ? await supabase
        .from("wallet_transactions")
        .select("id, type, amount, balance_before, balance_after, reference_id, created_at")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h1 className="text-xl font-bold">Riwayat Transaksi</h1>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        {transactions && transactions.length > 0 ? (
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Jenis</th>
                <th className="px-4 py-3 font-medium text-right">Nominal</th>
                <th className="px-4 py-3 font-medium text-right">Saldo Sebelum</th>
                <th className="px-4 py-3 font-medium text-right">Saldo Sesudah</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-500">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3">{TYPE_LABEL[t.type] || t.type}</td>
                  <td className={`px-4 py-3 text-right font-medium ${t.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {t.amount >= 0 ? "+" : ""}{formatRupiah(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatRupiah(t.balance_before)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatRupiah(t.balance_after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4">
            <EmptyState title="Belum ada transaksi" />
          </div>
        )}
      </div>
    </div>
  );
}
