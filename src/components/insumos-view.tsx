"use client";

import { useMemo, useState } from "react";
import { money2 } from "@/lib/format";
import { updateIngredientAction } from "@/lib/actions/ingredients";
import type { Ingredient } from "@/lib/types";

const AREAS: Ingredient["area"][] = ["Barra", "Cocina", "Almacén"];

export default function InsumosView({
  ingredients,
  suppliers,
}: {
  ingredients: Ingredient[];
  suppliers: readonly string[];
}) {
  const [items, setItems] = useState(ingredients);
  const [areaFilter, setAreaFilter] = useState<"Todas" | Ingredient["area"]>("Todas");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (areaFilter !== "Todas" && i.area !== areaFilter) return false;
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, areaFilter, search]);

  function patchLocal(id: string, patch: Partial<Ingredient>) {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function save(id: string, patch: Partial<Ingredient>) {
    setSavingId(id);
    setError("");
    const res = await updateIngredientAction(id, patch);
    setSavingId(null);
    if (!res.ok) setError(res.error);
  }

  const sinCosto = items.filter((i) => i.cost === 0).length;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Insumos</h1>
      <p className="text-(--muted) -mt-2">
        Captura aquí el costo, proveedor y área de cada insumo. Se usa para calcular el costo de
        cada platillo y el valor del inventario. {sinCosto > 0 && `Faltan ${sinCosto} por costear.`}
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="input max-w-xs"
          placeholder="Buscar insumo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {(["Todas", ...AREAS] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAreaFilter(a)}
              className={`btn btn-sm ${areaFilter === a ? "bg-(--teal-t) border-(--teal) text-(--teal) font-semibold" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-(--red) text-sm">{error}</p>}

      <div className="card overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["Insumo", "Área", "Unidad", "Costo unitario", "Proveedor", "Existencia", "Mínimo"].map((h) => (
                <th key={h} className="text-left p-2.5 text-xs font-semibold uppercase text-(--muted) border-b border-(--line) whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ing) => (
              <tr key={ing.id} className={savingId === ing.id ? "opacity-60" : ""}>
                <td className="p-2.5 border-b border-(--line) font-medium whitespace-nowrap">{ing.name}</td>
                <td className="p-2.5 border-b border-(--line)">
                  <select
                    className="input !h-9 !min-h-0"
                    value={ing.area}
                    onChange={(e) => {
                      const area = e.target.value as Ingredient["area"];
                      patchLocal(ing.id, { area });
                      save(ing.id, { area });
                    }}
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2.5 border-b border-(--line) text-(--muted) whitespace-nowrap">{ing.unit}</td>
                <td className="p-2.5 border-b border-(--line)">
                  <input
                    className="input !h-9 !min-h-0 w-24"
                    inputMode="decimal"
                    value={ing.cost}
                    onChange={(e) => patchLocal(ing.id, { cost: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
                    onBlur={(e) => save(ing.id, { cost: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
                  />
                  {ing.cost === 0 && <span className="chip chip-w ml-1.5 align-middle">$0</span>}
                </td>
                <td className="p-2.5 border-b border-(--line)">
                  <select
                    className="input !h-9 !min-h-0"
                    value={ing.supplier}
                    onChange={(e) => {
                      patchLocal(ing.id, { supplier: e.target.value });
                      save(ing.id, { supplier: e.target.value });
                    }}
                  >
                    {suppliers.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2.5 border-b border-(--line)">
                  <input
                    className="input !h-9 !min-h-0 w-24"
                    inputMode="decimal"
                    value={ing.stock}
                    onChange={(e) => patchLocal(ing.id, { stock: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
                    onBlur={(e) => save(ing.id, { stock: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
                  />
                </td>
                <td className="p-2.5 border-b border-(--line)">
                  <input
                    className="input !h-9 !min-h-0 w-24"
                    inputMode="decimal"
                    value={ing.min}
                    onChange={(e) => patchLocal(ing.id, { min: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
                    onBlur={(e) => save(ing.id, { min: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-4 text-(--muted)">No hay insumos que coincidan.</p>}
      </div>
      <p className="text-xs text-(--muted)">
        Costo de referencia: {money2(0)} es insumo sin costear todavía. Los cambios se guardan solos al salir del campo.
      </p>
    </div>
  );
}
