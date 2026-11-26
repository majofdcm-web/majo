"use client";

import { useState } from "react";
import { money2, fmtDateTime } from "@/lib/format";
import { submitPhysicalCountAction } from "@/lib/actions/conteo";
import type { PhysicalCount, PhysicalCountLine } from "@/lib/types";

interface AreaData {
  area: "Barra" | "Cocina" | "Almacén";
  ingredients: { id: string; name: string; unit: string }[];
}

export default function ConteoView({
  areas,
  canSeeNumbers,
  recentCounts,
}: {
  areas: AreaData[];
  canSeeNumbers: boolean;
  recentCounts: PhysicalCount[];
}) {
  const [areaIdx, setAreaIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PhysicalCountLine[] | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  const current = areas[areaIdx];

  function selectArea(i: number) {
    setAreaIdx(i);
    setValues({});
    setResult(null);
    setSavedMsg("");
    setError("");
  }

  async function submit() {
    setBusy(true);
    setError("");
    setResult(null);
    setSavedMsg("");
    const counts = current.ingredients.map((ing) => ({
      ingredientId: ing.id,
      counted: Number(values[ing.id]) || 0,
    }));
    const res = await submitPhysicalCountAction(current.area, counts);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.lines) {
      setResult(res.lines);
    } else {
      setSavedMsg(`Conteo de ${current.area} guardado.`);
    }
    setValues({});
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Conteo físico</h1>
      <p className="text-(--muted) -mt-2">
        Cuenta cada insumo del área y captura la cantidad en su unidad de receta. Si no hay nada,
        déjalo en 0.
      </p>

      <div className="flex gap-2 flex-wrap">
        {areas.map((a, i) => (
          <button
            key={a.area}
            onClick={() => selectArea(i)}
            className={`btn ${areaIdx === i ? "bg-(--teal-t) border-(--teal) text-(--teal) font-semibold" : ""}`}
          >
            {a.area}
          </button>
        ))}
      </div>

      <div className="card flex flex-col gap-2 max-w-2xl">
        <p className="label">{current.area}</p>
        {current.ingredients.length === 0 && <p className="text-(--muted)">No hay insumos en esta área.</p>}
        {current.ingredients.map((ing) => (
          <div key={ing.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-(--line) last:border-none">
            <span>{ing.name}</span>
            <div className="flex items-center gap-2">
              <input
                className="input !h-10 !min-h-0 w-28 text-right"
                inputMode="decimal"
                placeholder="0"
                value={values[ing.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [ing.id]: e.target.value.replace(/[^0-9.]/g, "") }))}
              />
              <span className="text-xs text-(--muted) w-10">{ing.unit}</span>
            </div>
          </div>
        ))}
        {error && <p className="text-(--red) text-sm">{error}</p>}
        {savedMsg && <p className="chip chip-ok w-fit">{savedMsg}</p>}
        <button onClick={submit} className="btn btn-pri mt-2" disabled={busy || current.ingredients.length === 0}>
          {busy ? "Guardando…" : `Guardar conteo de ${current.area}`}
        </button>
      </div>

      {result && (
        <div className="card flex flex-col gap-2 max-w-2xl">
          <p className="label">Diferencia de este conteo</p>
          {result
            .filter((l) => l.difference !== 0)
            .map((l) => (
              <div key={l.ingredientId} className="flex justify-between text-sm py-1 border-b border-(--line) last:border-none">
                <span>{l.ingredientName}</span>
                <span className={l.difference < 0 ? "text-(--red)" : "text-(--teal)"}>
                  {l.difference > 0 ? "+" : ""}
                  {l.difference} {l.unit} · {money2(l.differenceValue)}
                </span>
              </div>
            ))}
          {result.every((l) => l.difference === 0) && <p className="text-(--muted) text-sm">Sin diferencias.</p>}
        </div>
      )}

      {canSeeNumbers && recentCounts.length > 0 && (
        <div className="card flex flex-col gap-2 max-w-2xl">
          <p className="label">Conteos recientes</p>
          {recentCounts.map((c) => {
            const merma = c.lines.reduce((a, l) => a + (l.differenceValue < 0 ? l.differenceValue : 0), 0);
            return (
              <div key={c.id} className="flex justify-between text-sm py-1.5 border-b border-(--line) last:border-none">
                <div>
                  <div className="font-medium">
                    {c.area} · {fmtDateTime(c.ts)}
                  </div>
                  <div className="text-(--muted) text-xs">Contó {c.countedBy}</div>
                </div>
                <div className={merma < 0 ? "text-(--red)" : ""}>Merma: {money2(merma)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
