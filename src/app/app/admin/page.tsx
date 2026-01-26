"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getUser } from "@/lib/session";

export default function AdminPage() {
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
        <h1 className="text-xl font-semibold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-500">
          Atalhos para ações administrativas disponíveis para a gestão.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">
          Ações disponíveis
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Transferir propostas para outro operador.</li>
          <li>Ajustar status de propostas com justificativa.</li>
          <li>Reabrir pendências resolvidas quando necessário.</li>
        </ul>
      </section>
    </div>
  );
}
