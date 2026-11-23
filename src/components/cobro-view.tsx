"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money, money2 } from "@/lib/format";
import { authorizeDiscountAction, payOrderAction } from "@/lib/actions/sales";
import AuthModal from "@/components/auth-modal";
import type { Order, PaymentMethod } from "@/lib/types";
import { PAYMENT_LABEL } from "@/lib/types";

const METHODS: PaymentMethod[] = ["efectivo", "tarjeta", "transferencia"];

export default function CobroView({ order, tableName }: { order: Order; tableName: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [tipStr, setTipStr] = useState("0");
  const [discountStr, setDiscountStr] = useState("0");
  const [authorizer, setAuthorizer] = useState<{ id: string; name: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const subtotal = order.items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const tip = Math.max(0, Number(tipStr) || 0);
  const discount = Math.max(0, Number(discountStr) || 0);
  const total = Math.max(0, subtotal - discount + tip);
  const commission = method === "tarjeta" ? Math.round(total * 0.05 * 100) / 100 : 0;

  async function finish(discountAuthorizerId: string | null) {
    setBusy(true);
    setError("");
    const res = await payOrderAction(order.id, { method, tip, discount, discountAuthorizerId });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/ticket/${res.saleId}`);
  }

  function onCobrar() {
    if (discount > 0 && !authorizer) {
      setShowAuth(true);
      return;
    }
    finish(authorizer?.id ?? null);
  }

  async function onAuthSubmit(pin: string) {
    const res = await authorizeDiscountAction(pin);
    if (!res.ok) return { ok: false, error: res.error };
    setAuthorizer({ id: res.id, name: res.name });
    setShowAuth(false);
    await finish(res.id);
    return { ok: true };
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn btn-sm" disabled={busy}>
          ← Volver
        </button>
        <h1 className="text-2xl font-bold">Cobrar · {tableName}</h1>
      </div>

      <div className="card flex flex-col gap-2.5">
        <p className="label">Cuenta</p>
        {order.items.map((item) => (
          <div key={item.uid} className="flex justify-between text-sm">
            <span>
              {item.qty} {item.name}
            </span>
            <span>{money(item.unitPrice * item.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-2 border-t border-(--line)">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
      </div>

      <div className="card flex flex-col gap-4">
        <div>
          <p className="label mb-2">Método de pago</p>
          <div className="flex gap-2 flex-wrap">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`min-h-11 px-3.5 rounded-xl border ${
                  method === m ? "bg-(--teal-t) border-2 border-(--teal) text-(--teal) font-semibold" : "border-(--line) bg-white"
                }`}
              >
                {PAYMENT_LABEL[m]}
              </button>
            ))}
          </div>
          {method === "tarjeta" && (
            <p className="text-xs text-(--muted) mt-2">
              Se cobra 5% de comisión sobre el total (incluye propina): {money2(commission)}
            </p>
          )}
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label htmlFor="tip" className="text-sm font-semibold text-(--muted)">
              Propina
            </label>
            <input
              id="tip"
              className="input"
              inputMode="decimal"
              value={tipStr}
              onChange={(e) => setTipStr(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label htmlFor="discount" className="text-sm font-semibold text-(--muted)">
              Descuento
            </label>
            <input
              id="discount"
              className="input"
              inputMode="decimal"
              value={discountStr}
              onChange={(e) => {
                setDiscountStr(e.target.value.replace(/[^0-9.]/g, ""));
                setAuthorizer(null);
              }}
            />
          </div>
        </div>
        {discount > 0 && (
          <p className="text-xs text-(--muted)">
            {authorizer ? `Autorizado por ${authorizer.name}.` : "El descuento necesita el PIN de un gerente o admin."}
          </p>
        )}

        <div className="flex justify-between text-2xl font-bold pt-2 border-t border-(--line)">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>

        {error && <p className="text-(--red) text-sm">{error}</p>}

        <button onClick={onCobrar} className="btn btn-pri" disabled={busy}>
          {busy ? "Cobrando…" : `Cobrar ${money(total)}`}
        </button>
      </div>

      {showAuth && (
        <AuthModal
          title="Autoriza el descuento"
          reason={`Descuento de ${money(discount)} en la cuenta de ${tableName}.`}
          onCancel={() => setShowAuth(false)}
          onSubmit={onAuthSubmit}
        />
      )}
    </div>
  );
}
