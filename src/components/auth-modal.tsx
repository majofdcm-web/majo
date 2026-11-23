"use client";

import { useState } from "react";

export default function AuthModal({
  title,
  reason,
  onCancel,
  onSubmit,
}: {
  title: string;
  reason: string;
  onCancel: () => void;
  onSubmit: (pin: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [buf, setBuf] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function press(k: string) {
    if (busy) return;
    if (k === "x") {
      onCancel();
      return;
    }
    if (k === "del") {
      setBuf((b) => b.slice(0, -1));
      return;
    }
    const next = (buf + k).slice(0, 4);
    setBuf(next);
    if (next.length === 4) {
      setBusy(true);
      const res = await onSubmit(next);
      setBusy(false);
      if (!res.ok) {
        setError(res.error ?? "Ese PIN no puede autorizar.");
        setBuf("");
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-50" role="dialog" aria-label={title}>
      <div className="bg-white rounded-[20px] w-full max-w-[420px] p-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-(--muted) text-sm -mt-2">{reason}</p>
        <div className="flex gap-3 justify-center">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                i < buf.length ? "bg-(--teal) border-(--teal)" : "border-[#8A8780]"
              }`}
            />
          ))}
        </div>
        <p className="text-(--red) text-sm text-center min-h-5">{error}</p>
        <div className="grid grid-cols-3 gap-3 mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => press(String(n))}
              disabled={busy}
              className="h-[62px] w-[80px] rounded-2xl border border-(--line) text-xl font-semibold"
            >
              {n}
            </button>
          ))}
          <button onClick={() => press("x")} className="h-[62px] w-[80px] rounded-2xl border border-(--line) text-sm">
            Cancelar
          </button>
          <button
            onClick={() => press("0")}
            disabled={busy}
            className="h-[62px] w-[80px] rounded-2xl border border-(--line) text-xl font-semibold"
          >
            0
          </button>
          <span />
        </div>
      </div>
    </div>
  );
}
