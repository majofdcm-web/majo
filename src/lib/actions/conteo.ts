"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import * as store from "@/lib/store";
import type { PhysicalCountInput } from "@/lib/store";
import type { Ingredient } from "@/lib/types";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Ocurrió un error.";
}

export async function submitPhysicalCountAction(area: Ingredient["area"], counts: PhysicalCountInput[]) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Tu sesión terminó. Vuelve a entrar con tu PIN." };
    const record = store.submitPhysicalCount(user, area, counts);
    revalidatePath("/conteo");
    revalidatePath("/insumos");

    // Quien no tiene permiso de inventario no ve la cantidad del sistema ni la diferencia.
    if (!store.can(user, "inventario")) {
      return { ok: true as const, lines: null };
    }
    return { ok: true as const, lines: record.lines };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}
