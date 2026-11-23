"use server";

import { getCurrentUser } from "@/lib/session";
import * as store from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Ocurrió un error.";
}

export async function authorizeDiscountAction(pin: string) {
  const authorizer = store.findAuthorizer(pin);
  if (!authorizer) return { ok: false as const, error: "Ese PIN no puede autorizar descuentos." };
  return { ok: true as const, id: authorizer.id, name: authorizer.name };
}

export async function payOrderAction(
  orderId: string,
  input: { method: PaymentMethod; tip: number; discount: number; discountAuthorizerId: string | null },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Tu sesión terminó. Vuelve a entrar con tu PIN." };
    const sale = store.payOrder(user, orderId, input);
    return { ok: true as const, saleId: sale.id };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}
