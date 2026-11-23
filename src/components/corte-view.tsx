"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money, fmtDateTime } from "@/lib/format";
import { closeShiftAction, openShiftAction } from "@/lib/actions/shift";

interface ShiftNumbers {
  cashSales: number;
  card: number;
  transfer: number;
  cashExpenses: number;
  tipCard: number;
  tipCash: number;
  expected: number;
  commission: number;
}

export default function CorteView({
  shift,
  numbers,
}: {
  shift: { openedAt: number; fund: number; openedBy: string } | null;
  numbers: ShiftNumbers | null;
}) {
  const router = useRouter();
  const [fund, setFund] = useState("1000");
  const [counted, setCounted] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  async function openTurn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await openShiftAction(Number(fund) || 0);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  async function closeTurn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await closeShiftAction(Number(counted) || 0);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res.difference);
    setCounted("");
  }

  if (!shift || !numbers) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Corte de caja</h1>
        {result !== null && (
          <div className={`chip ${result === 0 ? "chip-ok" : Math.abs(result) < 20 ? "chip-w" : "chip-bad"}`}>
            Turno cerrado. Diferencia: {money(result)}
          </div>
        )}
        <form onSubmit={openTurn} className="card flex flex-col gap-4 max-w-sm">
          <p className="text-(--muted)">No hay un turno de caja abierto. Abre uno para empezar a cobrar.</p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fund" className="text-sm font-semibold text-(--muted)">
              Fondo inicial
            </label>
            <input
              id="fund"
              className="input"
              inputMode="decimal"
              value={fund}
              onChange={(e) => setFund(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>
          {error && <p className="text-(--red) text-sm">{error}</p>}
          <button type="submit" className="btn btn-pri" disabled={busy}>
            Abrir turno
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Corte de caja</h1>
      <p className="text-(--muted) -mt-2">
        Turno abierto por {shift.openedBy} · {fmtDateTime(shift.openedAt)} · Fondo {money(shift.fund)}
      </p>

      <div className="card grid gap-3 grid-cols-2 sm:grid-cols-3 max-w-2xl">
        <Kpi label="Ventas efectivo" value={money(numbers.cashSales)} />
        <Kpi label="Ventas tarjeta" value={money(numbers.card)} />
        <Kpi label="Ventas transferencia" value={money(numbers.transfer)} />
        <Kpi label="Gastos de caja" value={money(numbers.cashExpenses)} />
        <Kpi label="Propina tarjeta pagada" value={money(numbers.tipCard)} />
        <Kpi label="Comisión Mercado Pago" value={money(numbers.commission)} />
      </div>

      <div className="card max-w-sm">
        <p className="label mb-1">Debe haber en caja</p>
        <p className="text-3xl font-bold">{money(numbers.expected)}</p>
        <p className="text-(--muted) text-xs mt-1">
          Fondo + ventas en efectivo − gastos de caja − propinas de tarjeta pagadas
        </p>
      </div>

      <form onSubmit={closeTurn} className="card flex flex-col gap-4 max-w-sm">
        <p className="label">Cerrar turno</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="counted" className="text-sm font-semibold text-(--muted)">
            Dinero contado en caja
          </label>
          <input
            id="counted"
            className="input"
            inputMode="decimal"
            value={counted}
            onChange={(e) => setCounted(e.target.value.replace(/[^0-9.]/g, ""))}
            required
          />
        </div>
        {error && <p className="text-(--red) text-sm">{error}</p>}
        <button type="submit" className="btn btn-warn" disabled={busy}>
          {busy ? "Cerrando…" : "Cerrar turno y guardar diferencia"}
        </button>
      </form>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-(--muted)">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
