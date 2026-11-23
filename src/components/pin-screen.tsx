"use client";

import { useState, useTransition } from "react";
import { loginWithPin } from "@/lib/actions/auth";

interface DemoUser {
  name: string;
  roleLabel: string;
  pin: string;
}

export default function PinScreen({ demoUsers }: { demoUsers: DemoUser[] }) {
  const [buf, setBuf] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(pin: string) {
    setError("");
    startTransition(async () => {
      const res = await loginWithPin(pin);
      if (res && !res.ok) {
        setError(res.error);
        setBuf("");
      }
    });
  }

  function press(k: string) {
    if (pending) return;
    if (k === "del") {
      setBuf((b) => b.slice(0, -1));
      return;
    }
    const next = (buf + k).slice(0, 4);
    setBuf(next);
    if (next.length === 4) submit(next);
  }

  return (
    <div className="min-h-screen flex flex-wrap">
      <div className="flex-1 min-w-[300px] bg-(--teal) text-white p-10 flex flex-col justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">Café Akii</h1>
          <p className="text-[#D5E8E5] mt-2 capitalize">
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div>
          <p className="label text-[#D5E8E5] mb-2">Cada quien con su PIN</p>
          <p className="leading-relaxed">
            Cada mesa, venta, descuento y gasto queda a nombre de quien lo hizo.
            Cada rol ve solo lo que le toca.
          </p>
        </div>
      </div>
      <div className="flex-[2] min-w-[320px] flex flex-col items-center justify-center gap-5 p-8">
        <h2 className="text-2xl font-semibold">Escribe tu PIN</h2>
        <div className="flex gap-3" aria-label={`${buf.length} de 4 dígitos`}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                i < buf.length ? "bg-(--teal) border-(--teal)" : "border-[#8A8780]"
              }`}
            />
          ))}
        </div>
        <div className="min-h-5 text-(--red) text-sm" role="alert">
          {error}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => press(String(n))}
              className="h-[70px] w-[92px] rounded-2xl border border-(--line) bg-white text-2xl font-semibold"
              disabled={pending}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => press("del")}
            className="h-[70px] w-[92px] rounded-2xl border border-(--line) bg-white text-sm text-(--muted)"
            disabled={pending}
          >
            Borrar
          </button>
          <button
            onClick={() => press("0")}
            className="h-[70px] w-[92px] rounded-2xl border border-(--line) bg-white text-2xl font-semibold"
            disabled={pending}
          >
            0
          </button>
          <span />
        </div>
        <div className="w-full max-w-xl">
          <p className="label mb-2">PIN de prueba para recorrer cada rol</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {demoUsers.map((u) => (
              <button
                key={u.pin}
                onClick={() => submit(u.pin)}
                className="border border-(--line) bg-white rounded-xl p-3 text-left min-h-[44px]"
                disabled={pending}
              >
                <b>{u.name}</b>
                <br />
                <span className="text-(--muted) text-sm">
                  {u.roleLabel} · {u.pin}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
