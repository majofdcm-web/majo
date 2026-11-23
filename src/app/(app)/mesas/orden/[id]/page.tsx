import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, getOrder, listModifierGroups, listProductsByCategory, listTables } from "@/lib/store";
import ComandaView from "@/components/comanda-view";

export default async function OrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const order = getOrder(id);
  if (!order) redirect("/mesas");

  const table = listTables().find((t) => t.id === order.tableId);
  if (!table) redirect("/mesas");

  const canEdit = order.waiterId === user.id || can(user, "cobrar") || can(user, "autorizar");
  if (!canEdit) redirect("/mesas");

  return (
    <ComandaView
      order={order}
      tableName={table.name}
      catalog={listProductsByCategory().filter((c) => c.category !== "Personal")}
      modifierGroups={listModifierGroups()}
      canCobrar={can(user, "cobrar")}
    />
  );
}
