import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { can, listRolePerms, listUsers } from "@/lib/store";
import { PERMISSION_LABEL } from "@/lib/types";
import type { Permission } from "@/lib/types";
import UsuariosView from "@/components/usuarios-view";

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user, "usuarios")) redirect("/sin-permisos");

  const perms = Object.keys(PERMISSION_LABEL) as Permission[];

  return <UsuariosView users={listUsers()} perms={perms} rolePerms={listRolePerms()} />;
}
