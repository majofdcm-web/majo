import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, listIngredientsByArea, listPhysicalCounts } from "@/lib/store";
import ConteoView from "@/components/conteo-view";
import type { Ingredient } from "@/lib/types";

const AREAS: Ingredient["area"][] = ["Barra", "Cocina", "Almacén"];

export default async function ConteoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "conteo")) redirect("/sin-permisos");

  const canSeeNumbers = can(user, "inventario");
  const areas = AREAS.map((area) => ({
    area,
    ingredients: listIngredientsByArea(area).map((i) => ({ id: i.id, name: i.name, unit: i.unit })),
  }));

  return (
    <ConteoView
      areas={areas}
      canSeeNumbers={canSeeNumbers}
      recentCounts={canSeeNumbers ? listPhysicalCounts() : []}
    />
  );
}
