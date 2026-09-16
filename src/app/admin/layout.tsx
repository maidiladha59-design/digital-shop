import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin-login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name, email").eq("id", user.id).single();
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN")) redirect("/dashboard");

  return <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-[230px_1fr]"><AdminSidebar /><section className="min-w-0">{children}</section></div>;
}
