import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, getOrder, listTables } from "@/lib/store";
import MesasGrid from "@/components/mesas-grid";

export default async function MesasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "mesas") && !can(user, "cobrar")) redirect("/sin-permisos");

  // Server Component: se ejecuta una vez por solicitud, no por render en el navegador.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const tables = listTables().map((t) => {
    const order = t.orderId ? getOrder(t.orderId) : null;
    if (!order) {
      return { id: t.id, name: t.name, occupied: false as const };
    }
    const total = order.items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
    return {
      id: t.id,
      name: t.name,
      occupied: true as const,
      orderId: order.id,
      waiterName: order.waiterName,
      mine: order.waiterId === user.id,
      people: order.people,
      minutesOpen: Math.max(0, Math.round((now - order.openedAt) / 60000)),
      total,
      customerName: order.customerName,
    };
  });

  const canForce = can(user, "cobrar") || can(user, "autorizar");

  return <MesasGrid tables={tables} canForce={canForce} />;
}
