"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import * as store from "@/lib/store";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Ocurrió un error.";
}

export async function openShiftAction(fund: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Tu sesión terminó. Vuelve a entrar con tu PIN." };
    store.openShift(user, fund);
    revalidatePath("/corte");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}

export async function closeShiftAction(counted: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Tu sesión terminó. Vuelve a entrar con tu PIN." };
    const count = store.closeShift(user, counted);
    revalidatePath("/corte");
    return { ok: true as const, difference: count.difference };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}
