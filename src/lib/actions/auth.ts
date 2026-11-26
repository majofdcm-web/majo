"use server";

import { redirect } from "next/navigation";
import { findUserByPin, loginAttemptStatus } from "@/lib/store";
import { clearCurrentUser, getDeviceId, setCurrentUser } from "@/lib/session";
import { firstAllowedPath } from "@/lib/nav";

export async function loginWithPin(
  pin: string,
): Promise<{ ok: false; error: string } | undefined> {
  const deviceId = await getDeviceId();
  const status = loginAttemptStatus(deviceId);
  if (status.locked) {
    const mins = Math.ceil(status.remainingMs / 60000);
    return {
      ok: false,
      error: `Demasiados intentos. Espera ${mins} minuto(s) e inténtalo otra vez.`,
    };
  }

  const user = findUserByPin(pin, deviceId);
  if (!user) {
    return { ok: false, error: "PIN incorrecto." };
  }

  await setCurrentUser(user.id);
  redirect(firstAllowedPath(user));
}

export async function logout() {
  await clearCurrentUser();
  redirect("/");
}
