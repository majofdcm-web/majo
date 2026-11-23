"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import { openTableAction } from "@/lib/actions/orders";

interface TableVM {
  id: string;
  name: string;
  occupied: boolean;
  orderId?: string;
  waiterName?: string;
  mine?: boolean;
  people?: number;
  minutesOpen?: number;
  total?: number;
}

export default function MesasGrid({
  tables,
  canForce,
}: {
  tables: TableVM[];
  canForce: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2600);
  }

  function openFree(id: string) {
    startTransition(async () => {
      const res = await openTableAction(id);
      if (!res.ok) {
        flash(res.error);
        return;
      }
      router.push(`/mesas/orden/${res.orderId}`);
    });
  }

  function click(t: TableVM) {
    if (!t.occupied) {
      openFree(t.id);
      return;
    }
    if (t.mine || canForce) {
      router.push(`/mesas/orden/${t.orderId}`);
      return;
    }
    flash(`Esa mesa es de ${t.waiterName}`);
  }

  const openCount = tables.filter((t) => t.occupied).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Mesas</h1>
        <p className="text-(--muted) mt-1">
          {openCount} abiertas · tus mesas tienen borde resaltado
        </p>
      </div>
      {notice && <div className="chip chip-w">{notice}</div>}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
        {tables.map((t) => (
          <button
            key={t.id}
            onClick={() => click(t)}
            disabled={pending}
            className={[
              "min-h-[112px] rounded-2xl border p-3.5 text-left flex flex-col justify-between gap-1",
              t.occupied ? "bg-(--teal) border-(--teal) text-white" : "bg-white border-(--line)",
              t.occupied && t.mine ? "outline outline-[3px] -outline-offset-[3px] outline-[#9BD0C9]" : "",
              t.occupied && !t.mine && !canForce ? "opacity-60" : "",
            ].join(" ")}
          >
            <span className="font-semibold text-lg">{t.name}</span>
            {t.occupied ? (
              <span className="text-xs text-[#D5E8E5]">
                {t.people} pers · {t.minutesOpen} min · {t.waiterName}
              </span>
            ) : (
              <span className="text-xs text-(--muted)">Libre</span>
            )}
            {t.occupied && <span className="font-semibold text-[17px]">{money(t.total ?? 0)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
