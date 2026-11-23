"use client";

import { useState, useTransition } from "react";
import { setRolePermissionAction } from "@/lib/actions/users";
import type { Permission, Role, User } from "@/lib/types";
import { PERMISSION_LABEL, ROLE_LABEL } from "@/lib/types";

const EDITABLE_ROLES: Role[] = ["mesero", "barra", "caja", "gerente"];

export default function UsuariosView({
  users,
  perms,
  rolePerms,
}: {
  users: User[];
  perms: Permission[];
  rolePerms: Record<Role, Permission[]>;
}) {
  const [grid, setGrid] = useState(rolePerms);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle(role: Role, perm: Permission) {
    const enabled = !(grid[role] ?? []).includes(perm);
    setGrid((g) => {
      const current = new Set(g[role] ?? []);
      if (enabled) current.add(perm);
      else current.delete(perm);
      return { ...g, [role]: [...current] };
    });
    setError("");
    startTransition(async () => {
      const res = await setRolePermissionAction(role, perm, enabled);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Usuarios y permisos</h1>

      <div className="card flex flex-col gap-2 max-w-2xl">
        <p className="label">Usuarios</p>
        {users.map((u) => (
          <div key={u.id} className="flex justify-between text-sm py-1.5 border-b border-(--line) last:border-none">
            <span>{u.name}</span>
            <span className="text-(--muted)">{ROLE_LABEL[u.role]}</span>
          </div>
        ))}
        <p className="text-xs text-(--muted) mt-1">
          El PIN de cada quien se guarda cifrado. Para cambiar o crear usuarios y PIN, pídele a Majo que lo haga contigo cuando conectemos la base de datos real.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <p className="label mb-3">Permisos por rol</p>
        {error && <p className="text-(--red) text-sm mb-2">{error}</p>}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 text-xs font-semibold uppercase text-(--muted) border-b border-(--line)">
                Permiso
              </th>
              {EDITABLE_ROLES.map((r) => (
                <th key={r} className="p-2 text-xs font-semibold uppercase text-(--muted) border-b border-(--line)">
                  {ROLE_LABEL[r]}
                </th>
              ))}
              <th className="p-2 text-xs font-semibold uppercase text-(--muted) border-b border-(--line)">Admin</th>
            </tr>
          </thead>
          <tbody>
            {perms.map((perm) => (
              <tr key={perm}>
                <td className="p-2 border-b border-(--line)">{PERMISSION_LABEL[perm]}</td>
                {EDITABLE_ROLES.map((role) => (
                  <td key={role} className="p-2 border-b border-(--line) text-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5"
                      checked={(grid[role] ?? []).includes(perm)}
                      onChange={() => toggle(role, perm)}
                    />
                  </td>
                ))}
                <td className="p-2 border-b border-(--line) text-center text-(--muted)">✓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
