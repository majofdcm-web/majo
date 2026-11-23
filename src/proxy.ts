import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEVICE_COOKIE } from "@/lib/constants";

/** Da a cada dispositivo (compu de caja, tablet, celular) un id estable,
 * usado solo para bloquear intentos de PIN fallidos por dispositivo. */
export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  if (!request.cookies.get(DEVICE_COOKIE)) {
    res.cookies.set(DEVICE_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: "/:path*",
};
