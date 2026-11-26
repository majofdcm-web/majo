"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import type { ModifierGroup, ModifierOption, Product, SelectedModifier } from "@/lib/types";

/** Grupos cuyas opciones solo cuentan si antes se eligió "Combo (+$60)" en el grupo "combo". */
const COMBO_DEPENDENT_IDS = new Set(["comboCaliente", "comboFrio"]);

function isAccordionGroup(group: ModifierGroup): boolean {
  return group.options.length > 0 && group.options.every((o) => o.name.includes(":"));
}

function splitName(name: string): { cat: string; label: string } {
  const idx = name.indexOf(":");
  if (idx < 0) return { cat: name, label: name };
  return { cat: name.slice(0, idx).trim(), label: name.slice(idx + 1).trim() };
}

function CategoryAccordion({
  group,
  selectedName,
  onSelect,
}: {
  group: ModifierGroup;
  selectedName?: string;
  onSelect: (name: string) => void;
}) {
  const categories = new Map<string, (ModifierOption & { label: string })[]>();
  for (const o of group.options) {
    const { cat, label } = splitName(o.name);
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push({ ...o, label });
  }
  const entries = [...categories.entries()];
  const initialCat = entries.find(([, opts]) => opts.some((o) => o.name === selectedName))?.[0];
  const [openCat, setOpenCat] = useState<string | undefined>(initialCat);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {entries.map(([cat]) => (
          <button
            key={cat}
            onClick={() => setOpenCat(cat)}
            className={`min-h-11 px-3.5 rounded-xl border ${
              openCat === cat ? "bg-(--teal-t) border-2 border-(--teal) text-(--teal) font-semibold" : "border-(--line) bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      {openCat && (
        <div className="flex flex-wrap gap-2 pl-3 border-l-2 border-(--teal-t)">
          {categories.get(openCat)!.map((o) => (
            <button
              key={o.name}
              onClick={() => onSelect(o.name)}
              className={`min-h-11 px-3.5 rounded-xl border ${
                selectedName === o.name ? "bg-(--teal-t) border-2 border-(--teal) text-(--teal) font-semibold" : "border-(--line) bg-white"
              }`}
            >
              {o.label}
              {o.priceDelta ? ` +$${o.priceDelta}` : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
    for (const g of groups) {
      init[g.id] = g.type === "one" ? [g.options[0].name] : g.options.filter((o) => o.defaultChecked).map((o) => o.name);
    }
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

  const comboActive = groups.some((g) => g.id === "combo") ? (sel["combo"]?.[0] ?? "") === "Combo (+$60)" : true;

  const visibleGroups = groups.filter((g) => !COMBO_DEPENDENT_IDS.has(g.id) || comboActive);

  const selected: SelectedModifier[] = visibleGroups.flatMap((g) =>
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
        {visibleGroups.map((g) => (
          <div key={g.id}>
            <p className="label mb-2">
              {g.name} · {g.type === "one" ? "elige una" : "varios"}
            </p>
            {isAccordionGroup(g) ? (
              <CategoryAccordion group={g} selectedName={sel[g.id]?.[0]} onSelect={(name) => toggle(g, name)} />
            ) : (
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
            )}
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
