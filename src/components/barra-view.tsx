"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtTime } from "@/lib/format";
import { markItemReadyAction } from "@/lib/actions/kitchen";
import type { KitchenItem } from "@/lib/store";

export default function BarraView({ items }: { items: KitchenItem[] }) {
  const router = useRouter();
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(t);
  }, [router]);

  async function markReady(item: KitchenItem) {
    setBusyUid(item.uid);
    setError("");
    const res = await markItemReadyAction(item.orderId, item.uid);
    setBusyUid(null);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Barra y cocina</h1>
        <p className="text-(--muted) mt-1">{items.length} por preparar · se actualiza solo cada 8 segundos</p>
      </div>
      {error && <p className="text-(--red) text-sm">{error}</p>}
      {items.length === 0 ? (
        <div className="card">
          <p className="text-(--muted)">No hay nada pendiente de preparar en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {items.map((item) => (
            <div key={item.uid} className="card flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold text-lg">{item.tableName}</span>
                <span className="text-xs text-(--muted)">{fmtTime(item.openedAt)}</span>
              </div>
              <div>
                <b>
                  {item.qty} {item.name}
                </b>
                {item.modifiers.length > 0 && (
                  <div className="text-sm text-(--muted)">{item.modifiers.join(" · ")}</div>
                )}
                {item.note && <div className="text-sm text-(--orange)">Nota: {item.note}</div>}
              </div>
              <span className="text-xs text-(--muted)">Mesero: {item.waiterName}</span>
              <button onClick={() => markReady(item)} className="btn btn-pri" disabled={busyUid === item.uid}>
                {busyUid === item.uid ? "Marcando…" : "Marcar listo"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
