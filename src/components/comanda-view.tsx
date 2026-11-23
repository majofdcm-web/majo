"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import {
  addItemAction,
  closeEmptyOrderAction,
  removeItemAction,
  sendToKitchenAction,
  setPeopleAction,
} from "@/lib/actions/orders";
import ProductModal from "@/components/product-modal";
import AuthModal from "@/components/auth-modal";
import type { ModifierGroup, Order, Product, SelectedModifier } from "@/lib/types";

export default function ComandaView({
  order,
  tableName,
  catalog,
  modifierGroups,
  canCobrar,
}: {
  order: Order;
  tableName: string;
  catalog: { category: string; products: Product[] }[];
  modifierGroups: ModifierGroup[];
  canCobrar: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [cat, setCat] = useState(catalog[0]?.category ?? "");
  const [notice, setNotice] = useState("");
  const [modalProduct, setModalProduct] = useState<{ product: Product; groups: ModifierGroup[] } | null>(null);
  const [authFor, setAuthFor] = useState<string | null>(null);

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2600);
  }

  function back() {
    setBusy(true);
    startTransition(async () => {
      await closeEmptyOrderAction(order.id);
      router.push("/mesas");
    });
  }

  function addSimple(product: Product) {
    setBusy(true);
    startTransition(async () => {
      const res = await addItemAction(order.id, product.id, [], 1, "");
      setBusy(false);
      if (!res.ok) flash(res.error);
      else router.refresh();
    });
  }

  function openProduct(product: Product) {
    const groups = product.modifierGroupIds
      .map((id) => modifierGroups.find((g) => g.id === id))
      .filter((g): g is ModifierGroup => !!g);
    if (groups.length === 0) {
      addSimple(product);
      return;
    }
    setModalProduct({ product, groups });
  }

  function confirmAdd(selected: SelectedModifier[], qty: number, note: string) {
    const product = modalProduct!.product;
    setModalProduct(null);
    setBusy(true);
    startTransition(async () => {
      const res = await addItemAction(order.id, product.id, selected, qty, note);
      setBusy(false);
      if (!res.ok) flash(res.error);
      else router.refresh();
    });
  }

  function requestRemove(itemUid: string, status: string) {
    if (status === "pendiente") {
      setBusy(true);
      startTransition(async () => {
        const res = await removeItemAction(order.id, itemUid);
        setBusy(false);
        if (!res.ok && "error" in res && res.error) flash(res.error);
        else router.refresh();
      });
    } else {
      setAuthFor(itemUid);
    }
  }

  async function authorizeRemove(pin: string) {
    const res = await removeItemAction(order.id, authFor as string, pin);
    if (res.ok) {
      setAuthFor(null);
      router.refresh();
      return { ok: true };
    }
    return { ok: false, error: "error" in res ? res.error : "No se pudo autorizar." };
  }

  function send() {
    setBusy(true);
    startTransition(async () => {
      const res = await sendToKitchenAction(order.id);
      setBusy(false);
      if (!res.ok) flash(res.error);
      else {
        flash("Enviado a barra y cocina");
        router.refresh();
      }
    });
  }

  function peopleDelta(delta: number) {
    setBusy(true);
    startTransition(async () => {
      const res = await setPeopleAction(order.id, order.people + delta);
      setBusy(false);
      if (!res.ok) flash(res.error);
      else router.refresh();
    });
  }

  const total = order.items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const pendingCount = order.items.filter((i) => i.status === "pendiente").length;
  const statusLabel = { pendiente: "Sin enviar", enviado: "En preparación", listo: "Entregado" } as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={back} className="btn btn-sm" disabled={busy}>
            ← Mesas
          </button>
          <h1 className="text-2xl font-bold">{tableName}</h1>
          <span className="text-(--muted) text-sm">Abrió {order.waiterName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-(--muted) text-sm">Personas</span>
          <button onClick={() => peopleDelta(-1)} className="btn btn-sm" aria-label="Menos personas" disabled={busy}>
            −
          </button>
          <b>{order.people}</b>
          <button onClick={() => peopleDelta(1)} className="btn btn-sm" aria-label="Más personas" disabled={busy}>
            +
          </button>
        </div>
      </div>

      {notice && <div className="chip chip-w">{notice}</div>}

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
                disabled={busy}
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
          <p className="label">Comanda</p>
          {order.items.length === 0 && <p className="text-(--muted)">Toca un producto para agregarlo.</p>}
          {order.items.map((item) => (
            <div
              key={item.uid}
              className={`flex justify-between gap-2 py-2 border-b border-(--line) ${
                item.status === "pendiente" ? "bg-(--teal-t) -mx-2.5 px-2.5 rounded-lg border-none" : ""
              }`}
            >
              <div>
                <div>
                  {item.qty} {item.name}
                </div>
                {(item.modifiers.length > 0 || item.note) && (
                  <div className="text-xs text-(--muted)">
                    {[...item.modifiers.map((m) => m.name + (m.priceDelta ? ` +$${m.priceDelta}` : "")), item.note]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
                <div className="text-xs text-(--muted)">{statusLabel[item.status]}</div>
              </div>
              <div className="flex items-start gap-1">
                <span>{money(item.unitPrice * item.qty)}</span>
                <button
                  onClick={() => requestRemove(item.uid, item.status)}
                  aria-label={`Quitar ${item.name}`}
                  disabled={busy}
                  className="min-w-8 min-h-8 rounded-lg text-(--muted) hover:bg-(--bg) hover:text-(--red)"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between text-xl font-bold pt-1">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          <button onClick={send} className="btn" disabled={pendingCount === 0 || busy}>
            Enviar a barra y cocina{pendingCount ? ` (${pendingCount})` : ""}
          </button>
          {canCobrar ? (
            <button
              onClick={() => router.push(`/mesas/orden/${order.id}/cobrar`)}
              className="btn btn-pri"
              disabled={order.items.length === 0 || busy}
            >
              Cobrar
            </button>
          ) : (
            <button
              onClick={() => flash("Se avisó a caja para cobrar esta mesa")}
              className="btn btn-pri"
              disabled={order.items.length === 0 || busy}
            >
              Pedir cuenta a caja
            </button>
          )}
        </div>
      </div>

      {modalProduct && (
        <ProductModal
          product={modalProduct.product}
          groups={modalProduct.groups}
          onCancel={() => setModalProduct(null)}
          onConfirm={confirmAdd}
        />
      )}
      {authFor && (
        <AuthModal
          title="Autoriza un gerente"
          reason="Ese platillo ya se envió a preparación; cancelarlo necesita autorización."
          onCancel={() => setAuthFor(null)}
          onSubmit={authorizeRemove}
        />
      )}
    </div>
  );
}
