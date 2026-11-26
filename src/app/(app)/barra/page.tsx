import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, listKitchenItems } from "@/lib/store";
import BarraView from "@/components/barra-view";

export default async function BarraPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "barra")) redirect("/sin-permisos");

  return <BarraView items={listKitchenItems()} />;
}
