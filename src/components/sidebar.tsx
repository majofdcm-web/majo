"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

export default function Sidebar({
  userName,
  roleLabel,
  items,
}: {
  userName: string;
  roleLabel: string;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="w-full md:w-56 flex-none bg-white border-b md:border-b-0 md:border-r border-(--line) p-3 flex md:flex-col gap-1 overflow-x-auto">
      <div className="hidden md:block px-2 pt-1 pb-3 mb-1 border-b border-(--line)">
        <div className="font-semibold text-xl">Café Akii</div>
        <div className="text-sm text-(--muted) mt-1">
          {userName} · {roleLabel}
        </div>
      </div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`min-h-[44px] flex items-center px-3 rounded-xl whitespace-nowrap ${
            pathname.startsWith(item.href)
              ? "bg-(--teal-t) text-(--teal) font-semibold"
              : "hover:bg-(--bg)"
          }`}
        >
          {item.label}
        </Link>
      ))}
      <form action={logout} className="md:mt-auto">
        <button type="submit" className="btn btn-sm w-full md:w-auto whitespace-nowrap">
          Cambiar usuario
        </button>
      </form>
    </nav>
  );
}
