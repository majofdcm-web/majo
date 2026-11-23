import "server-only";
import { cookies } from "next/headers";
import { getUser } from "@/lib/store";
import type { User } from "@/lib/types";
import { DEVICE_COOKIE, USER_COOKIE } from "@/lib/constants";

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(USER_COOKIE)?.value;
  if (!id) return null;
  return getUser(id);
}

export async function getDeviceId(): Promise<string> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value ?? "dispositivo-desconocido";
}

export async function setCurrentUser(userId: string) {
  const store = await cookies();
  store.set(USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearCurrentUser() {
  const store = await cookies();
  store.delete(USER_COOKIE);
}
