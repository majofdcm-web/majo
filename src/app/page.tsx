import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { firstAllowedPath } from "@/lib/nav";
import { DEMO_PINS } from "@/lib/seed";
import { ROLE_LABEL } from "@/lib/types";
import PinScreen from "@/components/pin-screen";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(firstAllowedPath(user));

  const demoUsers = DEMO_PINS.map((u) => ({
    name: u.name,
    roleLabel: ROLE_LABEL[u.role],
    pin: u.pin,
  }));

  return <PinScreen demoUsers={demoUsers} />;
}
