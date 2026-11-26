import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, listIngredients } from "@/lib/store";
import { SUPPLIERS } from "@/lib/seed";
import InsumosView from "@/components/insumos-view";

export default async function InsumosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "inventario")) redirect("/sin-permisos");

  return <InsumosView ingredients={listIngredients()} suppliers={SUPPLIERS} />;
}
