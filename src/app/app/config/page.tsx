"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getUser } from "@/lib/session";

const configLinks = [
  { href: "/app/config/bancos", label: "Bancos" },
  { href: "/app/config/produtos", label: "Produtos" },
  { href: "/app/config/lojas", label: "Lojas" },
  { href: "/app/config/regioes", label: "Regiões" },
  { href: "/app/config/templates", label: "Templates" },
];

export default function ConfigPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user?.role !== "GESTAO") {
      router.replace("/app");
    }
  }, [router]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">
          Gerencie cadastros e templates do sistema.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {configLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
          >
            {link.label}
          </Link>
        ))}
      </div>
export default function ConfigPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Configurações</h1>
      <p className="mt-2 text-sm text-slate-500">Área em construção.</p>
    </div>
  );
}
