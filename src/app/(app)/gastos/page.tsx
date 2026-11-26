import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, listIngredients, state } from "@/lib/store";
import GastosView from "@/components/gastos-view";

export default async function GastosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "gastos")) redirect("/sin-permisos");

  const expenses = [...state().expenses].sort((a, b) => b.ts - a.ts).slice(0, 30);
  const ingredients = listIngredients().map((i) => ({ id: i.id, name: i.name, unit: i.unit }));

  return <GastosView expenses={expenses} ingredients={ingredients} />;
}
