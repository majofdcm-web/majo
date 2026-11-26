"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import * as store from "@/lib/store";
import type { ExpenseCategory, ExpenseOrigin } from "@/lib/types";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Ocurrió un error.";
}

export async function registerExpenseAction(input: {
  description: string;
  amount: number;
  supplier: string;
  origin: ExpenseOrigin;
  category: ExpenseCategory;
  hasInvoice: boolean;
  stockPurchase?: { ingredientId: string; quantity: number };
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, error: "Tu sesión terminó. Vuelve a entrar con tu PIN." };
    if (!input.description.trim()) return { ok: false as const, error: "Falta la descripción del gasto." };
    if (!(input.amount > 0)) return { ok: false as const, error: "El monto debe ser mayor a cero." };
    store.registerExpense(user, input);
    revalidatePath("/gastos");
    revalidatePath("/corte");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}
