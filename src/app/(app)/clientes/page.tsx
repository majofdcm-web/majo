import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, listFrequentCustomers } from "@/lib/store";
import { money, fmtDateTime } from "@/lib/format";

export default async function ClientesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "ventasHoy")) redirect("/sin-permisos");

  const customers = listFrequentCustomers();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Clientes frecuentes</h1>
      <p className="text-(--muted) -mt-2">
        Se arman solos con el nombre que se captura al abrir la mesa.
      </p>
      <div className="card max-w-2xl flex flex-col gap-2">
        {customers.length === 0 && (
          <p className="text-(--muted)">
            Todavía no hay clientes frecuentes registrados. Captúralos al abrir una mesa.
          </p>
        )}
        {customers.map((c) => (
          <div key={c.name} className="flex justify-between gap-2 py-2 border-b border-(--line) last:border-none text-sm">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-(--muted) text-xs">
                {c.visits} visita{c.visits === 1 ? "" : "s"} · última vez {fmtDateTime(c.lastVisit)}
              </div>
            </div>
            <div className="font-semibold">{money(c.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
