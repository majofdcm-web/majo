import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, getOrder, listTables } from "@/lib/store";
import CobroView from "@/components/cobro-view";

export default async function CobrarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "cobrar")) redirect("/mesas");

  const order = getOrder(id);
  if (!order) redirect("/mesas");
  if (order.items.length === 0) redirect(`/mesas/orden/${id}`);

  const table = listTables().find((t) => t.id === order.tableId);
  if (!table) redirect("/mesas");

  return <CobroView order={order} tableName={table.name} />;
}
