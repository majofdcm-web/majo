"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money, fmtDateTime } from "@/lib/format";
import { registerExpenseAction } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES, EXPENSE_ORIGINS } from "@/lib/types";
import type { Expense, ExpenseCategory, ExpenseOrigin } from "@/lib/types";
import { SUPPLIERS } from "@/lib/seed";

interface IngredientOption {
  id: string;
  name: string;
  unit: string;
}

export default function GastosView({
  expenses,
  ingredients,
}: {
  expenses: Expense[];
  ingredients: IngredientOption[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [supplier, setSupplier] = useState<string>(SUPPLIERS[0]);
  const [origin, setOrigin] = useState<ExpenseOrigin>(EXPENSE_ORIGINS[0]);
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const selectedIngredient = ingredients.find((i) => i.id === ingredientId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSavedMsg("");
    const qty = Number(quantity) || 0;
    const res = await registerExpenseAction({
      description,
      amount: Number(amount) || 0,
      supplier,
      origin,
      category,
      hasInvoice,
      stockPurchase: category === "Insumos" && ingredientId && qty > 0 ? { ingredientId, quantity: qty } : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (category === "Insumos" && ingredientId && qty > 0) {
      setSavedMsg(`Se sumaron ${qty} ${selectedIngredient?.unit ?? ""} de ${selectedIngredient?.name} al inventario.`);
    }
    setDescription("");
    setAmount("");
    setHasInvoice(false);
    setIngredientId("");
    setQuantity("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Gastos</h1>

      <form onSubmit={submit} className="card flex flex-col gap-4 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="desc" className="text-sm font-semibold text-(--muted)">
            Descripción
          </label>
          <input id="desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label htmlFor="amount" className="text-sm font-semibold text-(--muted)">
              Monto
            </label>
            <input
              id="amount"
              className="input"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label htmlFor="supplier" className="text-sm font-semibold text-(--muted)">
              Proveedor
            </label>
            <select id="supplier" className="input" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              {SUPPLIERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label htmlFor="origin" className="text-sm font-semibold text-(--muted)">
              ¿De dónde salió el dinero?
            </label>
            <select id="origin" className="input" value={origin} onChange={(e) => setOrigin(e.target.value as ExpenseOrigin)}>
              {EXPENSE_ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label htmlFor="category" className="text-sm font-semibold text-(--muted)">
              Categoría
            </label>
            <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="w-5 h-5" checked={hasInvoice} onChange={(e) => setHasInvoice(e.target.checked)} />
          <span>Tiene factura</span>
        </label>

        {category === "Insumos" && (
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-(--teal-t)">
            <p className="text-sm font-semibold text-(--teal)">¿Esto entra al inventario?</p>
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label htmlFor="ingrediente" className="text-sm font-semibold text-(--muted)">
                  Insumo comprado (opcional)
                </label>
                <select id="ingrediente" className="input" value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
                  <option value="">— Ninguno —</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </select>
              </div>
              {ingredientId && (
                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                  <label htmlFor="cantidad" className="text-sm font-semibold text-(--muted)">
                    Cantidad comprada ({selectedIngredient?.unit})
                  </label>
                  <input
                    id="cantidad"
                    className="input"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ""))}
                  />
                </div>
              )}
            </div>
            {ingredientId && (
              <p className="text-xs text-(--muted)">
                Suma esa cantidad al inventario y recalcula el costo de {selectedIngredient?.name} con lo pagado.
              </p>
            )}
          </div>
        )}

        {savedMsg && <p className="chip chip-ok w-fit">{savedMsg}</p>}
        {error && <p className="text-(--red) text-sm">{error}</p>}
        <button type="submit" className="btn btn-pri" disabled={busy}>
          {busy ? "Guardando…" : "Registrar gasto"}
        </button>
      </form>

      <div className="card flex flex-col gap-2 max-w-2xl">
        <p className="label">Gastos recientes</p>
        {expenses.length === 0 && <p className="text-(--muted)">Todavía no hay gastos registrados.</p>}
        {expenses.map((e) => (
          <div key={e.id} className="flex justify-between gap-2 py-2 border-b border-(--line) text-sm">
            <div>
              <div className="font-medium">{e.description}</div>
              <div className="text-(--muted) text-xs">
                {fmtDateTime(e.ts)} · {e.supplier} · {e.origin} · {e.category}
                {e.hasInvoice ? " · con factura" : " · sin factura"} · {e.registeredBy}
              </div>
            </div>
            <div className="font-semibold">{money(e.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
