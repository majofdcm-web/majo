"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import type { ModifierGroup, Product, SelectedModifier } from "@/lib/types";

export default function ProductModal({
  product,
  groups,
  onCancel,
  onConfirm,
}: {
  product: Product;
  groups: ModifierGroup[];
  onCancel: () => void;
  onConfirm: (selected: SelectedModifier[], qty: number, note: string) => void;
}) {
  const [sel, setSel] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of groups) init[g.id] = g.type === "one" ? [g.options[0].name] : [];
    return init;
  });
  const [note, setNote] = useState("");

  function toggle(group: ModifierGroup, optName: string) {
    setSel((s) => {
      const cur = s[group.id] ?? [];
      if (group.type === "one") return { ...s, [group.id]: [optName] };
      const has = cur.includes(optName);
      return { ...s, [group.id]: has ? cur.filter((n) => n !== optName) : [...cur, optName] };
    });
  }

  const selected: SelectedModifier[] = groups.flatMap((g) =>
    (sel[g.id] ?? []).map((name) => {
      const opt = g.options.find((o) => o.name === name);
      return { groupId: g.id, name, priceDelta: opt?.priceDelta ?? 0 };
    }),
  );
  const unit = product.price + selected.reduce((a, m) => a + m.priceDelta, 0);

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-50" role="dialog" aria-label={product.name}>
      <div className="bg-white rounded-[20px] w-full max-w-[720px] max-h-[92vh] overflow-auto p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-3">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <span className="text-(--muted)">Base {money(product.price)}</span>
        </div>
        {groups.map((g) => (
          <div key={g.id}>
            <p className="label mb-2">
              {g.name} · {g.type === "one" ? "elige una" : "varios"}
            </p>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = (sel[g.id] ?? []).includes(o.name);
                return (
                  <button
                    key={o.name}
                    onClick={() => toggle(g, o.name)}
                    className={`min-h-11 px-3.5 rounded-xl border ${
                      on ? "bg-(--teal-t) border-2 border-(--teal) text-(--teal) font-semibold" : "border-(--line) bg-white"
                    }`}
                  >
                    {o.name}
                    {o.priceDelta ? ` +$${o.priceDelta}` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mnote" className="text-sm font-semibold text-(--muted)">
            Nota para barra
          </label>
          <input
            id="mnote"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. muy caliente"
          />
        </div>
        <div className="flex justify-between items-center gap-3">
          <button onClick={onCancel} className="btn">
            Cancelar
          </button>
          <button onClick={() => onConfirm(selected, 1, note)} className="btn btn-pri">
            Agregar · {money(unit)}
          </button>
        </div>
      </div>
    </div>
  );
}
