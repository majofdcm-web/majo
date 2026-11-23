import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, listModifierGroups, listProductsByCategory, listStaffConsumptions, listUsers } from "@/lib/store";
import PersonalView from "@/components/personal-view";

export default async function PersonalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "personal")) redirect("/sin-permisos");

  return (
    <PersonalView
      users={listUsers()}
      catalog={listProductsByCategory()}
      modifierGroups={listModifierGroups()}
      recent={listStaffConsumptions()}
    />
  );
}
