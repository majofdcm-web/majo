"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import * as store from "@/lib/store";
import type { SelectedModifier } from "@/lib/types";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu sesión terminó. Vuelve a entrar con tu PIN.");
  return user;
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Ocurrió un error.";
}

export async function openTableAction(tableId: string) {
  try {
    const user = await requireUser();
    const order = store.openTable(user, tableId);
    revalidatePath("/mesas");
    return { ok: true as const, orderId: order.id };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}

export async function closeEmptyOrderAction(orderId: string) {
  try {
    const user = await requireUser();
    store.closeEmptyOrder(user, orderId);
    revalidatePath("/mesas");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}

export async function setCustomerAction(orderId: string, customerName: string) {
  try {
    const user = await requireUser();
    store.setOrderCustomer(user, orderId, customerName);
    revalidatePath(`/mesas/orden/${orderId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}

export async function setPeopleAction(orderId: string, people: number) {
  try {
    const user = await requireUser();
    store.setOrderPeople(user, orderId, people);
    revalidatePath(`/mesas/orden/${orderId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}

export async function addItemAction(
  orderId: string,
  productId: string,
  selected: SelectedModifier[],
  qty: number,
  note: string,
) {
  try {
    const user = await requireUser();
    store.addItem(user, orderId, productId, selected, qty, note);
    revalidatePath(`/mesas/orden/${orderId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}

export async function removeItemAction(orderId: string, itemUid: string, authorizerPin?: string) {
  try {
    const user = await requireUser();
    const order = store.getOrder(orderId);
    if (!order) return { ok: false as const, error: "La orden ya no existe." };
    const item = order.items.find((i) => i.uid === itemUid);

    if (item && item.status !== "pendiente") {
      if (!authorizerPin) return { ok: false as const, needsAuth: true as const };
      const authorizer = store.findAuthorizer(authorizerPin);
      if (!authorizer) return { ok: false as const, error: "Ese PIN no puede autorizar cancelaciones." };
    }

    store.removeItem(user, orderId, itemUid);
    revalidatePath(`/mesas/orden/${orderId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}

export async function sendToKitchenAction(orderId: string) {
  try {
    const user = await requireUser();
    store.sendToKitchen(user, orderId);
    revalidatePath(`/mesas/orden/${orderId}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errMsg(e) };
  }
}
