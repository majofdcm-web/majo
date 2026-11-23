export default function SinPermisos() {
  return (
    <div className="card">
      <h1 className="text-xl font-semibold">No tienes permiso para ver esto</h1>
      <p className="text-(--muted) mt-2">
        Tu usuario no tiene permiso para esta sección. Pide a un
        administrador que revise tus permisos en &quot;Usuarios y permisos&quot;.
      </p>
    </div>
  );
}
