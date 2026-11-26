"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import * as store from "@/lib/store";
import type { IngredientPatch } from "@/lib/store";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Ocurrió un error.";
}

export async function updateIngredientAction(ingredientId: string, patch: IngredientPatch) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Tu sesión terminó. Vuelve a entrar con tu PIN." };
    store.updateIngredient(user, ingredientId, patch);
    revalidatePath("/insumos");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}
