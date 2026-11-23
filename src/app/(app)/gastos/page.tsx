import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, state } from "@/lib/store";
import GastosView from "@/components/gastos-view";

export default async function GastosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "gastos")) redirect("/sin-permisos");

  const expenses = [...state().expenses].sort((a, b) => b.ts - a.ts).slice(0, 30);

  return <GastosView expenses={expenses} />;
}
