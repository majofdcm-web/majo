import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, getCurrentShift, shiftNumbers } from "@/lib/store";
import CorteView from "@/components/corte-view";

export default async function CortePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "corte")) redirect("/sin-permisos");

  const shift = getCurrentShift();
  const numbers = shift ? shiftNumbers(shift) : null;

  return (
    <CorteView
      shift={shift ? { openedAt: shift.openedAt, fund: shift.fund, openedBy: shift.openedBy } : null}
      numbers={numbers}
    />
  );
}
