"use client";

import { useRouter } from "next/navigation";
import { money, money2, fmtDateTime } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/types";
import type { Sale } from "@/lib/types";

export default function TicketView({ sale }: { sale: Sale }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="no-print flex gap-2 w-full max-w-[302px] justify-between">
        <button onClick={() => router.push("/mesas")} className="btn btn-sm">
          ← Mesas
        </button>
        <button onClick={() => window.print()} className="btn btn-pri btn-sm">
          Imprimir
        </button>
      </div>
      <div
        className="w-[302px] mx-auto bg-white border border-(--line) p-4 text-xs leading-relaxed"
        style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
      >
        <div className="text-center font-bold">CAFÉ AKII</div>
        <div className="text-center">{fmtDateTime(sale.ts)}</div>
        <div className="border-t border-dashed border-black my-2" />
        <Row l="Folio" r={sale.folio} />
        <Row l="Mesa" r={sale.tableName} />
        {sale.customerName && <Row l="Cliente" r={sale.customerName} />}
        <Row l="Atendió" r={sale.waiterName} />
        <Row l="Cobró" r={sale.cashierName} />
        <div className="border-t border-dashed border-black my-2" />
        {sale.items.map((item) => (
          <div key={item.uid} className="flex justify-between gap-2">
            <span>
              {item.qty} {item.name}
              {item.modifiers.length > 0 && (
                <span className="block text-[11px]">
                  {item.modifiers.map((m) => m.name).join(", ")}
                </span>
              )}
            </span>
            <span>{money(item.unitPrice * item.qty)}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-black my-2" />
        <Row l="Subtotal" r={money(sale.subtotal)} />
        {sale.discount > 0 && (
          <Row l={`Descuento${sale.discountAuthorizedBy ? ` (aut. ${sale.discountAuthorizedBy})` : ""}`} r={`-${money(sale.discount)}`} />
        )}
        {sale.tip > 0 && <Row l="Propina" r={money(sale.tip)} />}
        <div className="border-t border-dashed border-black my-2" />
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span>{money(sale.total)}</span>
        </div>
        <Row l="Método" r={PAYMENT_LABEL[sale.method]} />
        {sale.method === "tarjeta" && <Row l="Comisión (5%)" r={money2(sale.commission)} />}
        <div className="text-center mt-3">¡Gracias por tu visita!</div>
      </div>
    </div>
  );
}

function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{l}</span>
      <span>{r}</span>
    </div>
  );
}
