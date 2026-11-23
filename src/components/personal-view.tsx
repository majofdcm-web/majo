"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money, fmtDateTime } from "@/lib/format";
import { registerStaffConsumptionAction } from "@/lib/actions/personal";
import ProductModal from "@/components/product-modal";
import type { ModifierGroup, Product, SelectedModifier, StaffConsumption, User } from "@/lib/types";

interface CartItem {
  uid: string;
  product: Product;
  selected: SelectedModifier[];
  qty: number;
  note: string;
}

export default function PersonalView({
  users,
  catalog,
  modifierGroups,
  recent,
}: {
  users: User[];
  catalog: { category: string; products: Product[] }[];
  modifierGroups: ModifierGroup[];
  recent: StaffConsumption[];
}) {
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState(users[0]?.name ?? "");
  const [cat, setCat] = useState(catalog[0]?.category ?? "");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalProduct, setModalProduct] = useState<{ product: Product; groups: ModifierGroup[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openProduct(product: Product) {
    const groups = product.modifierGroupIds
      .map((id) => modifierGroups.find((g) => g.id === id))
      .filter((g): g is ModifierGroup => !!g);
    if (groups.length === 0) {
      setCart((c) => [...c, { uid: crypto.randomUUID(), product, selected: [], qty: 1, note: "" }]);
      return;
    }
    setModalProduct({ product, groups });
  }

  function confirmAdd(selected: SelectedModifier[], qty: number, note: string) {
    const product = modalProduct!.product;
    setModalProduct(null);
    setCart((c) => [...c, { uid: crypto.randomUUID(), product, selected, qty, note }]);
  }

  function removeItem(uid: string) {
    setCart((c) => c.filter((i) => i.uid !== uid));
  }

  async function submit() {
    setError("");
    if (!employeeName.trim()) {
      setError("Elige quién comió.");
      return;
    }
    if (cart.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }
    setBusy(true);
    const res = await registerStaffConsumptionAction(
      employeeName,
      cart.map((i) => ({ productId: i.product.id, selected: i.selected, qty: i.qty, note: i.note })),
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCart([]);
    router.refresh();
  }

  const totalRef = cart.reduce(
    (a, i) => a + (i.product.price + i.selected.reduce((x, m) => x + m.priceDelta, 0)) * i.qty,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Comida de personal</h1>
      <p className="text-(--muted) -mt-2">
        Lo que registres aquí descuenta del inventario pero no se cobra ni genera venta.
      </p>

      <div className="grid gap-3.5 items-start grid-cols-1 lg:grid-cols-[170px_minmax(0,1fr)_330px]">
        <div className="card flex flex-row lg:flex-col gap-1 p-2 overflow-x-auto">
          {catalog.map((c) => (
            <button
              key={c.category}
              onClick={() => setCat(c.category)}
              className={`text-left min-h-[44px] px-3 rounded-xl whitespace-nowrap ${
                cat === c.category ? "bg-(--teal-t) text-(--teal) font-semibold" : ""
              }`}
            >
              {c.category}
            </button>
          ))}
        </div>

        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
          {catalog
            .find((c) => c.category === cat)
            ?.products.map((p) => (
              <button
                key={p.id}
                onClick={() => openProduct(p)}
                className="min-h-[92px] rounded-2xl border border-(--line) bg-white p-3 text-left flex flex-col justify-between"
              >
                <b>{p.name}</b>
                <span className="text-(--muted) text-sm">
                  {money(p.price)}
                  {p.modifierGroupIds.length ? " · opciones" : ""}
                </span>
              </button>
            ))}
        </div>

        <div className="card flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="empleado" className="text-sm font-semibold text-(--muted)">
              ¿Quién comió?
            </label>
            <select id="empleado" className="input" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <p className="label">Consumo</p>
          {cart.length === 0 && <p className="text-(--muted)">Toca un producto para agregarlo.</p>}
          {cart.map((item) => (
            <div key={item.uid} className="flex justify-between gap-2 py-2 border-b border-(--line)">
              <div>
                <div>
                  {item.qty} {item.product.name}
                </div>
                {item.selected.length > 0 && (
                  <div className="text-xs text-(--muted)">{item.selected.map((m) => m.name).join(" · ")}</div>
                )}
              </div>
              <button
                onClick={() => removeItem(item.uid)}
                aria-label={`Quitar ${item.product.name}`}
                className="min-w-8 min-h-8 rounded-lg text-(--muted) hover:bg-(--bg) hover:text-(--red)"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex justify-between text-sm text-(--muted) pt-1">
            <span>Valor de referencia</span>
            <span>{money(totalRef)}</span>
          </div>
          {error && <p className="text-(--red) text-sm">{error}</p>}
          <button onClick={submit} className="btn btn-pri" disabled={busy}>
            {busy ? "Registrando…" : "Registrar consumo de personal"}
          </button>
        </div>
      </div>

      <div className="card flex flex-col gap-2 max-w-2xl">
        <p className="label">Registros recientes</p>
        {recent.length === 0 && <p className="text-(--muted)">Todavía no hay registros.</p>}
        {recent.map((r) => (
          <div key={r.id} className="flex justify-between gap-2 py-2 border-b border-(--line) text-sm">
            <div>
              <div className="font-medium">{r.employeeName}</div>
              <div className="text-(--muted) text-xs">
                {fmtDateTime(r.ts)} · {r.items.map((i) => `${i.qty} ${i.name}`).join(", ")} · registró {r.registeredBy}
              </div>
            </div>
            <div className="font-semibold">{money(r.cost)}</div>
          </div>
        ))}
      </div>

      {modalProduct && (
        <ProductModal
          product={modalProduct.product}
          groups={modalProduct.groups}
          onCancel={() => setModalProduct(null)}
          onConfirm={confirmAdd}
        />
      )}
    </div>
  );
}
