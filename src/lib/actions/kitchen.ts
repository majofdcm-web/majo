"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import * as store from "@/lib/store";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Ocurrió un error.";
}

export async function markItemReadyAction(orderId: string, itemUid: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Tu sesión terminó. Vuelve a entrar con tu PIN." };
    store.markItemReady(user, orderId, itemUid);
    revalidatePath("/barra");
    revalidatePath(`/mesas/orden/${orderId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}
