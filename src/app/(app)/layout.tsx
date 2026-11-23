import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { allowedNav } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/types";
import Sidebar from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const nav = allowedNav(user).map(({ href, label }) => ({ href, label }));

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="no-print contents">
        <Sidebar userName={user.name} roleLabel={ROLE_LABEL[user.role]} items={nav} />
      </div>
      <main className="flex-1 min-w-0 p-4 md:p-6 flex flex-col gap-4">
        <div className="no-print bg-(--orange-t) text-(--orange) text-sm px-4 py-2 rounded-xl">
          Prototipo con datos de prueba. Los cambios se guardan solo en este servidor de pruebas.
        </div>
        {children}
      </main>
    </div>
  );
}
